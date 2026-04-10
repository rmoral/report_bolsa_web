"""
Instagram publisher using the Meta Graph API (Instagram Business/Creator account).
Falls back to instagrapi (direct login) if Graph API credentials are not set.

Graph API flow:
  1. POST /{ig-user-id}/media  → create container → get creation_id
  2. POST /{ig-user-id}/media_publish → publish container
"""
import logging
import time
from typing import Optional

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.config import config
from social_automation.database.models import Post

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v19.0"


# ── Meta Graph API ──────────────────────────────────────────────────────────

def _graph_headers() -> dict:
    return {"Authorization": f"Bearer {config.instagram_access_token}"}


def _create_media_container(caption: str, image_url: Optional[str] = None) -> str:
    """Step 1: Create a media container. Returns creation_id."""
    url = f"{GRAPH_API_BASE}/{config.instagram_account_id}/media"
    params: dict = {
        "caption": caption[:2200],
        "access_token": config.instagram_access_token,
    }
    if image_url:
        params["image_url"] = image_url  # Must be a publicly accessible URL
    else:
        # Without image: not valid for IG (IG requires image/video).
        # Use a placeholder or raise early.
        raise ValueError("Instagram posts require an image. Provide image_url or image_path.")

    resp = requests.post(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()["id"]


def _publish_container(creation_id: str) -> str:
    """Step 2: Publish the container. Returns the published media ID."""
    url = f"{GRAPH_API_BASE}/{config.instagram_account_id}/media_publish"
    params = {
        "creation_id": creation_id,
        "access_token": config.instagram_access_token,
    }
    resp = requests.post(url, params=params, timeout=30)
    resp.raise_for_status()
    return resp.json()["id"]


def _publish_via_graph_api(post: Post) -> str:
    """Publish using Instagram Graph API. Requires public image URL."""
    caption = post.full_content[:2200]
    # image_path here could be a URL stored in the field, or we skip image
    image_url = None
    if post.image_path and post.image_path.startswith("http"):
        image_url = post.image_path

    if not image_url:
        logger.warning(
            "Instagram post id=%d has no public image URL; skipping Graph API publish.", post.id
        )
        raise ValueError("No public image URL available for Instagram Graph API")

    creation_id = _create_media_container(caption, image_url)
    # IG recommends waiting a few seconds before publishing
    time.sleep(3)
    media_id = _publish_container(creation_id)
    logger.info("Published Instagram post via Graph API: media_id=%s", media_id)
    return media_id


# ── instagrapi fallback ──────────────────────────────────────────────────────

def _publish_via_instagrapi(post: Post) -> str:
    """Fallback: publish via instagrapi (direct login). Requires image_path."""
    try:
        from instagrapi import Client as InstaClient
    except ImportError:
        raise RuntimeError("instagrapi not installed. Run: pip install instagrapi")

    if not post.image_path:
        raise ValueError("instagrapi publisher requires a local image_path")

    client = InstaClient()
    client.login(config.instagram_username, config.instagram_password)
    caption = post.full_content[:2200]
    media = client.photo_upload(post.image_path, caption=caption)
    media_id = str(media.pk)
    logger.info("Published Instagram post via instagrapi: media_id=%s", media_id)
    return media_id


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=10, max=60))
def publish(post: Post) -> str:
    """
    Publish an Instagram post.
    Tries Graph API first; falls back to instagrapi if configured.
    Returns the platform media ID.
    """
    if not config.instagram_enabled:
        raise RuntimeError("Instagram not configured")

    # Try Graph API first
    if config.instagram_access_token and config.instagram_account_id:
        try:
            return _publish_via_graph_api(post)
        except ValueError as exc:
            logger.warning("Graph API skipped: %s", exc)
        except Exception as exc:
            logger.warning("Graph API publish failed, trying instagrapi: %s", exc)

    # Fallback to instagrapi
    if config.instagram_username and config.instagram_password:
        return _publish_via_instagrapi(post)

    raise RuntimeError("No valid Instagram publish method available")
