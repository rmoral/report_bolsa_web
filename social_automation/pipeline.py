"""
Daily automation pipeline.
Orchestrates: fetch news → rank → generate content → save → notify Telegram for approval.
Can be triggered by the scheduler or manually via Telegram /run.
"""
import asyncio
import logging
import uuid
from datetime import datetime, timezone

from social_automation.config import config
from social_automation.database import db
from social_automation.news.fetcher import fetch_all_news
from social_automation.news.ranker import rank_news
from social_automation.content.generator import generate_all_posts
from social_automation.database.models import PostStatus

logger = logging.getLogger(__name__)


async def _notify_telegram(run_id: str, news_count: int, posts) -> None:
    """Send Telegram notification with news summary and post approval prompts."""
    from social_automation.tg_bot.bot import send_admin_message
    from social_automation.tg_bot.handlers import _send_post_for_approval
    from social_automation.tg_bot.bot import create_bot

    summary = (
        f"🌅 *Proceso matutino completado*\n\n"
        f"📰 Noticias analizadas: {news_count}\n"
        f"✍️ Publicaciones generadas: {len(posts)}\n\n"
        f"A continuación te muestro el contenido para cada red social. "
        f"Aprueba, rechaza o edita cada publicación antes de publicar."
    )

    # Use a fresh bot instance to send messages
    app = create_bot()
    async with app:
        await app.bot.send_message(
            chat_id=config.telegram_admin_chat_id,
            text=summary,
            parse_mode="Markdown",
        )
        # Send each post for approval
        for post in posts:
            await _send_post_for_approval(app.bot, post, config.telegram_admin_chat_id)
            await asyncio.sleep(0.5)  # Avoid Telegram flood limits


async def run_pipeline(triggered_by: str = "scheduler") -> None:
    """
    Full pipeline execution:
    1. Create run log
    2. Fetch news from all sources
    3. Rank by impact
    4. Generate content with Claude
    5. Save to DB
    6. Send to Telegram for approval
    """
    run_id = f"{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    logger.info("Starting pipeline run_id=%s triggered_by=%s", run_id, triggered_by)

    await db.create_daily_run(run_id)

    try:
        # ── 1. Fetch news ────────────────────────────────────────────────────
        logger.info("[%s] Fetching news…", run_id)
        news_items = await fetch_all_news(run_id)
        await db.update_daily_run(run_id, news_fetched=len(news_items))

        if not news_items:
            logger.warning("[%s] No news fetched. Aborting.", run_id)
            await db.update_daily_run(run_id, status="failed", error_message="No news fetched")
            return

        # ── 2. Rank and select top N ─────────────────────────────────────────
        logger.info("[%s] Ranking %d items…", run_id, len(news_items))
        ranked = rank_news(news_items, top_n=config.max_news_items)
        await db.save_news_items(news_items)  # Save all, ranked have scores

        # ── 3. Generate content ──────────────────────────────────────────────
        logger.info("[%s] Generating content for %d news items…", run_id, len(ranked))
        posts = await generate_all_posts(ranked)
        await db.save_posts(posts)
        await db.update_daily_run(
            run_id,
            posts_generated=len(posts),
            status="awaiting_approval",
        )

        # ── 4. Auto-publish or notify Telegram ───────────────────────────────
        if config.auto_publish:
            logger.info("[%s] AUTO_PUBLISH=true, publishing without approval…", run_id)
            from social_automation.publishers import publish_post
            published = 0
            for post in posts:
                await db.update_post_status(post.id, PostStatus.APPROVED)
                refreshed = await db.get_post(post.id)
                success = await publish_post(refreshed)
                if success:
                    published += 1
            await db.update_daily_run(
                run_id,
                posts_published=published,
                status="completed",
                completed_at=datetime.utcnow(),
            )
            logger.info("[%s] Auto-published %d/%d posts", run_id, published, len(posts))
        else:
            logger.info("[%s] Notifying Telegram for approval…", run_id)
            await _notify_telegram(run_id, len(ranked), posts)
            logger.info("[%s] Approval prompts sent. Awaiting admin response.", run_id)

    except Exception as exc:
        logger.exception("[%s] Pipeline failed: %s", run_id, exc)
        await db.update_daily_run(
            run_id,
            status="failed",
            error_message=str(exc),
            completed_at=datetime.utcnow(),
        )
        # Alert admin via Telegram
        try:
            from social_automation.tg_bot.bot import send_admin_message
            await send_admin_message(
                f"❌ *Error en el proceso automático*\n\n`{str(exc)[:500]}`"
            )
        except Exception:
            pass
