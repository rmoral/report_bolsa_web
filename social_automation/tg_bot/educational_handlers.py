"""
Telegram handler for /educational command.

Flow:
  /educational [topic]
    → If topic provided inline: generate immediately
    → Otherwise: show numbered list of suggested topics
  User picks a number or types a custom topic
    → Generates X + LinkedIn posts
    → Sends each for individual approval (same flow as news posts)
"""
import asyncio
import logging
import uuid
from datetime import datetime, timezone

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import (
    CallbackQueryHandler, CommandHandler, ContextTypes,
    ConversationHandler, MessageHandler, filters,
)

from social_automation.config import config
from social_automation.content.educational_generator import (
    SUGGESTED_TOPICS, generate_educational_posts,
)
from social_automation.database import db
from social_automation.tg_bot.handlers import admin_only, _send_post_for_approval

logger = logging.getLogger(__name__)

# ConversationHandler states
EDU_WAITING_TOPIC = 0


def _admin_guard(func):
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat_id = update.effective_chat.id if update.effective_chat else None
        if chat_id != config.telegram_admin_chat_id:
            return
        return await func(update, context)
    wrapper.__name__ = func.__name__
    return wrapper


def _topics_message() -> str:
    lines = ["<b>Contenido formativo</b>\n\nElige un tema o escribe el tuyo:\n"]
    for i, topic in enumerate(SUGGESTED_TOPICS, 1):
        lines.append(f"{i}. {topic}")
    lines.append("\nEnvía el número o escribe tu propio tema:")
    return "\n".join(lines)


@_admin_guard
async def cmd_educational(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    /educational [topic] — start the educational content generation flow.
    If a topic is provided inline, generate immediately.
    """
    inline_topic = " ".join(context.args).strip() if context.args else ""
    if inline_topic:
        # Topic provided directly: generate right away
        msg = await update.message.reply_text(
            f"Generando contenido formativo sobre:\n<i>{inline_topic}</i>",
            parse_mode=ParseMode.HTML,
        )
        asyncio.create_task(
            _generate_and_send(inline_topic, update.effective_chat.id, context.bot, msg.message_id)
        )
        return ConversationHandler.END

    await update.message.reply_text(_topics_message(), parse_mode=ParseMode.HTML)
    return EDU_WAITING_TOPIC


async def edu_receive_topic(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Parse the user's topic choice (number or text) and generate posts."""
    text = update.message.text.strip()
    topic = text

    # If user sent a number, resolve it to the suggested topic
    if text.isdigit():
        idx = int(text) - 1
        if 0 <= idx < len(SUGGESTED_TOPICS):
            topic = SUGGESTED_TOPICS[idx]
        else:
            await update.message.reply_text(
                f"Número fuera de rango. Elige entre 1 y {len(SUGGESTED_TOPICS)}."
            )
            return EDU_WAITING_TOPIC

    if len(topic) < 5:
        await update.message.reply_text("El tema es demasiado corto. Escríbelo más en detalle.")
        return EDU_WAITING_TOPIC

    msg = await update.message.reply_text(
        f"Generando contenido formativo sobre:\n<i>{topic}</i>",
        parse_mode=ParseMode.HTML,
    )
    asyncio.create_task(
        _generate_and_send(topic, update.effective_chat.id, context.bot, msg.message_id)
    )
    return ConversationHandler.END


async def _generate_and_send(
    topic: str, chat_id: int, bot, progress_msg_id: int
) -> None:
    """Generate educational posts and send each for approval."""
    run_id = f"edu_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    try:
        loop = asyncio.get_event_loop()
        posts = await loop.run_in_executor(
            None, generate_educational_posts, topic, run_id
        )
        if not posts:
            await bot.edit_message_text(
                chat_id=chat_id,
                message_id=progress_msg_id,
                text="No se pudo generar contenido formativo. Revisa los logs.",
            )
            return

        await db.save_posts(posts)

        # Reload with relationships so _send_post_for_approval works
        saved = [await db.get_post(p.id) for p in posts]

        # Generate images
        if config.generate_images:
            from social_automation.content.image_generator import generate_images_for_posts
            await generate_images_for_posts(saved)

        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text=(
                f"<b>{len(saved)}</b> publicación(es) formativa(s) generada(s) sobre:\n"
                f"<i>{topic}</i>\n\nRevisa y aprueba cada una:",
            ),
            parse_mode=ParseMode.HTML,
        )
        for post in saved:
            await _send_post_for_approval(bot, post, chat_id)

    except Exception as exc:
        logger.error("Educational generation failed: %s", exc, exc_info=True)
        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text=f"Error generando contenido formativo: {exc}",
        )


async def edu_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Operación cancelada.")
    return ConversationHandler.END


def register_educational_handlers(app) -> None:
    edu_conv = ConversationHandler(
        entry_points=[CommandHandler("educational", cmd_educational)],
        states={
            EDU_WAITING_TOPIC: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, edu_receive_topic),
            ],
        },
        fallbacks=[CommandHandler("cancel", edu_cancel)],
        per_message=False,
    )
    app.add_handler(edu_conv)
