"""
X (Twitter) publisher using Tweepy v4 with OAuth 1.0a.
Supports text tweets. Image attachment is optional if image_path is set.
"""
import logging
from typing import Optional

import tweepy
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.config import config
from social_automation.database.models import Post

logger = logging.getLogger(__name__)


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
    """API v1.1 needed for media upload."""
    auth = tweepy.OAuth1UserHandler(
        config.twitter_api_key,
        config.twitter_api_secret,
        config.twitter_access_token,
        config.twitter_access_token_secret,
    )
    return tweepy.API(auth)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=5, max=30))
def publish(post: Post) -> str:
    """
    Publish a tweet. Returns the tweet ID as string.
    Raises on failure (tenacity will retry).
    """
    if not config.twitter_enabled:
        raise RuntimeError("Twitter not configured")

    client = _get_client()
    media_ids: Optional[list] = None

    # Upload image if available
    if post.image_path:
        try:
            api_v1 = _get_api_v1()
            media = api_v1.media_upload(post.image_path)
            media_ids = [media.media_id]
        except Exception as exc:
            logger.warning("Image upload failed, tweeting without image: %s", exc)

    # Twitter counts any URL as 23 chars (t.co shortening).
    # Reserve space: 280 - 23 (URL) - 1 (space) = 256 chars for text+hashtags.
    url = config.website_url
    body = post.full_content[:256]
    tweet_text = f"{body}\n{url}"

    response = client.create_tweet(text=tweet_text, media_ids=media_ids)
    tweet_id = str(response.data["id"])
    logger.info("Published tweet id=%s", tweet_id)
    return tweet_id
