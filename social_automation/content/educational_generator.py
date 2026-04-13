"""
Generates educational financial content not tied to a specific news item.

Used by the /educational Telegram command to create standalone posts
explaining market concepts, investment strategies, and economic topics
for X, LinkedIn, and the blog.
"""
import logging
from typing import Tuple

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.config import config
from social_automation.database.models import Platform, Post

logger = logging.getLogger(__name__)

_client = OpenAI(api_key=config.openai_api_key)

# ── Suggested topics shown to the user ───────────────────────────────────────
SUGGESTED_TOPICS = [
    "How the Federal Reserve controls interest rates and why it matters for stocks",
    "What is the yield curve and what does an inversion signal?",
    "P/E ratio explained: how to use it to value a stock",
    "What is inflation and how does it affect your portfolio?",
    "Dollar-cost averaging: the simplest strategy for long-term investors",
    "How to read an earnings report: the 5 numbers that matter",
    "What are index funds and why most active managers underperform them?",
    "Understanding market cycles: bull, bear, correction, and recovery",
    "What is the VIX and why traders call it the 'fear index'?",
    "How bond yields affect stock valuations",
    "Diversification: why it reduces risk without sacrificing returns",
    "What happens to markets during a recession?",
    "Growth vs. value stocks: key differences and when each outperforms",
    "How OPEC decisions move oil prices and energy stocks",
    "What are tariffs and how do trade wars affect markets?",
]

SYSTEM_PROMPT = """You are a senior financial educator and strategist writing for a financially \
literate audience of retail investors, professionals, and market enthusiasts.

Your writing rules — follow them without exception:
- Always write in English.
- Write as a knowledgeable human professional, not as an AI assistant.
- Never use emojis, bullet points, numbered lists, or decorative symbols.
- Never use double dashes or em dashes as stylistic devices.
- Never use filler phrases: "In conclusion", "It is worth noting", "Game-changer", "Landscape".
- Never use vague superlatives: "significant", "crucial", "pivotal", "transformative".
- Use precise numbers, historical examples, and named sources when available.
- Write in short, declarative sentences. Vary sentence length.
- Tone: authoritative, clear, educational — like a piece in the FT or The Economist.
- Never fabricate data.
"""

PLATFORM_SPECS = {
    Platform.TWITTER: {
        "style": (
            "Write a single, self-contained insight about the topic. "
            "Maximum 240 characters excluding hashtags. "
            "Must be immediately useful — a fact, a rule of thumb, or a counter-intuitive insight. "
            "2-3 specific hashtags, lowercase. "
            "Sound like a seasoned market professional sharing wisdom, not teaching a class."
        ),
        "format": (
            "Return ONLY:\n"
            "TEXT: <tweet, max 240 chars, no hashtags>\n"
            "HASHTAGS: <2-3 hashtags>\n"
            "IMAGE_PROMPT: <clean data-visualization or financial concept illustration>"
        ),
    },
    Platform.LINKEDIN: {
        "style": (
            "Write 4-5 paragraphs for professionals and investors. "
            "Open with the single most important insight about the topic — no preamble. "
            "Second paragraph provides context and background. "
            "Third paragraph explains the practical implication for investors or professionals. "
            "Fourth paragraph gives a concrete historical example or data point. "
            "Optional fifth paragraph closes with a direct, specific discussion question. "
            "No bullet points, no lists, no emojis. Paragraphs separated by a blank line. "
            "3-5 hashtags at the end on their own line."
        ),
        "format": (
            "Return ONLY:\n"
            "TEXT: <full LinkedIn post, plain paragraphs>\n"
            "HASHTAGS: <3-5 hashtags>\n"
            "IMAGE_PROMPT: <clean chart or infographic concept>"
        ),
    },
}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def _generate_sync(topic: str, platform: Platform) -> Tuple[str, str, str]:
    """Call GPT and return (content, hashtags, image_prompt)."""
    spec = PLATFORM_SPECS[platform]
    user_prompt = (
        f"Write a {platform.value.capitalize()} educational post about the following topic.\n\n"
        f"TOPIC: {topic}\n\n"
        f"Style guidelines: {spec['style']}\n\n"
        f"{spec['format']}"
    )
    response = _client.chat.completions.create(
        model=config.openai_model,
        max_tokens=1024,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    raw = response.choices[0].message.content or ""
    return _parse(raw)


def _parse(text: str) -> Tuple[str, str, str]:
    content = hashtags = image_prompt = ""
    current_key = None
    buffer: list[str] = []

    def flush():
        nonlocal content, hashtags, image_prompt
        val = "\n".join(buffer).strip()
        if current_key == "TEXT":
            content = val
        elif current_key == "HASHTAGS":
            hashtags = val
        elif current_key == "IMAGE_PROMPT":
            image_prompt = val

    for line in text.strip().split("\n"):
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


def generate_educational_posts(topic: str, run_id: str) -> list[Post]:
    """
    Generate educational posts for Twitter and LinkedIn about the given topic.
    Returns a list of unsaved Post objects (no news_item_id).
    """
    posts: list[Post] = []
    for platform in [Platform.TWITTER, Platform.LINKEDIN]:
        try:
            content, hashtags, image_prompt = _generate_sync(topic, platform)
            if not content:
                logger.warning("Empty content for educational post platform=%s", platform)
                continue
            posts.append(Post(
                news_item_id=None,          # Educational posts have no source news item
                platform=platform,
                content=content,
                hashtags=hashtags,
                image_prompt=image_prompt,
                run_id=run_id,
            ))
            logger.info("Generated educational %s post for topic: %s", platform.value, topic[:50])
        except Exception as exc:
            logger.error("Educational generation failed platform=%s: %s", platform, exc)
    return posts
