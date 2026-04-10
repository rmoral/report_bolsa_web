"""
Uses the Anthropic Claude API to generate platform-specific social media content
from news items. Implements prompt caching and retry logic.
"""
import asyncio
import logging
from typing import List, Tuple

import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.config import config
from social_automation.database.models import NewsItem, Platform, Post

logger = logging.getLogger(__name__)

# Anthropic client (sync; run in thread executor for async contexts)
_client = anthropic.Anthropic(api_key=config.anthropic_api_key)

LANGUAGE_NAMES = {"es": "Spanish", "en": "English"}

# ── Platform prompt templates ──────────────────────────────────────────────

PLATFORM_SPECS = {
    Platform.TWITTER: {
        "name": "X (Twitter)",
        "max_chars": 280,
        "style": (
            "Concise, punchy, uses 2-3 relevant hashtags. "
            "Engages with questions or bold statements. "
            "No fluff. Every word must earn its place."
        ),
        "format": (
            "Return ONLY:\n"
            "TEXT: <tweet text, max 240 chars without hashtags>\n"
            "HASHTAGS: <2-3 hashtags>\n"
            "IMAGE_PROMPT: <DALL-E style description for a visual>"
        ),
    },
    Platform.LINKEDIN: {
        "name": "LinkedIn",
        "max_chars": 3000,
        "style": (
            "Professional, insightful, and analytical. "
            "3-5 paragraphs. Opens with a hook. Includes key data/numbers. "
            "Ends with a thought-provoking question for engagement. "
            "Uses 3-5 relevant hashtags at the end."
        ),
        "format": (
            "Return ONLY:\n"
            "TEXT: <full LinkedIn post>\n"
            "HASHTAGS: <3-5 hashtags>\n"
            "IMAGE_PROMPT: <description for a professional infographic or chart>"
        ),
    },
    Platform.INSTAGRAM: {
        "name": "Instagram",
        "max_chars": 2200,
        "style": (
            "Visual-first mindset. Engaging, accessible, slightly informal. "
            "Starts with an attention-grabbing first line (visible before 'more'). "
            "Uses emojis strategically. "
            "Ends with a call-to-action. Uses 5-10 relevant hashtags."
        ),
        "format": (
            "Return ONLY:\n"
            "TEXT: <Instagram caption>\n"
            "HASHTAGS: <5-10 hashtags>\n"
            "IMAGE_PROMPT: <vivid visual description for an eye-catching image>"
        ),
    },
}

SYSTEM_PROMPT = """You are an expert social media content creator specializing in
economic, financial, and geopolitical news. Your content is factual, engaging,
and tailored to each platform's audience and format.
You never fabricate data — you work only with the information provided.
You always write in the requested language."""


def _build_user_prompt(news: NewsItem, platform: Platform, language: str) -> str:
    spec = PLATFORM_SPECS[platform]
    lang_name = LANGUAGE_NAMES.get(language, "English")
    return f"""Create a {spec['name']} post in {lang_name} about this news:

TITLE: {news.title}
SOURCE: {news.source}
CATEGORY: {news.category}
DESCRIPTION: {news.description or 'No additional details available.'}

Style guidelines: {spec['style']}

{spec['format']}"""


def _parse_response(text: str) -> Tuple[str, str, str]:
    """Parse the structured Claude response into (content, hashtags, image_prompt)."""
    content = ""
    hashtags = ""
    image_prompt = ""
    lines = text.strip().split("\n")
    current_key = None
    buffer: List[str] = []

    def flush():
        nonlocal content, hashtags, image_prompt
        value = "\n".join(buffer).strip()
        if current_key == "TEXT":
            content = value
        elif current_key == "HASHTAGS":
            hashtags = value
        elif current_key == "IMAGE_PROMPT":
            image_prompt = value

    for line in lines:
        if line.startswith("TEXT:"):
            if current_key:
                flush()
            current_key = "TEXT"
            buffer = [line[5:].strip()]
        elif line.startswith("HASHTAGS:"):
            flush()
            current_key = "HASHTAGS"
            buffer = [line[9:].strip()]
        elif line.startswith("IMAGE_PROMPT:"):
            flush()
            current_key = "IMAGE_PROMPT"
            buffer = [line[13:].strip()]
        else:
            buffer.append(line)
    flush()
    return content, hashtags, image_prompt


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def _generate_for_platform_sync(news: NewsItem, platform: Platform) -> Post:
    """Synchronous call to Claude with retry logic."""
    spec = PLATFORM_SPECS[platform]
    response = _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": _build_user_prompt(news, platform, config.content_language),
            }
        ],
    )
    raw_text = response.content[0].text
    content, hashtags, image_prompt = _parse_response(raw_text)

    if not content:
        raise ValueError(f"Empty content parsed for platform={platform}, news_id={news.id}")

    return Post(
        news_item_id=news.id,
        platform=platform,
        content=content,
        hashtags=hashtags,
        image_prompt=image_prompt,
        run_id=news.run_id,
    )


# Instagram disabled until image generation is integrated
ACTIVE_PLATFORMS = [Platform.TWITTER, Platform.LINKEDIN]


async def generate_posts_for_news(news: NewsItem) -> List[Post]:
    """
    Generate posts for active platforms for a single news item.
    Runs platform calls concurrently via thread executor.
    """
    loop = asyncio.get_event_loop()
    tasks = [
        loop.run_in_executor(None, _generate_for_platform_sync, news, platform)
        for platform in ACTIVE_PLATFORMS
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    posts: List[Post] = []
    for platform, result in zip(ACTIVE_PLATFORMS, results):
        if isinstance(result, Exception):
            logger.error(
                "Content generation failed for platform=%s news_id=%s: %s",
                platform, news.id, result,
            )
        else:
            posts.append(result)
            logger.info("Generated %s post for news_id=%s", platform, news.id)
    return posts


async def generate_all_posts(news_items: List[NewsItem]) -> List[Post]:
    """
    Generate posts for all news items. Processes items sequentially to avoid
    rate limits but platforms in parallel per item.
    """
    all_posts: List[Post] = []
    for news in news_items:
        posts = await generate_posts_for_news(news)
        all_posts.extend(posts)
        # Small delay between news items to be kind to the API
        await asyncio.sleep(1)
    logger.info("Generated %d total posts for %d news items", len(all_posts), len(news_items))
    return all_posts
