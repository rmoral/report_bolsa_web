"""
LinkedIn publisher using the UGC Posts REST API v2 with OAuth 2.0.

Required in .env:
    LINKEDIN_ACCESS_TOKEN   — OAuth 2.0 access token (get_linkedin_token.py)
    LINKEDIN_PERSON_URN     — urn:li:person:XXX

Optional (publish as company page):
    LINKEDIN_ORGANIZATION_URN — urn:li:organization:XXX
    When set, posts as the company page instead of the personal profile.
    Requires the authenticated user to be an admin of that page.
    If LinkedIn rejects the org post (403), falls back to personal profile.
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


def _build_ugc_payload(post: Post, author_urn: str, image_asset: Optional[str] = None) -> dict:
    url = config.website_url
    content_text = f"{post.full_content}\n\n{url}"[:3000] if url else post.full_content[:3000]
    media = []
    if image_asset:
        media = [{
            "status": "READY",
            "media": image_asset,
            "title": {"text": post.news_item.title[:200] if post.news_item else ""},
        }]
    return {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": content_text},
                "shareMediaCategory": "IMAGE" if image_asset else "NONE",
                "media": media,
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }


def _upload_image(image_path: str, owner_urn: str) -> Optional[str]:
    """Upload image to LinkedIn and return the asset URN."""
    try:
        register_url = f"{LINKEDIN_API_BASE}/assets?action=registerUpload"
        register_body = {
            "registerUploadRequest": {
                "recipes": ["urn:li:digitalmediaRecipe:feedshare-image"],
                "owner": owner_urn,
                "serviceRelationships": [{
                    "relationshipType": "OWNER",
                    "identifier": "urn:li:userGeneratedContent",
                }],
            }
        }
        resp = requests.post(register_url, json=register_body, headers=_headers(), timeout=30)
        resp.raise_for_status()
        data = resp.json()
        upload_url = data["value"]["uploadMechanism"][
            "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ]["uploadUrl"]
        asset = data["value"]["asset"]
        with open(image_path, "rb") as img_file:
            requests.put(
                upload_url,
                data=img_file,
                headers={"Authorization": f"Bearer {config.linkedin_access_token}"},
                timeout=60,
            ).raise_for_status()
        return asset
    except Exception as exc:
        logger.warning("LinkedIn image upload failed: %s", exc)
        return None


def _post_ugc(payload: dict) -> str:
    """POST to ugcPosts. Returns post URN on 201, raises on error."""
    response = requests.post(
        f"{LINKEDIN_API_BASE}/ugcPosts",
        json=payload,
        headers=_headers(),
        timeout=30,
    )
    if response.status_code == 201:
        urn = response.headers.get("x-restli-id", response.json().get("id", ""))
        return urn
    # Surface the LinkedIn error message clearly
    try:
        detail = response.json().get("message") or response.text
    except Exception:
        detail = response.text
    raise RuntimeError(f"LinkedIn {response.status_code}: {detail}")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=5, max=60))
def publish(post: Post) -> str:
    """
    Publish a LinkedIn post. Returns the LinkedIn post URN as string.

    If LINKEDIN_ORGANIZATION_URN is set, tries to post as the company page first.
    On 403 (insufficient permissions), re-uploads image with person URN and falls
    back to the personal profile so author and image owner always match.
    """
    if not config.linkedin_enabled:
        raise RuntimeError("LinkedIn not configured")

    org_urn = config.linkedin_organization_urn
    person_urn = config.linkedin_person_urn

    if org_urn:
        # Upload image owned by the org, attempt org post
        org_image = _upload_image(post.image_path, org_urn) if post.image_path else None
        try:
            payload = _build_ugc_payload(post, org_urn, org_image)
            urn = _post_ugc(payload)
            logger.info("Published LinkedIn post as org %s: %s", org_urn, urn)
            return urn
        except RuntimeError as exc:
            if "403" in str(exc) or "INSUFFICIENT" in str(exc) or "not authorized" in str(exc).lower():
                logger.warning(
                    "Org post rejected (%s) — falling back to personal profile. "
                    "Request 'Marketing Developer Platform' at "
                    "linkedin.com/developers/apps → Products to enable org posting.",
                    exc,
                )
            else:
                raise
        # Org post failed: fall through to personal post below.
        # Re-upload image with person URN so owner matches the new author.
        image_asset = _upload_image(post.image_path, person_urn) if post.image_path else None
    else:
        image_asset = _upload_image(post.image_path, person_urn) if post.image_path else None

    payload = _build_ugc_payload(post, person_urn, image_asset)
    urn = _post_ugc(payload)
    logger.info("Published LinkedIn post as person %s: %s", person_urn, urn)
    return urn
