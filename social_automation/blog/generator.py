"""
Generates SEO-optimized blog posts from published social media posts or topics.
Always produces both English and Spanish versions for Payload CMS multilingual support.
"""
import logging
import re
from dataclasses import dataclass, field
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

TRANSLATION_SYSTEM_PROMPT = """You are a professional financial translator and editor \
specializing in Spanish for earlymarketreports.com, a publication targeting Spanish-speaking \
investors and financial professionals across Spain and Latin America.

Translation rules:
- Translate into natural, professional Spanish — not literal.
- Use financial terminology standard in Spain and Latin America (e.g. "tipos de interés", \
"bolsa de valores", "rentabilidad", "acciones", "mercado de renta variable").
- Preserve all Markdown formatting: ## headings, paragraphs, bold text.
- Preserve all numbers, percentages, dates, and proper nouns unchanged.
- The article must read as originally written in Spanish, not as a translation.
- Match the authoritative, analytical tone of the original.
- SEO: include the translated focus keyword in the title, first paragraph, and at least \
two H2 headings.
"""


@dataclass
class BlogPost:
    title: str
    slug: str
    meta_description: str
    focus_keyword: str
    content_markdown: str
    image_prompt: str
    # Spanish translation — populated by translate_blog_post()
    title_es: str = ""
    meta_description_es: str = ""
    focus_keyword_es: str = ""
    content_markdown_es: str = ""


# ── Parsing ───────────────────────────────────────────────────────────────────

def _parse_response(raw: str) -> BlogPost:
    def extract(key: str) -> str:
        match = re.search(rf"^{key}:\s*(.+)$", raw, re.MULTILINE)
        return match.group(1).strip() if match else ""

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


def _parse_translation(raw: str) -> tuple[str, str, str, str]:
    """Parse translation response → (title_es, meta_es, keyword_es, content_es)."""
    def extract(key: str) -> str:
        match = re.search(rf"^{key}:\s*(.+)$", raw, re.MULTILINE)
        return match.group(1).strip() if match else ""

    content_match = re.search(r"^CONTENT:\s*\n(.*)", raw, re.MULTILINE | re.DOTALL)
    content_es = content_match.group(1).strip() if content_match else ""

    return (
        extract("TITLE"),
        extract("META_DESCRIPTION"),
        extract("FOCUS_KEYWORD"),
        content_es,
    )


# ── Translation ───────────────────────────────────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
def translate_blog_post(blog: BlogPost) -> BlogPost:
    """
    Translate an English BlogPost to Spanish.
    Populates blog.title_es, meta_description_es, focus_keyword_es, content_markdown_es.
    The slug and image_prompt are shared across locales.
    """
    user_prompt = f"""Translate the following English blog article to professional Spanish.

TITLE: {blog.title}
META_DESCRIPTION: {blog.meta_description}
FOCUS_KEYWORD: {blog.focus_keyword}
CONTENT:
{blog.content_markdown}

Return your response in this EXACT format — do not add extra keys or change the labels:

TITLE: <translated title, 55-65 characters>
META_DESCRIPTION: <translated meta, 155 characters max>
FOCUS_KEYWORD: <translated keyword phrase, 2-4 words>
CONTENT:
<full translated article in Markdown, same structure as original>"""

    response = _client.chat.completions.create(
        model=config.openai_model,
        max_tokens=2500,
        messages=[
            {"role": "system", "content": TRANSLATION_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )
    raw = response.choices[0].message.content or ""
    title_es, meta_es, kw_es, content_es = _parse_translation(raw)

    if not title_es or not content_es:
        raise ValueError("Translation returned empty title or content")

    blog.title_es = title_es
    blog.meta_description_es = meta_es
    blog.focus_keyword_es = kw_es
    blog.content_markdown_es = content_es
    logger.info("Translated blog post to Spanish: %r", title_es)
    return blog


# ── Generation from news posts ────────────────────────────────────────────────

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


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
def generate_blog_post(posts: list[Post]) -> BlogPost:
    """
    Generate a bilingual blog post from 2-3 published social posts.
    Returns a BlogPost with English content + Spanish translation.
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
    blog = _parse_response(raw)

    if not blog.title or not blog.content_markdown:
        raise ValueError("Blog post generation returned empty title or content")

    logger.info("Generated blog post: %r (keyword: %s)", blog.title, blog.focus_keyword)
    return translate_blog_post(blog)


# ── Generation from topic ─────────────────────────────────────────────────────

def _build_prompt_from_topic(topic: str) -> str:
    return f"""Write a complete SEO-optimized educational blog article for earlymarketreports.com \
about the following financial/market topic.

TOPIC: {topic}

Write an in-depth, informative piece that educates the reader from first principles.
Include historical context, real-world examples, and practical implications for investors.
Do not write about recent news — focus on the concept, how it works, and why it matters.

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


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
def generate_blog_post_from_topic(topic: str) -> BlogPost:
    """
    Generate a bilingual educational blog post from a topic string.
    Returns a BlogPost with English content + Spanish translation.
    """
    response = _client.chat.completions.create(
        model=config.openai_model,
        max_tokens=2500,
        messages=[
            {"role": "system", "content": BLOG_SYSTEM_PROMPT},
            {"role": "user", "content": _build_prompt_from_topic(topic)},
        ],
    )
    raw = response.choices[0].message.content or ""
    blog = _parse_response(raw)

    if not blog.title or not blog.content_markdown:
        raise ValueError("Blog post generation returned empty title or content")

    logger.info("Generated educational blog post: %r (keyword: %s)", blog.title, blog.focus_keyword)
    return translate_blog_post(blog)
