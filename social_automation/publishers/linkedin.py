"""
LinkedIn publisher using the UGC Posts REST API v2 with OAuth 2.0.

Required in .env:
    LINKEDIN_ACCESS_TOKEN   — OAuth 2.0 access token
    LINKEDIN_PERSON_URN     — urn:li:person:XXX  (obtained via get_linkedin_token.py)

Optional (publish as company page instead of personal profile):
    LINKEDIN_ORGANIZATION_URN — urn:li:organization:XXX
    When set, this takes priority over LINKEDIN_PERSON_URN as the post author.
    The authenticated user must be an admin of that company page.
"""
import logging
from typing import Optional

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.config import config
from social_automation.database.models import Post

logger = logging.getLogger(__name__)

LINKEDIN_API_BASE = "https://api.linkedin.com/v2"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {config.linkedin_access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }


def _build_ugc_payload(post: Post, image_asset: Optional[str] = None) -> dict:
    """Build the LinkedIn UGC Post request body."""
    media = []
    if image_asset:
        media = [
            {
                "status": "READY",
                "media": image_asset,
                "title": {"text": post.news_item.title[:200] if post.news_item else ""},
            }
        ]

    url = config.website_url
    content_text = f"{post.full_content}\n\n{url}"[:3000]

    payload: dict = {
        "author": config.linkedin_author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": content_text},
                "shareMediaCategory": "IMAGE" if image_asset else "NONE",
                "media": media,
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        },
    }
    return payload


def _upload_image(image_path: str) -> Optional[str]:
    """Upload image to LinkedIn and return the asset URN."""
    try:
        # Step 1: Register upload
        register_url = f"{LINKEDIN_API_BASE}/assets?action=registerUpload"
        register_body = {
            "registerUploadRequest": {
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "owner": config.linkedin_author_urn,
                "serviceRelationships": [
                    {
                        "relationshipType": "OWNER",
                        "identifier": "urn:li:userGeneratedContent",
                    }
                ],
            }
        }
        resp = requests.post(register_url, json=register_body, headers=_headers(), timeout=30)
        resp.raise_for_status()
        data = resp.json()
        upload_url = data["value"]["uploadMechanism"][
            "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ]["uploadUrl"]
        asset = data["value"]["asset"]

        # Step 2: Upload binary
        with open(image_path, "rb") as img_file:
            upload_resp = requests.put(
                upload_url,
                data=img_file,
                headers={"Authorization": f"Bearer {config.linkedin_access_token}"},
                timeout=60,
            )
            upload_resp.raise_for_status()
        return asset
    except Exception as exc:
        logger.warning("LinkedIn image upload failed: %s", exc)
        return None


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=5, max=60))
def publish(post: Post) -> str:
    """
    Publish a LinkedIn post. Returns the LinkedIn post URN as string.
    """
    if not config.linkedin_enabled:
        raise RuntimeError("LinkedIn not configured")

    image_asset: Optional[str] = None
    if post.image_path:
        image_asset = _upload_image(post.image_path)

    payload = _build_ugc_payload(post, image_asset)
    url = f"{LINKEDIN_API_BASE}/ugcPosts"
    response = requests.post(url, json=payload, headers=_headers(), timeout=30)

    if response.status_code == 201:
        post_urn = response.headers.get("x-restli-id", response.json().get("id", ""))
        logger.info("Published LinkedIn post: %s", post_urn)
        return post_urn

    response.raise_for_status()
    return ""
