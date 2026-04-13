"""
Publishes SEO blog posts to Payload CMS via REST API.
Handles JWT authentication, optional featured image upload, and bilingual publishing.

Field mapping (from earlymarketreports/src/payload.config.ts):
  title         → text, required, localized
  slug          → text, required, unique, localized
  excerpt       → textarea, localized  (maps to meta_description)
  featuredImage → upload relationship to media
  status        → select: "draft" | "published"  (custom field, NOT Payload drafts)
  publishedAt   → date
  content       → richText (Lexical), localized

Publish flow:
  1. POST /api/posts?locale=en  → creates document with English content → returns post_id
  2. PATCH /api/posts/{id}?locale=es → adds Spanish translation to same document
"""
import logging
import mimetypes
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import httpx

from social_automation.blog.generator import BlogPost
from social_automation.blog.lexical import markdown_to_lexical
from social_automation.config import config

logger = logging.getLogger(__name__)

_TOKEN_CACHE: Optional[str] = None


def _base() -> str:
    return config.payload_api_url.rstrip("/")


async def _get_token(client: httpx.AsyncClient) -> str:
    """Login to Payload CMS and return JWT token. Caches in process memory."""
    global _TOKEN_CACHE
    if _TOKEN_CACHE:
        return _TOKEN_CACHE

    resp = await client.post(
        f"{_base()}/api/users/login",
        json={"email": config.payload_email, "password": config.payload_password},
        timeout=15,
    )
    resp.raise_for_status()
    token = resp.json().get("token", "")
    if not token:
        raise ValueError("Payload CMS login returned no token")
    _TOKEN_CACHE = token
    logger.info("Authenticated with Payload CMS")
    return token


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


async def _upload_image(
    client: httpx.AsyncClient, token: str, image_path: str
) -> Optional[str]:
    """Upload an image to Payload /api/media. Returns the media document ID."""
    path = Path(image_path)
    if not path.exists():
        logger.warning("Image not found, skipping upload: %s", image_path)
        return None

    mime = mimetypes.guess_type(str(path))[0] or "image/png"
    try:
        with open(path, "rb") as f:
            resp = await client.post(
                f"{_base()}/api/media",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": (path.name, f, mime)},
                timeout=60,
            )
        resp.raise_for_status()
        media_id = resp.json().get("doc", {}).get("id")
        if media_id:
            logger.info("Uploaded featured image: id=%s", media_id)
        return media_id
    except Exception as exc:
        logger.warning("Payload image upload failed: %s", exc)
        return None


def _build_en_payload(blog: BlogPost, lexical_en: dict, media_id: Optional[str]) -> dict:
    doc: dict = {
        "title": blog.title,
        "slug": blog.slug,
        "excerpt": blog.meta_description,
        "status": "published",
        "publishedAt": datetime.now(timezone.utc).isoformat(),
        "content": lexical_en,
    }
    if media_id:
        doc["featuredImage"] = media_id
    return doc


def _build_es_payload(blog: BlogPost, lexical_es: dict) -> dict:
    """Spanish locale payload — only localized fields; status/publishedAt already set."""
    return {
        "title": blog.title_es or blog.title,
        "slug": blog.slug,                      # keep same slug across locales
        "excerpt": blog.meta_description_es or blog.meta_description,
        "content": lexical_es,
    }


async def publish_blog_post(
    blog: BlogPost, image_path: Optional[str] = None
) -> str:
    """
    Publish a bilingual BlogPost to Payload CMS.

    Steps:
      1. POST ?locale=en  → create document with English content
      2. PATCH ?locale=es → add Spanish translation to same document

    Returns the slug of the created post.
    """
    if not config.payload_enabled:
        raise RuntimeError(
            "Payload CMS not configured "
            "(PAYLOAD_API_URL / PAYLOAD_EMAIL / PAYLOAD_PASSWORD missing)"
        )

    lexical_en = markdown_to_lexical(blog.content_markdown)

    async with httpx.AsyncClient() as client:
        token = await _get_token(client)
        headers = _auth_headers(token)

        # ── Step 1: upload image (non-localized) ────────────────────────────
        media_id: Optional[str] = None
        if image_path:
            media_id = await _upload_image(client, token, image_path)

        # ── Step 2: create document with English content ─────────────────────
        en_payload = _build_en_payload(blog, lexical_en, media_id)
        logger.debug("POST to Payload CMS: title=%r slug=%r", en_payload.get("title"), en_payload.get("slug"))

        resp = await client.post(
            f"{_base()}/api/posts",
            headers=headers,
            json=en_payload,
            params={"locale": "en"},
            timeout=30,
        )
        if not resp.is_success:
            logger.error("Payload API error %d: %s", resp.status_code, resp.text[:500])
        resp.raise_for_status()

        data = resp.json()
        doc = data.get("doc", data)
        post_id = doc.get("id", "")
        slug = doc.get("slug", blog.slug)
        logger.info("Published English blog post: id=%s slug=%s", post_id, slug)

        # ── Step 3: add Spanish translation ──────────────────────────────────
        if blog.content_markdown_es and post_id:
            lexical_es = markdown_to_lexical(blog.content_markdown_es)
            es_payload = _build_es_payload(blog, lexical_es)
            logger.debug("PATCH Spanish translation: id=%s title_es=%r", post_id, es_payload.get("title"))

            resp_es = await client.patch(
                f"{_base()}/api/posts/{post_id}",
                headers=headers,
                json=es_payload,
                params={"locale": "es"},
                timeout=30,
            )
            if not resp_es.is_success:
                logger.warning(
                    "Spanish translation patch failed %d: %s",
                    resp_es.status_code, resp_es.text[:300],
                )
            else:
                logger.info("Published Spanish translation: id=%s", post_id)
        else:
            logger.warning("No Spanish translation available for post id=%s", post_id)

        return slug


async def publish_draft_by_slug(slug: str) -> bool:
    """Find a post saved as draft by slug and publish it."""
    async with httpx.AsyncClient() as client:
        token = await _get_token(client)

        search = await client.get(
            f"{_base()}/api/posts",
            headers=_auth_headers(token),
            params={"where[slug][equals]": slug, "locale": "en", "limit": 1},
            timeout=15,
        )
        search.raise_for_status()
        docs = search.json().get("docs", [])
        if not docs:
            raise ValueError(f"No post found with slug '{slug}'")

        post_id = docs[0]["id"]
        resp = await client.patch(
            f"{_base()}/api/posts/{post_id}",
            headers=_auth_headers(token),
            json={"status": "published"},
            params={"locale": "en"},
            timeout=15,
        )
        resp.raise_for_status()
        logger.info("Published draft: slug=%s id=%s", slug, post_id)
        return True


def invalidate_token() -> None:
    """Force re-authentication on next request (e.g. after 401)."""
    global _TOKEN_CACHE
    _TOKEN_CACHE = None
