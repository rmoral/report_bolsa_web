"""
Generates images for social media posts using OpenAI DALL-E.
Images are saved to the local images/ directory and the path
is stored in post.image_path for use by the publishers.
"""
import asyncio
import logging
import os
from pathlib import Path
from typing import Optional

import httpx
from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.config import config
from social_automation.database.models import Post
from social_automation.database import db

logger = logging.getLogger(__name__)

IMAGES_DIR = Path(__file__).parent.parent / "images"
IMAGES_DIR.mkdir(exist_ok=True)

_client = OpenAI(api_key=config.openai_api_key)

# Style instruction appended to every DALL-E prompt for consistency
IMAGE_STYLE = (
    "Clean, professional editorial style. No text, no watermarks, no logos. "
    "High quality, photorealistic or clean data-visualization aesthetic. "
    "Suitable for a financial news publication."
)


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=2, min=4, max=30))
def _call_dalle_sync(prompt: str) -> str:
    """Call DALL-E and return the image URL."""
    full_prompt = f"{prompt}\n\nStyle: {IMAGE_STYLE}"[:4000]
    response = _client.images.generate(
        model=config.openai_image_model,
        prompt=full_prompt,
        size="1024x1024",
        quality="standard",
        n=1,
    )
    return response.data[0].url


async def _download_image(url: str, dest_path: Path) -> None:
    """Download image from URL to local file."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        dest_path.write_bytes(resp.content)


async def generate_image_for_post(post: Post) -> Optional[str]:
    """
    Generate and save an image for a single post.
    Returns the local file path, or None if skipped/failed.
    """
    if not config.generate_images:
        return None

    prompt = post.image_prompt
    if not prompt or not prompt.strip():
        logger.warning("Post id=%d has no image_prompt, skipping image generation", post.id)
        return None

    image_path = IMAGES_DIR / f"post_{post.id}.png"

    try:
        loop = asyncio.get_event_loop()
        image_url = await loop.run_in_executor(None, _call_dalle_sync, prompt)
        await _download_image(image_url, image_path)
        logger.info("Generated image for post id=%d → %s", post.id, image_path)
        return str(image_path)
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
