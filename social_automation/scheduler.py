"""
APScheduler configuration.

Registers two daily pipeline jobs:
  • Morning  — DAILY_RUN_HOUR:DAILY_RUN_MINUTE       (default 09:00)
  • Afternoon — AFTERNOON_RUN_HOUR:AFTERNOON_RUN_MINUTE (default 14:00)

Set AFTERNOON_RUN_HOUR=-1 in .env to disable the afternoon job.
Both jobs call run_pipeline() which fetches news, generates posts and
sends them to Telegram for approval.
"""
import asyncio
import logging

import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from social_automation.config import config
from social_automation.pipeline import run_pipeline

logger = logging.getLogger(__name__)


def create_scheduler() -> AsyncIOScheduler:
    """Build and configure the AsyncIO scheduler."""
    tz = pytz.timezone(config.timezone)
    scheduler = AsyncIOScheduler(timezone=tz)

    # ── Morning run ──────────────────────────────────────────────────────────
    scheduler.add_job(
        _scheduled_pipeline,
        trigger=CronTrigger(
            hour=config.daily_run_hour,
            minute=config.daily_run_minute,
            timezone=tz,
        ),
        id="morning_pipeline",
        name="Morning social media pipeline",
        replace_existing=True,
        misfire_grace_time=3600,
        coalesce=True,
    )
    logger.info(
        "Scheduler: morning pipeline at %02d:%02d %s",
        config.daily_run_hour, config.daily_run_minute, config.timezone,
    )

    # ── Afternoon run (optional) ─────────────────────────────────────────────
    if config.afternoon_run_hour >= 0:
        scheduler.add_job(
            _scheduled_pipeline,
            trigger=CronTrigger(
                hour=config.afternoon_run_hour,
                minute=config.afternoon_run_minute,
                timezone=tz,
            ),
            id="afternoon_pipeline",
            name="Afternoon social media pipeline",
            replace_existing=True,
            misfire_grace_time=3600,
            coalesce=True,
        )
        logger.info(
            "Scheduler: afternoon pipeline at %02d:%02d %s",
            config.afternoon_run_hour, config.afternoon_run_minute, config.timezone,
        )
    else:
        logger.info("Scheduler: afternoon pipeline disabled (AFTERNOON_RUN_HOUR=-1)")

    return scheduler


async def _scheduled_pipeline() -> None:
    """Wrapper for the scheduler job with error isolation."""
    try:
        await run_pipeline(triggered_by="scheduler")
    except Exception as exc:
        logger.exception("Scheduled pipeline crashed: %s", exc)
