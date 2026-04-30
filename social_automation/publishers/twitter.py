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


def _get_client_for_account(account_id: Optional[str]) -> tweepy.Client:
    """Build a tweepy.Client for the given account id (defaults to "1")."""
    account = config.twitter_account_by_id(account_id or "1")
    if account is None:
        raise RuntimeError(f"Twitter account '{account_id}' not configured")
    return tweepy.Client(
        bearer_token=account.bearer_token,
        consumer_key=account.api_key,
        consumer_secret=account.api_secret,
        access_token=account.access_token,
        access_token_secret=account.access_token_secret,
        wait_on_rate_limit=True,
    )


def _get_api_v1_for_account(account_id: Optional[str]) -> tweepy.API:
    """Build a tweepy.API (v1.1) for the given account id (defaults to "1")."""
    account = config.twitter_account_by_id(account_id or "1")
    if account is None:
        raise RuntimeError(f"Twitter account '{account_id}' not configured")
    auth = tweepy.OAuth1UserHandler(
        account.api_key,
        account.api_secret,
        account.access_token,
        account.access_token_secret,
    )
    return tweepy.API(auth)


def _tweepy_error_detail(exc: Exception) -> str:
    """Extract the most useful error message from a Tweepy exception."""
    try:
        # tweepy.errors.HTTPException subclasses carry api_errors / api_codes
        if hasattr(exc, "api_errors") and exc.api_errors:
            parts = []
            for err in exc.api_errors:
                code = err.get("code", "")
                msg = err.get("message", "")
                parts.append(f"code={code} {msg}".strip())
            return f"{type(exc).__name__}: {'; '.join(parts)}"
        if hasattr(exc, "response") and exc.response is not None:
            return f"{type(exc).__name__} {exc.response.status_code}: {exc.response.text[:300]}"
    except Exception:
        pass
    return str(exc)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=5, max=30))
def publish(post: Post) -> str:
    """
    Publish a tweet. Returns the tweet ID as string.
    Raises on failure (tenacity will retry).
    """
    account_id = post.account_id or "1"
    account = config.twitter_account_by_id(account_id)
    if account is None:
        raise RuntimeError(f"Twitter account '{account_id}' not configured")

    client = _get_client_for_account(account_id)
    media_ids: Optional[list] = None

    # Upload image if available
    if post.image_path:
        try:
            api_v1 = _get_api_v1_for_account(account_id)
            media = api_v1.media_upload(post.image_path)
            media_ids = [media.media_id]
        except Exception as exc:
            logger.warning("Image upload failed, tweeting without image: %s", exc)

    # Twitter counts any URL as 23 chars (t.co shortening).
    # Reserve space: 280 - 23 (URL) - 1 (newline) = 256 chars for text+hashtags.
    url = config.website_url
    body = post.full_content[:256]
    tweet_text = f"{body}\n{url}" if url else body

    logger.info(
        "Sending tweet (post_id=%d, len=%d, has_image=%s): %s…",
        post.id, len(tweet_text), media_ids is not None, tweet_text[:80],
    )

    try:
        # user_auth=True forces OAuth 1.0a (User Context) instead of Bearer Token.
        # Without this, Tweepy 4.x may fall back to app-only auth for text-only
        # tweets, which returns 403 Forbidden because app-only auth cannot write.
        response = client.create_tweet(
            text=tweet_text,
            media_ids=media_ids,
            user_auth=True,
        )
    except tweepy.errors.TweepyException as exc:
        detail = _tweepy_error_detail(exc)
        logger.error("Twitter API error (post_id=%d): %s", post.id, detail)
        raise RuntimeError(detail) from exc

    tweet_id = str(response.data["id"])
    logger.info("Published tweet id=%s (post_id=%d)", tweet_id, post.id)
    return tweet_id
