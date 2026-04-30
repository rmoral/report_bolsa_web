"""
Telegram handler for /educational command.

Flow:
  /educational [topic]
    → If topic provided inline: generate immediately
    → Otherwise: show numbered list of suggested topics
  User picks a number or types a custom topic
    → Generates X + LinkedIn posts → sends each for individual approval
    → After posts are sent, shows "Generate blog post" button
  User clicks blog button
    → Generates educational blog post from the same topic
    → Shows blog preview with Publish / Regenerate / Cancel buttons
"""
import asyncio
import html
import logging
import textwrap
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
from social_automation.tg_bot.handlers import _send_post_for_approval

logger = logging.getLogger(__name__)

# ConversationHandler states
EDU_WAITING_TOPIC = 0

# In-memory topic store: {chat_id: topic_string}
_edu_topics: dict[int, str] = {}


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


def _blog_offer_keyboard(chat_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [InlineKeyboardButton(
            "Generar también para el blog",
            callback_data=f"edu_blog:{chat_id}",
        )],
    ])


@_admin_guard
async def cmd_educational(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    /educational [topic] — start the educational content generation flow.
    If a topic is provided inline, generate immediately.
    """
    inline_topic = " ".join(context.args).strip() if context.args else ""
    if inline_topic:
        msg = await update.message.reply_text(
            f"Generando contenido formativo sobre:\n<i>{html.escape(inline_topic)}</i>",
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
        f"Generando contenido formativo sobre:\n<i>{html.escape(topic)}</i>",
        parse_mode=ParseMode.HTML,
    )
    asyncio.create_task(
        _generate_and_send(topic, update.effective_chat.id, context.bot, msg.message_id)
    )
    return ConversationHandler.END


async def _generate_and_send(topic: str, chat_id: int, bot, progress_msg_id: int) -> None:
    """Generate educational posts for X + LinkedIn, send for approval, then offer blog."""
    run_id = f"edu_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    try:
        loop = asyncio.get_event_loop()
        posts = await loop.run_in_executor(None, generate_educational_posts, topic, run_id)
        if not posts:
            await bot.edit_message_text(
                chat_id=chat_id, message_id=progress_msg_id,
                text="No se pudo generar contenido formativo. Revisa los logs.",
            )
            return

        await db.save_posts(posts)
        saved = [await db.get_post(p.id) for p in posts]

        if config.generate_images:
            from social_automation.content.image_generator import generate_images_for_posts
            await generate_images_for_posts(saved)

        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text=(
                f"<b>{len(saved)}</b> publicación(es) generada(s) sobre:\n"
                f"<i>{html.escape(topic)}</i>\n\nRevisa y aprueba cada una:"
            ),
            parse_mode=ParseMode.HTML,
        )
        for post in saved:
            if post.platform.value == "twitter" and len(config.twitter_accounts) > 1:
                from social_automation.tg_bot.keyboards import account_selection_keyboard
                await bot.send_message(
                    chat_id=chat_id,
                    text="¿En qué cuenta de X publicar este post?",
                    reply_markup=account_selection_keyboard(config.twitter_accounts, post.id),
                )
            else:
                await _send_post_for_approval(bot, post, chat_id)

        # Store topic and offer blog generation
        _edu_topics[chat_id] = topic
        await bot.send_message(
            chat_id=chat_id,
            text=(
                f"¿Quieres también un artículo de blog sobre este tema?\n"
                f"<i>{html.escape(topic)}</i>"
            ),
            parse_mode=ParseMode.HTML,
            reply_markup=_blog_offer_keyboard(chat_id),
        )

    except Exception as exc:
        logger.error("Educational generation failed: %s", exc, exc_info=True)
        await bot.edit_message_text(
            chat_id=chat_id, message_id=progress_msg_id,
            text=f"Error generando contenido formativo: {html.escape(str(exc))}",
        )


# ── Blog generation from educational topic ────────────────────────────────────

async def cb_edu_blog(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generate a blog post from the educational topic."""
    query = update.callback_query
    await query.answer()
    chat_id = update.effective_chat.id

    topic = _edu_topics.get(chat_id)
    if not topic:
        await query.edit_message_text("Sesión expirada. Usa /educational para empezar de nuevo.")
        return

    await query.edit_message_text(
        f"Generando artículo de blog sobre:\n<i>{html.escape(topic)}</i>\n\n"
        "Esto puede tardar 30-60 segundos…",
        parse_mode=ParseMode.HTML,
    )
    asyncio.create_task(
        _generate_edu_blog(topic, chat_id, context.bot, query.message.message_id)
    )


async def _generate_edu_blog(topic: str, chat_id: int, bot, progress_msg_id: int) -> None:
    """Generate and preview a blog post from a topic."""
    from social_automation.blog.generator import generate_blog_post_from_topic
    from social_automation.blog.handlers import (
        _blog_sessions, _blog_approval_keyboard, _format_blog_preview,
    )

    session_key = f"edu_{chat_id}"
    try:
        loop = asyncio.get_event_loop()
        blog = await loop.run_in_executor(None, generate_blog_post_from_topic, topic)

        # Try to generate a featured image
        image_path = None
        if blog.image_prompt and config.generate_images:
            try:
                from social_automation.content.image_generator import generate_image_from_prompt
                image_path = await generate_image_from_prompt(blog.image_prompt, f"edu_blog_{chat_id}")
            except Exception as img_exc:
                logger.warning("Educational blog image generation failed: %s", img_exc)

        # Store in blog sessions so the existing publish flow works
        _blog_sessions[chat_id] = {
            "blog": blog,
            "image_path": image_path,
            "selected_posts": [],     # no source posts for educational content
        }

        preview = _format_blog_preview(blog)
        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text=preview,
            parse_mode=ParseMode.HTML,
            reply_markup=_blog_approval_keyboard(session_key),
        )

    except Exception as exc:
        logger.error("Educational blog generation failed: %s", exc, exc_info=True)
        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text=f"Error generando el artículo de blog: {html.escape(str(exc))}",
        )


async def edu_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    _edu_topics.pop(update.effective_chat.id, None)
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
    app.add_handler(CallbackQueryHandler(cb_edu_blog, pattern=r"^edu_blog:\d+$"))
