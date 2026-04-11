"""
Generates SEO-optimized blog posts from published social media posts
using GPT-4.1-mini. Returns structured content ready for Payload CMS.
"""
import logging
import re
from dataclasses import dataclass
from typing import Optional

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.config import config
from social_automation.database.models import Post

logger = logging.getLogger(__name__)

_client = OpenAI(api_key=config.openai_api_key)

BLOG_SYSTEM_PROMPT = """You are a senior financial journalist writing for earlymarketreports.com, \
a professional publication covering global markets, economics, and geopolitics.

Your writing rules:
- Write exclusively in English.
- Target audience: institutional investors, financial professionals, and informed general readers.
- Tone: authoritative, precise, and analytical. Like the Financial Times or Reuters.
- No emojis, no bullet points in prose, no decorative symbols.
- No AI filler phrases: no "game-changer", "pivotal", "it is worth noting", "delve into", \
"landscape", "transformative", "crucial", "significant" unless backed by specific data.
- Use short declarative sentences. Vary rhythm. Lead with the most important fact.
- Structure every article with clear H2 section headings.
- Always include specific numbers, percentages, dates, and named institutions when available.
- The article must read as written by a human expert, not a content generator.
- Optimize for SEO: include the focus keyword naturally in the title, first paragraph, \
at least two H2 headings, and the conclusion.
- Target length: 900-1200 words.
"""


@dataclass
class BlogPost:
    title: str
    slug: str
    meta_description: str
    focus_keyword: str
    content_markdown: str
    image_prompt: str


def _build_prompt(posts: list[Post]) -> str:
    news_blocks = []
    for i, post in enumerate(posts, 1):
        news_title = post.news_item.title if post.news_item else "Unknown"
        news_desc = post.news_item.description if post.news_item else ""
        news_blocks.append(
            f"SOURCE {i}:\nHeadline: {news_title}\nContext: {news_desc or post.content}"
        )

    sources = "\n\n".join(news_blocks)

    return f"""Write a complete SEO-optimized blog article for earlymarketreports.com \
based on the following news sources. Synthesize them into a coherent, analytical piece.

{sources}

Return your response in this EXACT format — do not add extra keys or change the labels:

TITLE: <SEO title, 55-65 characters, includes focus keyword>
SLUG: <URL-friendly slug, lowercase, hyphens only, 4-6 words>
META_DESCRIPTION: <155 characters max, includes keyword, compelling>
FOCUS_KEYWORD: <primary SEO keyword phrase, 2-4 words>
IMAGE_PROMPT: <photorealistic editorial image description for DALL-E, no text>
CONTENT:
<Full article in Markdown. Use ## for section headings, ### for subsections. \
Plain paragraphs only — no bullet lists in the main body. \
Minimum 5 sections plus introduction and conclusion. \
900-1200 words total.>"""


def _parse_response(raw: str) -> BlogPost:
    """Parse the structured GPT response into a BlogPost dataclass."""

    def extract(key: str) -> str:
        pattern = rf"^{key}:\s*(.+)$"
        match = re.search(pattern, raw, re.MULTILINE)
        return match.group(1).strip() if match else ""

    # Content starts after CONTENT: marker
    content_match = re.search(r"^CONTENT:\s*\n(.*)", raw, re.MULTILINE | re.DOTALL)
    content_markdown = content_match.group(1).strip() if content_match else ""

    return BlogPost(
        title=extract("TITLE"),
        slug=extract("SLUG"),
        meta_description=extract("META_DESCRIPTION"),
        focus_keyword=extract("FOCUS_KEYWORD"),
        image_prompt=extract("IMAGE_PROMPT"),
        content_markdown=content_markdown,
    )


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
def generate_blog_post(posts: list[Post]) -> BlogPost:
    """
    Generate a blog post from 2-3 published social posts.
    Returns a BlogPost dataclass with all fields populated.
    """
    response = _client.chat.completions.create(
        model=config.openai_model,
        max_tokens=2500,
        messages=[
            {"role": "system", "content": BLOG_SYSTEM_PROMPT},
            {"role": "user", "content": _build_prompt(posts)},
        ],
    )
    raw = response.choices[0].message.content or ""
    post = _parse_response(raw)

    if not post.title or not post.content_markdown:
        raise ValueError("Blog post generation returned empty title or content")

    logger.info("Generated blog post: %r (keyword: %s)", post.title, post.focus_keyword)
    return post
