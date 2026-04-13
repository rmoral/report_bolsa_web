"""
Async database access layer (SQLAlchemy + aiosqlite).
"""
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import AsyncGenerator, List, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload

from social_automation.config import config
from social_automation.database.models import (
    Base, DailyRun, NewsItem, Platform, Post, PostStatus, PublicationLog
)

logger = logging.getLogger(__name__)

engine = create_async_engine(config.database_url, echo=False)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def init_db() -> None:
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ── News Items ──────────────────────────────────────────────────────────────

async def save_news_items(items: List[NewsItem]) -> None:
    async with get_session() as session:
        session.add_all(items)
    logger.info("Saved %d news items", len(items))


async def get_news_by_run(run_id: str) -> List[NewsItem]:
    async with get_session() as session:
        result = await session.execute(
            select(NewsItem)
            .where(NewsItem.run_id == run_id)
            .order_by(NewsItem.impact_score.desc())
        )
        return list(result.scalars().all())


# ── Posts ───────────────────────────────────────────────────────────────────

async def save_posts(posts: List[Post]) -> None:
    async with get_session() as session:
        session.add_all(posts)
    logger.info("Saved %d posts", len(posts))


async def get_post(post_id: int) -> Optional[Post]:
    async with get_session() as session:
        result = await session.execute(
            select(Post)
            .options(selectinload(Post.news_item))
            .where(Post.id == post_id)
        )
        return result.scalar_one_or_none()


async def get_pending_posts() -> List[Post]:
    async with get_session() as session:
        result = await session.execute(
            select(Post)
            .options(selectinload(Post.news_item))
            .where(Post.status == PostStatus.PENDING)
            .order_by(Post.created_at.asc())   # oldest first
        )
        return list(result.scalars().all())


async def discard_all_pending_posts() -> int:
    """Mark all pending posts as REJECTED. Returns the number discarded."""
    from sqlalchemy import func
    async with get_session() as session:
        count = (
            await session.execute(
                select(func.count(Post.id)).where(Post.status == PostStatus.PENDING)
            )
        ).scalar_one()
        if count:
            await session.execute(
                update(Post)
                .where(Post.status == PostStatus.PENDING)
                .values(status=PostStatus.REJECTED)
            )
    return count


async def get_posts_by_run(run_id: str) -> List[Post]:
    async with get_session() as session:
        result = await session.execute(
            select(Post)
            .options(selectinload(Post.news_item))
            .where(Post.run_id == run_id)
            .order_by(Post.platform, Post.created_at)
        )
        return list(result.scalars().all())


async def get_published_twitter_posts(limit: int = 50) -> List[Post]:
    """Return the most recent published Twitter posts, newest first."""
    async with get_session() as session:
        result = await session.execute(
            select(Post)
            .options(selectinload(Post.news_item))
            .where(Post.platform == Platform.TWITTER, Post.status == PostStatus.PUBLISHED)
            .order_by(Post.published_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())


async def get_posts_by_news_item(news_item_id: int) -> List[Post]:
    """Return all posts for a given news item."""
    async with get_session() as session:
        result = await session.execute(
            select(Post)
            .options(selectinload(Post.news_item))
            .where(Post.news_item_id == news_item_id)
            .order_by(Post.platform)
        )
        return list(result.scalars().all())


async def update_post_status(
    post_id: int,
    status: PostStatus,
    *,
    platform_post_id: Optional[str] = None,
    error_message: Optional[str] = None,
    telegram_message_id: Optional[int] = None,
) -> None:
    async with get_session() as session:
        values: dict = {"status": status}
        if status == PostStatus.APPROVED:
            values["approved_at"] = datetime.utcnow()
        if status == PostStatus.PUBLISHED:
            values["published_at"] = datetime.utcnow()
        if platform_post_id is not None:
            values["platform_post_id"] = platform_post_id
        if error_message is not None:
            values["error_message"] = error_message
        if telegram_message_id is not None:
            values["telegram_message_id"] = telegram_message_id
        await session.execute(update(Post).where(Post.id == post_id).values(**values))


async def update_post_content(post_id: int, content: str, hashtags: str = "") -> None:
    async with get_session() as session:
        await session.execute(
            update(Post)
            .where(Post.id == post_id)
            .values(content=content, hashtags=hashtags)
        )


async def update_image_path(post_id: int, image_path: str) -> None:
    async with get_session() as session:
        await session.execute(
            update(Post).where(Post.id == post_id).values(image_path=image_path)
        )


# ── Daily Runs ──────────────────────────────────────────────────────────────

async def create_daily_run(run_id: str) -> DailyRun:
    run = DailyRun(run_id=run_id)
    async with get_session() as session:
        session.add(run)
    return run


async def update_daily_run(run_id: str, **kwargs) -> None:
    async with get_session() as session:
        await session.execute(
            update(DailyRun).where(DailyRun.run_id == run_id).values(**kwargs)
        )


async def get_last_runs(limit: int = 7) -> List[DailyRun]:
    async with get_session() as session:
        result = await session.execute(
            select(DailyRun).order_by(DailyRun.started_at.desc()).limit(limit)
        )
        return list(result.scalars().all())


# ── Publication Log ─────────────────────────────────────────────────────────

async def log_action(
    post_id: int,
    platform: str,
    action: str,
    success: bool,
    details: str = "",
) -> None:
    entry = PublicationLog(
        post_id=post_id,
        platform=platform,
        action=action,
        success=success,
        details=details,
    )
    async with get_session() as session:
        session.add(entry)


# ── Stats ───────────────────────────────────────────────────────────────────

async def get_stats() -> dict:
    from sqlalchemy import func
    async with get_session() as session:
        total_posts = (await session.execute(select(func.count(Post.id)))).scalar_one()
        published = (
            await session.execute(
                select(func.count(Post.id)).where(Post.status == PostStatus.PUBLISHED)
            )
        ).scalar_one()
        pending = (
            await session.execute(
                select(func.count(Post.id)).where(Post.status == PostStatus.PENDING)
            )
        ).scalar_one()
        failed = (
            await session.execute(
                select(func.count(Post.id)).where(Post.status == PostStatus.FAILED)
            )
        ).scalar_one()
        total_runs = (await session.execute(select(func.count(DailyRun.id)))).scalar_one()
    return {
        "total_posts": total_posts,
        "published": published,
        "pending": pending,
        "failed": failed,
        "total_runs": total_runs,
    }
