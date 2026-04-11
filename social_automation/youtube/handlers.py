"""
Telegram handlers for YouTube weekly video script generation.

Flow:
  /youtube            → shows published posts from the last 7 days
  User sends numbers  → selects stories to include ("todo" = all)
  Bot generates       → sends full script as .txt document + metadata summary
  Buttons             → Regenerar / Cancelar
"""
import asyncio
import html
import io
import logging
import textwrap
from datetime import date, datetime, timedelta, timezone
from typing import Optional

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import (
    CallbackQueryHandler, CommandHandler, ContextTypes,
    ConversationHandler, MessageHandler, filters,
)

from social_automation.config import config
from social_automation.database import db
from social_automation.database.models import Platform, Post, PostStatus

logger = logging.getLogger(__name__)

# ConversationHandler state
YT_WAITING_SELECTION = 0

# In-memory sessions {chat_id: {"post_list": [...], "selected": [...], "week_label": str}}
_yt_sessions: dict[int, dict] = {}


def _e(text) -> str:
    return html.escape(str(text))


def _admin_only(func):
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat_id = update.effective_chat.id if update.effective_chat else None
        if chat_id != config.telegram_admin_chat_id:
            return
        return await func(update, context)
    wrapper.__name__ = func.__name__
    return wrapper


def _week_label() -> str:
    """Return a human-readable week label, e.g. 'April 7–13, 2026'."""
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # Monday
    week_end = week_start + timedelta(days=6)
    if week_start.month == week_end.month:
        return f"{week_start.strftime('%B %d')}–{week_end.day}, {week_end.year}"
    return (
        f"{week_start.strftime('%B %d')} – {week_end.strftime('%B %d')}, {week_end.year}"
    )


def _script_keyboard(chat_id: int) -> InlineKeyboardMarkup:
    """Keyboard shown after the script is generated."""
    rows = []
    if config.heygen_enabled and config.youtube_enabled:
        rows.append([
            InlineKeyboardButton(
                "Generar y subir a YouTube",
                callback_data=f"yt_generate:{chat_id}",
            )
        ])
    rows.append([
        InlineKeyboardButton("Regenerar guion", callback_data=f"yt_regen:{chat_id}"),
        InlineKeyboardButton("Cancelar", callback_data=f"yt_cancel:{chat_id}"),
    ])
    return InlineKeyboardMarkup(rows)


async def _get_weekly_posts(days: int = 7) -> list[Post]:
    """Return published Twitter posts from the last N days, newest first."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    posts = await db.get_published_twitter_posts(limit=50)
    return [
        p for p in posts
        if p.published_at and p.published_at.replace(tzinfo=timezone.utc) >= cutoff
    ]


@_admin_only
async def cmd_youtube(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    /youtube — start the weekly script generation flow.
    Lists published tweets from the last 7 days.
    """
    chat_id = update.effective_chat.id
    week = _week_label()

    # Allow /youtube 14 to look back 14 days
    days = 7
    if context.args:
        try:
            days = max(1, min(int(context.args[0]), 30))
        except ValueError:
            pass

    posts = await _get_weekly_posts(days)

    if not posts:
        await update.message.reply_text(
            f"No hay tweets publicados en los últimos {days} días.\n"
            "Publica primero con /run y luego usa /youtube.",
            parse_mode=ParseMode.HTML,
        )
        return ConversationHandler.END

    _yt_sessions[chat_id] = {
        "post_list": posts,
        "selected": [],
        "week_label": week,
    }

    lines = [
        f"<b>Generador de guion semanal para YouTube</b>\n"
        f"Semana: <i>{_e(week)}</i>\n\n"
        f"Tweets publicados en los últimos {days} días "
        f"({len(posts)} encontrados):\n\n"
        "Envía los números de las noticias a incluir separados por espacios "
        "(ej: <code>1 2 3</code>), o escribe <code>todo</code> para incluirlas todas:\n"
    ]
    for i, post in enumerate(posts, 1):
        ts = post.published_at.strftime("%d/%m") if post.published_at else "?"
        news = _e(textwrap.shorten(
            post.news_item.title if post.news_item else post.content,
            width=75, placeholder="…"
        ))
        lines.append(f"{i}. [{ts}] {news}")

    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.HTML)
    return YT_WAITING_SELECTION


async def yt_receive_selection(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> int:
    """Parse story selection and kick off script generation."""
    chat_id = update.effective_chat.id
    session = _yt_sessions.get(chat_id)
    if not session:
        await update.message.reply_text("Sesión expirada. Usa /youtube para empezar.")
        return ConversationHandler.END

    text = update.message.text.strip().lower()
    post_list: list[Post] = session["post_list"]

    if text == "todo":
        selected = list(post_list)
    else:
        try:
            indices = [int(x) - 1 for x in text.split()]
        except ValueError:
            await update.message.reply_text(
                "Formato incorrecto. Envía los números separados por espacios "
                "(ej: <code>1 2 4</code>) o <code>todo</code>:",
                parse_mode=ParseMode.HTML,
            )
            return YT_WAITING_SELECTION

        selected = []
        invalid = []
        for idx in indices:
            if 0 <= idx < len(post_list):
                selected.append(post_list[idx])
            else:
                invalid.append(idx + 1)

        if invalid:
            await update.message.reply_text(
                f"Números fuera de rango: {invalid}. Intenta de nuevo.",
                parse_mode=ParseMode.HTML,
            )
            return YT_WAITING_SELECTION

    if len(selected) < 2:
        await update.message.reply_text(
            "Selecciona al menos 2 noticias para el vídeo. Intenta de nuevo:",
            parse_mode=ParseMode.HTML,
        )
        return YT_WAITING_SELECTION

    session["selected"] = selected

    # Cap at 8 stories to keep the script manageable
    if len(selected) > 8:
        selected = selected[:8]
        session["selected"] = selected
        await update.message.reply_text(
            f"Se han seleccionado las primeras 8 noticias (máximo recomendado).",
            parse_mode=ParseMode.HTML,
        )

    msg = await update.message.reply_text(
        f"Generando guion completo con {len(selected)} "
        f"{'noticia' if len(selected) == 1 else 'noticias'}...\n"
        "Esto puede tardar entre 30 y 60 segundos.",
    )

    asyncio.create_task(
        _generate_and_send_script(chat_id, selected, session["week_label"], context.bot, msg.message_id)
    )
    return ConversationHandler.END


async def _generate_and_send_script(
    chat_id: int,
    posts: list[Post],
    week_label: str,
    bot,
    progress_msg_id: int,
) -> None:
    """Run GPT generation and deliver the script as a Telegram document."""
    from social_automation.youtube.generator import generate_video_script

    try:
        loop = asyncio.get_event_loop()
        script = await loop.run_in_executor(
            None, generate_video_script, posts, week_label
        )

        # --- Send summary card ---
        tags_preview = ", ".join(script.tags[:8]) + ("…" if len(script.tags) > 8 else "")
        summary = (
            f"<b>Guion generado</b>\n\n"
            f"<b>Título YouTube:</b> {_e(script.youtube_title or script.title)}\n"
            f"<b>Duración estimada:</b> {_e(script.estimated_duration)}\n"
            f"<b>Noticias incluidas:</b> {script.story_count}\n"
            f"<b>Tags:</b> <i>{_e(tags_preview)}</i>\n\n"
            f"<b>Descripción (preview):</b>\n"
            f"{_e(textwrap.shorten(script.youtube_description, width=300, placeholder='…'))}"
        )
        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text=summary,
            parse_mode=ParseMode.HTML,
            reply_markup=_script_keyboard(chat_id),
        )

        # --- Send full script as .txt document ---
        safe_title = (script.youtube_title or "weekly_script").lower()
        safe_title = "".join(c if c.isalnum() or c in "-_ " else "_" for c in safe_title)
        safe_title = safe_title.replace(" ", "_")[:60]
        filename = f"script_{safe_title}.txt"

        script_bytes = script.script_text.encode("utf-8")
        await bot.send_document(
            chat_id=chat_id,
            document=io.BytesIO(script_bytes),
            filename=filename,
            caption=(
                f"Guion completo — {_e(week_label)}\n"
                f"{len(script.script_text):,} caracteres | "
                f"{len(script.script_text.split()):,} palabras"
            ),
            parse_mode=ParseMode.HTML,
        )

        # Store for potential regeneration
        session = _yt_sessions.get(chat_id, {})
        session["last_script"] = script

    except Exception as exc:
        logger.error("YouTube script generation failed: %s", exc)
        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text=f"Error generando el guion: {_e(str(exc))}\n\nIntenta de nuevo con /youtube.",
            parse_mode=ParseMode.HTML,
        )


async def cb_yt_regen(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Regenerate the script from the same selected posts."""
    query = update.callback_query
    await query.answer()
    chat_id = update.effective_chat.id
    session = _yt_sessions.get(chat_id)

    if not session or not session.get("selected"):
        await query.edit_message_text(
            "Sesión expirada. Usa /youtube para empezar de nuevo."
        )
        return

    posts = session["selected"]
    week_label = session.get("week_label", "")

    await query.edit_message_text(
        f"Regenerando guion con {len(posts)} noticias...\n"
        "Esto puede tardar entre 30 y 60 segundos.",
    )

    asyncio.create_task(
        _generate_and_send_script(chat_id, posts, week_label, context.bot, query.message.message_id)
    )


async def cb_yt_generate(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Start the HeyGen + YouTube upload pipeline."""
    query = update.callback_query
    await query.answer()
    chat_id = update.effective_chat.id
    session = _yt_sessions.get(chat_id)

    if not session or not session.get("last_script"):
        await query.edit_message_text(
            "Sesión expirada o guion no disponible. Usa /youtube para empezar de nuevo."
        )
        return

    script = session["last_script"]

    if not config.heygen_enabled:
        await query.edit_message_text(
            "HeyGen no está configurado.\n"
            "Añade HEYGEN_API_KEY, HEYGEN_AVATAR_ID y HEYGEN_VOICE_ID al .env"
        )
        return

    if not config.youtube_enabled:
        await query.edit_message_text(
            "YouTube no está autorizado.\n"
            "Ejecuta: python social_automation/youtube/setup_oauth.py"
        )
        return

    await query.edit_message_text(
        f"Iniciando pipeline de vídeo:\n<b>{_e(script.youtube_title or script.title)}</b>\n\n"
        "Las actualizaciones de progreso aparecerán aquí.\n"
        "El proceso tarda entre 10 y 35 minutos.",
        parse_mode=ParseMode.HTML,
    )

    from social_automation.youtube.pipeline import run_video_pipeline
    asyncio.create_task(
        run_video_pipeline(script, chat_id, query.message.message_id, context.bot)
    )


async def cb_yt_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Cancel and clear session."""
    query = update.callback_query
    await query.answer()
    chat_id = update.effective_chat.id
    _yt_sessions.pop(chat_id, None)
    await query.edit_message_text("Generación de guion cancelada.")


@_admin_only
async def cmd_yt_avatars(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List available HeyGen avatars."""
    if not config.heygen_enabled:
        await update.message.reply_text("HeyGen no está configurado (falta HEYGEN_API_KEY).")
        return
    try:
        from social_automation.youtube.heygen import list_avatars
        avatars = await list_avatars()
        if not avatars:
            await update.message.reply_text("No se encontraron avatares en tu cuenta HeyGen.")
            return
        lines = ["<b>Avatares HeyGen disponibles</b>\n"]
        for av in avatars[:20]:
            av_id = _e(av.get("avatar_id") or av.get("id", "?"))
            name = _e(av.get("avatar_name") or av.get("name", "?"))
            lines.append(f"• <code>{av_id}</code> — {name}")
        await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.HTML)
    except Exception as exc:
        await update.message.reply_text(f"Error obteniendo avatares: {_e(str(exc))}", parse_mode=ParseMode.HTML)


@_admin_only
async def cmd_yt_voices(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List available HeyGen voices filtered to English."""
    if not config.heygen_enabled:
        await update.message.reply_text("HeyGen no está configurado (falta HEYGEN_API_KEY).")
        return
    try:
        from social_automation.youtube.heygen import list_voices
        voices = await list_voices()
        # Filter English voices
        en_voices = [v for v in voices if str(v.get("language", "")).lower().startswith("en")][:20]
        if not en_voices:
            en_voices = voices[:20]
        lines = ["<b>Voces HeyGen (inglés)</b>\n"]
        for v in en_voices:
            v_id = _e(v.get("voice_id") or v.get("id", "?"))
            name = _e(v.get("display_name") or v.get("name", "?"))
            gender = _e(v.get("gender", ""))
            lines.append(f"• <code>{v_id}</code> — {name} {gender}")
        await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.HTML)
    except Exception as exc:
        await update.message.reply_text(f"Error obteniendo voces: {_e(str(exc))}", parse_mode=ParseMode.HTML)


async def yt_cmd_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle /cancel during youtube conversation."""
    chat_id = update.effective_chat.id
    _yt_sessions.pop(chat_id, None)
    await update.message.reply_text("Operación cancelada.")
    return ConversationHandler.END


def register_youtube_handlers(app) -> None:
    """Register all YouTube-related handlers on the Telegram Application."""
    yt_conv = ConversationHandler(
        entry_points=[CommandHandler("youtube", cmd_youtube)],
        states={
            YT_WAITING_SELECTION: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, yt_receive_selection),
            ],
        },
        fallbacks=[CommandHandler("cancel", yt_cmd_cancel)],
        per_message=False,
    )
    app.add_handler(yt_conv)

    # Inline button callbacks
    app.add_handler(CallbackQueryHandler(cb_yt_generate, pattern=r"^yt_generate:"))
    app.add_handler(CallbackQueryHandler(cb_yt_regen, pattern=r"^yt_regen:"))
    app.add_handler(CallbackQueryHandler(cb_yt_cancel, pattern=r"^yt_cancel:"))

    # Utility commands
    app.add_handler(CommandHandler("yt_avatars", cmd_yt_avatars))
    app.add_handler(CommandHandler("yt_voices", cmd_yt_voices))
