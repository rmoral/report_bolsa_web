"""
Telegram bot factory. Creates and configures the Application instance.
"""
import logging

from telegram.ext import Application

from social_automation.config import config
from social_automation.telegram.handlers import register_handlers

logger = logging.getLogger(__name__)


def create_bot() -> Application:
    """Build and configure the Telegram Application."""
    app = (
        Application.builder()
        .token(config.telegram_bot_token)
        .build()
    )
    register_handlers(app)
    logger.info("Telegram bot configured")
    return app


async def send_admin_message(text: str, parse_mode: str = "Markdown") -> None:
    """Utility to send a message to the admin chat from outside the bot context."""
    app = create_bot()
    async with app:
        await app.bot.send_message(
            chat_id=config.telegram_admin_chat_id,
            text=text,
            parse_mode=parse_mode,
        )
