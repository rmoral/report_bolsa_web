"""
Generates images for social media posts.

Supports two providers, switchable via IMAGE_PROVIDER env var:
  • "dalle"   — OpenAI DALL-E 3 (default)
  • "imagen3" — Google Imagen 3 (Nano Banana) via Gemini API

Both providers save a local PNG and return its path.
Imagen 3 returns raw bytes (no URL download needed), DALL-E returns a URL.
"""
import asyncio
import logging
from io import BytesIO
from pathlib import Path
from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.config import config
from social_automation.database.models import Post
from social_automation.database import db

logger = logging.getLogger(__name__)

IMAGES_DIR = Path(__file__).parent.parent / "images"
IMAGES_DIR.mkdir(exist_ok=True)

# Style appended to every prompt for visual consistency
IMAGE_STYLE = (
    "Clean, professional editorial style. No text, no watermarks, no logos. "
    "High quality, photorealistic or clean data-visualization aesthetic. "
    "Suitable for a financial news publication."
)


# ── DALL-E backend ────────────────────────────────────────────────────────────

def _dalle_client():
    from openai import OpenAI
    return OpenAI(api_key=config.openai_api_key)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
def _call_dalle_sync(prompt: str) -> bytes:
    """Call DALL-E and return the image bytes."""
    import httpx as _httpx
    full_prompt = f"{prompt}\n\nStyle: {IMAGE_STYLE}"[:4000]
    response = _dalle_client().images.generate(
        model=config.openai_image_model,
        prompt=full_prompt,
        size="1024x1024",
        quality="standard",
        n=1,
    )
    url = response.data[0].url
    # Download synchronously inside the executor-bound function
    return _httpx.get(url, timeout=60, follow_redirects=True).content


# ── Imagen 3 backend (Google / Nano Banana) ───────────────────────────────────

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
def _call_imagen3_sync(prompt: str) -> bytes:
    """Call Google Imagen 3 and return the image bytes directly."""
    from google import genai
    from google.genai import types as gtypes

    client = genai.Client(api_key=config.google_ai_api_key)
    full_prompt = f"{prompt}\n\n{IMAGE_STYLE}"[:4000]

    response = client.models.generate_images(
        model="imagen-3.0-generate-002",
        prompt=full_prompt,
        config=gtypes.GenerateImagesConfig(
            number_of_images=1,
            aspect_ratio="1:1",
        ),
    )
    if not response.generated_images:
        raise ValueError("Imagen 3 returned no images (prompt may have been blocked)")
    return response.generated_images[0].image.image_bytes


# ── Unified interface ─────────────────────────────────────────────────────────

def _generate_image_bytes_sync(prompt: str) -> bytes:
    """Dispatch to the configured provider and return raw PNG bytes."""
    if config.image_provider == "imagen3":
        if not config.google_ai_api_key:
            raise ValueError(
                "IMAGE_PROVIDER=imagen3 but GOOGLE_AI_API_KEY is not set. "
                "Get your key at aistudio.google.com"
            )
        logger.debug("Generating image with Imagen 3 (Nano Banana)")
        return _call_imagen3_sync(prompt)
    else:
        logger.debug("Generating image with DALL-E (%s)", config.openai_image_model)
        return _call_dalle_sync(prompt)


async def _generate_and_save(prompt: str, dest: Path) -> str:
    """Generate an image and save it to disk. Returns the path string."""
    loop = asyncio.get_event_loop()
    image_bytes = await loop.run_in_executor(None, _generate_image_bytes_sync, prompt)
    dest.write_bytes(image_bytes)
    logger.info(
        "Image saved (%s, %.1f KB) → %s",
        config.image_provider, len(image_bytes) / 1024, dest,
    )
    return str(dest)


# ── Public API ────────────────────────────────────────────────────────────────

async def generate_image_for_post(post: Post) -> Optional[str]:
    """
    Generate and save an image for a single post.
    Returns the local file path, or None if skipped/failed.
    """
    if not config.generate_images:
        return None

    prompt = post.image_prompt
    if not prompt or not prompt.strip():
        logger.warning("Post id=%d has no image_prompt, skipping", post.id)
        return None

    dest = IMAGES_DIR / f"post_{post.id}.png"
    try:
        return await _generate_and_save(prompt, dest)
    except Exception as exc:
        logger.error("Image generation failed for post id=%d: %s", post.id, exc)
        return None


async def generate_images_for_posts(posts: list[Post]) -> None:
    """
    Generate images for all posts concurrently.
    Updates post.image_path in the database on success.
    """
    if not config.generate_images:
        logger.info("Image generation disabled (GENERATE_IMAGES=false)")
        return

    tasks = [generate_image_for_post(post) for post in posts]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    for post, result in zip(posts, results):
        if isinstance(result, Exception):
            logger.error("Image task error post id=%d: %s", post.id, result)
        elif isinstance(result, str):
            await db.update_image_path(post.id, result)
            post.image_path = result


async def generate_image_from_prompt(prompt: str, filename_stem: str) -> Optional[str]:
    """
    Generate an image from a raw prompt and save it.
    Used by the blog generator for featured images.
    Returns the local file path, or None on failure.
    """
    if not config.generate_images:
        return None
    if not prompt or not prompt.strip():
        return None

    dest = IMAGES_DIR / f"{filename_stem}.png"
    try:
        return await _generate_and_save(prompt, dest)
    except Exception as exc:
        logger.error("Image generation failed (%s): %s", filename_stem, exc)
        return None


def cleanup_old_images(days: int = 7) -> None:
    """Delete images older than N days to avoid disk buildup."""
    import time
    cutoff = time.time() - days * 86400
    deleted = 0
    for f in IMAGES_DIR.glob("post_*.png"):
        if f.stat().st_mtime < cutoff:
            f.unlink()
            deleted += 1
    if deleted:
        logger.info("Cleaned up %d old images", deleted)
