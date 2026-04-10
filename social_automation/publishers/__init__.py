"""
Publisher factory: returns the right publish function for each platform.
"""
import asyncio
import logging
from typing import Callable

from social_automation.database.models import Platform, Post, PostStatus
from social_automation.database import db

logger = logging.getLogger(__name__)


async def publish_post(post: Post) -> bool:
    """
    Publish a single post to its target platform.
    Updates DB status and logs the result.
    Returns True on success.
    """
    from social_automation.publishers import twitter, linkedin

    # Instagram disabled until image generation is integrated
    publishers: dict[Platform, Callable] = {
        Platform.TWITTER: twitter.publish,
        Platform.LINKEDIN: linkedin.publish,
    }

    publisher_fn = publishers.get(post.platform)
    if not publisher_fn:
        logger.error("No publisher for platform=%s", post.platform)
        return False

    await db.update_post_status(post.id, PostStatus.PUBLISHING)
    try:
        loop = asyncio.get_event_loop()
        platform_post_id = await loop.run_in_executor(None, publisher_fn, post)
        await db.update_post_status(
            post.id, PostStatus.PUBLISHED, platform_post_id=platform_post_id
        )
        await db.log_action(post.id, post.platform, "publish", True, f"id={platform_post_id}")
        logger.info("Post id=%d published to %s", post.id, post.platform)
        return True
    except Exception as exc:
        error_msg = str(exc)
        await db.update_post_status(post.id, PostStatus.FAILED, error_message=error_msg)
        await db.log_action(post.id, post.platform, "publish", False, error_msg)
        logger.error("Publish failed post id=%d platform=%s: %s", post.id, post.platform, exc)
        return False
