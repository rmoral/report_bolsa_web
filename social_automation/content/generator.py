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


# LinkedIn disabled for testing. Instagram disabled until image generation is integrated.
ACTIVE_PLATFORMS = [Platform.TWITTER]


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


# Platforms to generate AFTER a Twitter post is published (secondary flow).
# Add Platform.LINKEDIN or Platform.INSTAGRAM here when ready to activate them.
SECONDARY_PLATFORMS: List[Platform] = [Platform.LINKEDIN]


def _build_secondary_prompt(
    news: NewsItem, tweet_post: Post, platform: Platform, language: str
) -> str:
    """Prompt for secondary platforms that references the already-published tweet."""
    spec = PLATFORM_SPECS[platform]
    lang_name = LANGUAGE_NAMES.get(language, "English")
    return (
        f"Create a {spec['name']} post in {lang_name} based on this news.\n\n"
        f"NEWS TITLE: {news.title}\n"
        f"SOURCE: {news.source}\n"
        f"DESCRIPTION: {news.description or 'No additional details.'}\n\n"
        f"REFERENCE — this was already published on X/Twitter about the same news:\n"
        f"\"\"\"\n{tweet_post.full_content}\n\"\"\"\n\n"
        f"Expand and adapt the above for {spec['name']}. "
        f"Do NOT simply copy the tweet — use it as a starting point and develop it "
        f"according to the platform's style and audience.\n\n"
        f"Style guidelines: {spec['style']}\n\n"
        f"{spec['format']}"
    )


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def _generate_secondary_sync(news: NewsItem, tweet_post: Post, platform: Platform) -> Post:
    """Generate a secondary platform post referencing the published tweet."""
    response = _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": _build_secondary_prompt(
                    news, tweet_post, platform, config.content_language
                ),
            }
        ],
    )
    raw_text = response.content[0].text
    content, hashtags, image_prompt = _parse_response(raw_text)

    if not content:
        raise ValueError(f"Empty content for secondary platform={platform}")

    return Post(
        news_item_id=news.id,
        platform=platform,
        content=content,
        hashtags=hashtags,
        image_prompt=image_prompt,
        run_id=news.run_id,
    )


async def generate_secondary_posts(tweet_post: Post) -> List[Post]:
    """
    Generate posts for SECONDARY_PLATFORMS using a published tweet as reference.
    Called automatically after a Twitter post is successfully published.
    """
    if not SECONDARY_PLATFORMS:
        return []

    news = tweet_post.news_item
    if not news:
        logger.warning("tweet_post id=%d has no news_item loaded", tweet_post.id)
        return []

    loop = asyncio.get_event_loop()
    tasks = [
        loop.run_in_executor(None, _generate_secondary_sync, news, tweet_post, platform)
        for platform in SECONDARY_PLATFORMS
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    posts: List[Post] = []
    for platform, result in zip(SECONDARY_PLATFORMS, results):
        if isinstance(result, Exception):
            logger.error("Secondary generation failed platform=%s: %s", platform, result)
        else:
            posts.append(result)
            logger.info("Generated secondary %s post from tweet id=%d", platform, tweet_post.id)
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
