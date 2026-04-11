"""
Auto-announces new blog posts on X (Twitter) immediately after publication.

Generates a hook-first tweet with GPT (no "New article:" intros),
attaches the blog featured image, and appends the article URL.
"""
import logging
from typing import Optional

import tweepy
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.blog.generator import BlogPost
from social_automation.config import config

logger = logging.getLogger(__name__)

_openai = OpenAI(api_key=config.openai_api_key)

# Twitter counts any URL as 23 chars after t.co shortening.
# 280 - 23 (URL) - 2 (newlines) = 255 chars for the body text.
_BODY_LIMIT = 255

ANNOUNCE_SYSTEM = """You write punchy Twitter/X announcements for financial news articles \
published on earlymarketreports.com.

Rules:
- Maximum 240 characters (the article URL is appended separately — do NOT include it)
- Open with the most striking fact, number, or insight from the article
- Do NOT start with "New article", "Read our", "Check out", or similar phrases
- No emojis, no hashtags, no ellipsis (…) at the end
- Tone: sharp, authoritative financial journalism — like a Reuters alert
- End naturally so the URL feels like a logical continuation
- One or two sentences maximum
"""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
def _generate_tweet_text(blog: BlogPost) -> str:
    """Use GPT to write the announcement body (without URL)."""
    prompt = (
        f"Article title: {blog.title}\n"
        f"Summary: {blog.meta_description}\n"
        f"Focus keyword: {blog.focus_keyword}\n\n"
        f"Write the tweet body (max 240 chars, no URL)."
    )
    resp = _openai.chat.completions.create(
        model=config.openai_model,
        max_tokens=80,
        messages=[
            {"role": "system", "content": ANNOUNCE_SYSTEM},
            {"role": "user", "content": prompt},
        ],
    )
    text = (resp.choices[0].message.content or "").strip().strip('"').strip("'")
    return text[:_BODY_LIMIT]


def _get_client() -> tweepy.Client:
    return tweepy.Client(
        bearer_token=config.twitter_bearer_token,
        consumer_key=config.twitter_api_key,
        consumer_secret=config.twitter_api_secret,
        access_token=config.twitter_access_token,
        access_token_secret=config.twitter_access_token_secret,
        wait_on_rate_limit=True,
    )


def _get_api_v1() -> tweepy.API:
    auth = tweepy.OAuth1UserHandler(
        config.twitter_api_key,
        config.twitter_api_secret,
        config.twitter_access_token,
        config.twitter_access_token_secret,
    )
    return tweepy.API(auth)


def _article_url(slug: str) -> str:
    base = config.website_url.rstrip("/")
    prefix = config.blog_url_prefix.strip("/")
    return f"{base}/{prefix}/{slug}" if prefix else f"{base}/{slug}"


def announce_blog_post(blog: BlogPost, slug: str, image_path: Optional[str] = None) -> str:
    """
    Post an announcement tweet for a newly published blog post.
    Returns the tweet ID, or raises on failure.
    """
    if not config.twitter_enabled:
        raise RuntimeError("Twitter not configured")

    body = _generate_tweet_text(blog)
    url = _article_url(slug)
    tweet_text = f"{body}\n\n{url}"

    media_ids: Optional[list] = None
    if image_path:
        try:
            api_v1 = _get_api_v1()
            media = api_v1.media_upload(image_path)
            media_ids = [media.media_id]
        except Exception as exc:
            logger.warning("Blog announcement: image upload failed, tweeting without image: %s", exc)

    client = _get_client()
    response = client.create_tweet(text=tweet_text, media_ids=media_ids)
    tweet_id = str(response.data["id"])
    logger.info("Blog announcement tweet published: id=%s url=%s", tweet_id, url)
    return tweet_id
