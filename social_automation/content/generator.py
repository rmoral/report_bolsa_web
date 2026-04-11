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
            "Write one sharp, self-contained statement that captures the core of the news. "
            "Maximum 240 characters excluding hashtags. "
            "No emojis, no dashes, no exclamation marks. "
            "State the fact plainly, then optionally add a brief implication or question. "
            "2-3 hashtags, lowercase, specific to the topic (not generic like #news or #finance). "
            "Sound like a market analyst tweeting from a terminal, not a brand account."
        ),
        "format": (
            "Return ONLY:\n"
            "TEXT: <tweet text, max 240 chars, no hashtags here>\n"
            "HASHTAGS: <2-3 hashtags>\n"
            "IMAGE_PROMPT: <photorealistic scene or chart that illustrates this news>"
        ),
    },
    Platform.LINKEDIN: {
        "name": "LinkedIn",
        "max_chars": 3000,
        "style": (
            "Write 3 to 4 paragraphs for a professional audience of investors, executives, "
            "and analysts. "
            "Open with the single most important fact of the story, no preamble. "
            "Second paragraph provides context: why this matters, what preceded it. "
            "Third paragraph offers a concrete implication for markets, policy, or business. "
            "Optional fourth paragraph closes with a direct, specific question for discussion. "
            "No bullet points, no numbered lists, no emojis, no dashes as decoration. "
            "Paragraphs separated by a single blank line. "
            "3-5 hashtags at the very end on their own line, no other decoration. "
            "Tone: authoritative, measured, direct. Like a piece you would read in the FT."
        ),
        "format": (
            "Return ONLY:\n"
            "TEXT: <full LinkedIn post, plain paragraphs>\n"
            "HASHTAGS: <3-5 hashtags>\n"
            "IMAGE_PROMPT: <description of a clean data visualization or news photograph>"
        ),
    },
    Platform.INSTAGRAM: {
        "name": "Instagram",
        "max_chars": 2200,
        "style": (
            "Write a caption for a financially literate but general audience. "
            "First sentence must be a standalone hook visible before the fold, no emojis. "
            "Follow with 2-3 short paragraphs explaining the news and its relevance. "
            "Close with one direct question to drive comments. "
            "No emojis, no decorative symbols. "
            "5-8 specific, lowercase hashtags at the end."
        ),
        "format": (
            "Return ONLY:\n"
            "TEXT: <Instagram caption>\n"
            "HASHTAGS: <5-8 hashtags>\n"
            "IMAGE_PROMPT: <vivid, photorealistic visual that could accompany this story>"
        ),
    },
}

SYSTEM_PROMPT = """You are a senior financial journalist and social media strategist with 15 years \
of experience covering global markets, economics, and geopolitics for institutional audiences.

Your writing rules — follow them without exception:
- Always write in English, regardless of the source language of the news.
- Write as a knowledgeable human professional, not as an AI assistant.
- Never use emojis, bullet points, numbered lists, or decorative symbols.
- Never use double dashes (--) or em dashes (—) as stylistic devices.
- Never use filler phrases like "In conclusion", "It is worth noting", "Notably", \
"It's important to highlight", "Dive into", "Game-changer", or "Landscape".
- Never use vague superlatives like "significant", "crucial", "pivotal", or "transformative" \
unless backed by specific data.
- Lead with the most important fact. Do not bury the news in context.
- Use precise numbers, percentages, and named sources when available.
- Write in short, declarative sentences. Vary sentence length for rhythm.
- Sound like a Reuters or FT journalist, not a marketing copywriter.
- Never fabricate data. Only use information explicitly provided.
"""


def _build_user_prompt(news: NewsItem, platform: Platform) -> str:
    spec = PLATFORM_SPECS[platform]
    return f"""Write a {spec['name']} post in English about the following news story.

NEWS TITLE: {news.title}
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
                "content": _build_user_prompt(news, platform),
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


def _build_secondary_prompt(news: NewsItem, tweet_post: Post, platform: Platform) -> str:
    """Prompt for secondary platforms that references the already-published tweet."""
    spec = PLATFORM_SPECS[platform]
    return (
        f"Write a {spec['name']} post in English based on this news story.\n\n"
        f"NEWS TITLE: {news.title}\n"
        f"SOURCE: {news.source}\n"
        f"DESCRIPTION: {news.description or 'No additional details.'}\n\n"
        f"This was already published on X/Twitter about the same story — use it as "
        f"a factual reference only, do not copy its phrasing:\n"
        f"\"\"\"\n{tweet_post.full_content}\n\"\"\"\n\n"
        f"Expand and rewrite for {spec['name']}. The tone and structure must match "
        f"the platform's audience. Do not reproduce the tweet verbatim.\n\n"
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
                "content": _build_secondary_prompt(news, tweet_post, platform),
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
