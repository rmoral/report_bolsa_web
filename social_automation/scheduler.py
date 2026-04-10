"""
APScheduler configuration: runs the daily pipeline at the configured time.
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

    scheduler.add_job(
        _scheduled_pipeline,
        trigger=CronTrigger(
            hour=config.daily_run_hour,
            minute=config.daily_run_minute,
            timezone=tz,
        ),
        id="daily_pipeline",
        name="Daily social media pipeline",
        replace_existing=True,
        misfire_grace_time=3600,  # Allow up to 1h late start
        coalesce=True,            # Skip missed runs if multiple pile up
    )

    logger.info(
        "Scheduler configured: daily at %02d:%02d %s",
        config.daily_run_hour,
        config.daily_run_minute,
        config.timezone,
    )
    return scheduler


async def _scheduled_pipeline() -> None:
    """Wrapper for the scheduler job with error isolation."""
    try:
        await run_pipeline(triggered_by="scheduler")
    except Exception as exc:
        logger.exception("Scheduled pipeline crashed: %s", exc)
