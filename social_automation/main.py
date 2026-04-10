"""
Entry point for the social media automation system.

Starts two concurrent asyncio tasks:
  1. APScheduler – triggers the daily pipeline at the configured time
  2. Telegram bot – listens for admin commands and approval callbacks

Usage:
    cd social_automation
    python main.py
"""
import asyncio
import logging
import os
import signal
import sys

# Allow running directly from the social_automation/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from social_automation.database.db import init_db
from social_automation.scheduler import create_scheduler
from social_automation.telegram.bot import create_bot

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("social_automation.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


async def main() -> None:
    logger.info("Starting Social Media Automation System")

    # Initialize database
    await init_db()

    # Create scheduler and bot
    scheduler = create_scheduler()
    app = create_bot()

    # Handle graceful shutdown
    stop_event = asyncio.Event()

    def _shutdown(*_):
        logger.info("Shutdown signal received")
        stop_event.set()

    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, _shutdown)

    # Start both services
    scheduler.start()
    logger.info("Scheduler started")

    # Run the Telegram bot in polling mode
    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)
    logger.info("Telegram bot started (polling)")

    logger.info(
        "System ready. Telegram bot active. Scheduler will run daily pipeline."
    )

    # Wait until shutdown signal
    await stop_event.wait()

    # Graceful shutdown
    logger.info("Shutting down…")
    await app.updater.stop()
    await app.stop()
    await app.shutdown()
    scheduler.shutdown(wait=False)
    logger.info("Shutdown complete")


if __name__ == "__main__":
    asyncio.run(main())
