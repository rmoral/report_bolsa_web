"""
All Telegram bot command and callback handlers.
Provides full control over the automation pipeline via chat.
"""
import asyncio
import logging
import textwrap
from datetime import datetime, timezone
from typing import Optional

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import (
    CallbackQueryHandler, CommandHandler, ContextTypes,
    ConversationHandler, MessageHandler, filters,
)

from social_automation.database import db
from social_automation.database.models import Platform, Post, PostStatus
from social_automation.telegram.keyboards import (
    PLATFORM_EMOJIS, confirm_edit_keyboard, pagination_keyboard, post_approval_keyboard,
)
from social_automation.config import config

logger = logging.getLogger(__name__)

# ConversationHandler states
WAITING_EDIT_TEXT, CONFIRM_EDIT = range(2)

# Temporary storage for edit sessions {post_id: new_content}
_edit_sessions: dict[int, str] = {}


# ── Guard ───────────────────────────────────────────────────────────────────

def admin_only(func):
    """Decorator: only admin chat can use these handlers."""
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat_id = update.effective_chat.id if update.effective_chat else None
        if chat_id != config.telegram_admin_chat_id:
            return
        return await func(update, context)
    wrapper.__name__ = func.__name__
    return wrapper


# ── Helpers ─────────────────────────────────────────────────────────────────

def _platform_label(platform) -> str:
    val = platform.value if hasattr(platform, "value") else str(platform)
    return f"{PLATFORM_EMOJIS.get(val, '📱')} {val.capitalize()}"


def _format_post_preview(post: Post, truncate: int = 600) -> str:
    label = _platform_label(post.platform)
    content = post.content[:truncate]
    if len(post.content) > truncate:
        content += "…"
    hashtags = f"\n\n{post.hashtags}" if post.hashtags else ""
    news_title = post.news_item.title[:100] if post.news_item else ""
    return (
        f"*{label}*\n"
        f"📰 _{news_title}_\n\n"
        f"{content}{hashtags}"
    )


async def _send_post_for_approval(
    bot, post: Post, chat_id: int
) -> Optional[int]:
    """Send a post preview with approval buttons. Returns the message ID."""
    try:
        text = _format_post_preview(post)
        msg = await bot.send_message(
            chat_id=chat_id,
            text=text,
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=post_approval_keyboard(post.id, post.platform),
        )
        await db.update_post_status(post.id, PostStatus.PENDING, telegram_message_id=msg.message_id)
        return msg.message_id
    except Exception as exc:
        logger.error("Failed to send approval message for post id=%d: %s", post.id, exc)
        return None


# ── Commands ────────────────────────────────────────────────────────────────

@admin_only
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = (
        "*Sistema de Publicación Automatizada* 🤖\n\n"
        "Controla tus redes sociales desde aquí.\n\n"
        "*Comandos disponibles:*\n"
        "/run — Iniciar proceso de búsqueda y generación\n"
        "/pending — Ver publicaciones pendientes de aprobación\n"
        "/news — Ver noticias del último proceso\n"
        "/stats — Estadísticas de publicación\n"
        "/status — Estado del sistema y plataformas\n"
        "/help — Ayuda completa"
    )
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)


@admin_only
async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = (
        "*Ayuda del sistema* 📖\n\n"
        "*Proceso automático:*\n"
        "Cada mañana a las %02d:%02d (%s) el sistema:\n"
        "1. Busca las noticias más impactantes\n"
        "2. Genera contenido para LinkedIn, X e Instagram\n"
        "3. Te envía aquí para aprobación\n\n"
        "*Comandos:*\n"
        "`/run` — Lanzar proceso manualmente\n"
        "`/pending` — Publicaciones esperando aprobación\n"
        "`/news [n]` — Ver las últimas n noticias (default 10)\n"
        "`/stats` — Estadísticas de los últimos 7 días\n"
        "`/status` — Estado de conexión de plataformas\n\n"
        "*Aprobar publicaciones:*\n"
        "Cuando el bot te mande una publicación, usa los botones:\n"
        "✅ *Aprobar* — Publicar inmediatamente\n"
        "❌ *Rechazar* — Descartar sin publicar\n"
        "✏️ *Editar* — Modificar el texto antes de publicar"
    ) % (config.daily_run_hour, config.daily_run_minute, config.timezone)
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)


@admin_only
async def cmd_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    stats = await db.get_stats()
    runs = await db.get_last_runs(1)
    last_run = runs[0] if runs else None

    platforms_status = []
    if config.twitter_enabled:
        platforms_status.append("✅ X/Twitter")
    else:
        platforms_status.append("❌ X/Twitter (no configurado)")
    if config.linkedin_enabled:
        platforms_status.append("✅ LinkedIn")
    else:
        platforms_status.append("❌ LinkedIn (no configurado)")
    if config.instagram_enabled:
        platforms_status.append("✅ Instagram")
    else:
        platforms_status.append("❌ Instagram (no configurado)")

    last_run_text = "Ninguno"
    if last_run:
        ts = last_run.started_at.strftime("%d/%m/%Y %H:%M") if last_run.started_at else "?"
        last_run_text = f"{ts} — {last_run.status}"

    text = (
        "*Estado del Sistema* ⚙️\n\n"
        f"*Plataformas:*\n" + "\n".join(f"  {p}" for p in platforms_status) + "\n\n"
        f"*Base de datos:*\n"
        f"  Total posts generados: {stats['total_posts']}\n"
        f"  Publicados: {stats['published']}\n"
        f"  Pendientes: {stats['pending']}\n"
        f"  Fallidos: {stats['failed']}\n"
        f"  Ejecuciones totales: {stats['total_runs']}\n\n"
        f"*Último proceso:* {last_run_text}\n\n"
        f"*Horario automático:* {config.daily_run_hour:02d}:{config.daily_run_minute:02d} {config.timezone}"
    )
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)


@admin_only
async def cmd_run(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Manually trigger the daily pipeline."""
    await update.message.reply_text(
        "🔄 Iniciando proceso de búsqueda y generación de contenido…\n"
        "Esto puede tardar 1-2 minutos.",
    )
    # Import here to avoid circular imports
    from social_automation.pipeline import run_pipeline
    asyncio.create_task(run_pipeline(triggered_by=f"telegram:{update.effective_user.username}"))


@admin_only
async def cmd_pending(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show all pending posts and re-send approval messages."""
    posts = await db.get_pending_posts()
    if not posts:
        await update.message.reply_text("✅ No hay publicaciones pendientes de aprobación.")
        return
    await update.message.reply_text(
        f"📋 Hay *{len(posts)}* publicación(es) pendiente(s):", parse_mode=ParseMode.MARKDOWN
    )
    for post in posts:
        await _send_post_for_approval(context.bot, post, update.effective_chat.id)


@admin_only
async def cmd_news(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show recent news items."""
    runs = await db.get_last_runs(1)
    if not runs:
        await update.message.reply_text("No se ha ejecutado ningún proceso todavía.")
        return
    run_id = runs[0].run_id
    news_items = await db.get_news_by_run(run_id)

    limit = 10
    if context.args:
        try:
            limit = int(context.args[0])
        except ValueError:
            pass

    news_items = news_items[:limit]
    if not news_items:
        await update.message.reply_text("No hay noticias en el último proceso.")
        return

    lines = [f"*Noticias del último proceso* ({runs[0].started_at.strftime('%d/%m %H:%M')})\n"]
    for i, item in enumerate(news_items, 1):
        score = f"{item.impact_score:.1f}" if item.impact_score else "?"
        title = textwrap.shorten(item.title, width=80, placeholder="…")
        source = item.source or "?"
        category = item.category or "?"
        lines.append(f"{i}. [{score}] *{title}*\n   📡 {source} | 📂 {category}")

    await update.message.reply_text("\n\n".join(lines), parse_mode=ParseMode.MARKDOWN)


@admin_only
async def cmd_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    runs = await db.get_last_runs(7)
    stats = await db.get_stats()

    run_lines = []
    for run in runs:
        ts = run.started_at.strftime("%d/%m") if run.started_at else "?"
        emoji = "✅" if run.status == "completed" else ("❌" if run.status == "failed" else "⏳")
        run_lines.append(
            f"  {emoji} {ts} — {run.posts_published}/{run.posts_generated} publicados"
        )

    text = (
        "*Estadísticas de publicación* 📊\n\n"
        f"*Global:*\n"
        f"  Posts publicados: {stats['published']}\n"
        f"  Posts fallidos: {stats['failed']}\n"
        f"  Ejecuciones totales: {stats['total_runs']}\n\n"
        f"*Últimas 7 ejecuciones:*\n" + "\n".join(run_lines or ["  Sin datos"])
    )
    await update.message.reply_text(text, parse_mode=ParseMode.MARKDOWN)


# ── Approval Callbacks ───────────────────────────────────────────────────────

async def cb_approve(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    post_id = int(query.data.split(":")[1])
    post = await db.get_post(post_id)
    if not post:
        await query.edit_message_text("⚠️ Publicación no encontrada.")
        return

    await db.update_post_status(post_id, PostStatus.APPROVED)
    await query.edit_message_text(
        f"✅ *Aprobado* — Publicando en {_platform_label(post.platform)}…",
        parse_mode=ParseMode.MARKDOWN,
    )

    from social_automation.publishers import publish_post
    post = await db.get_post(post_id)
    success = await publish_post(post)

    if success:
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=f"🎉 Publicado en *{_platform_label(post.platform)}* correctamente.",
            parse_mode=ParseMode.MARKDOWN,
        )
    else:
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=f"❌ Error al publicar en *{_platform_label(post.platform)}*. "
                 "Revisa los logs con /status",
            parse_mode=ParseMode.MARKDOWN,
        )


async def cb_reject(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    post_id = int(query.data.split(":")[1])
    post = await db.get_post(post_id)
    if not post:
        await query.edit_message_text("⚠️ Publicación no encontrada.")
        return

    await db.update_post_status(post_id, PostStatus.REJECTED)
    await db.log_action(post_id, post.platform.value, "reject", True)
    await query.edit_message_text(
        f"❌ *Rechazado* — La publicación en {_platform_label(post.platform)} "
        "ha sido descartada.",
        parse_mode=ParseMode.MARKDOWN,
    )


# ── Edit Conversation ────────────────────────────────────────────────────────

async def cb_edit_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Entry point for the edit conversation."""
    query = update.callback_query
    await query.answer()
    post_id = int(query.data.split(":")[1])
    post = await db.get_post(post_id)
    if not post:
        await query.edit_message_text("⚠️ Publicación no encontrada.")
        return ConversationHandler.END

    context.user_data["editing_post_id"] = post_id
    preview = textwrap.shorten(post.content, width=300, placeholder="…")
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=(
            f"✏️ *Editando publicación para {_platform_label(post.platform)}*\n\n"
            f"*Texto actual:*\n{preview}\n\n"
            "Envía el nuevo texto (o /cancel para cancelar):"
        ),
        parse_mode=ParseMode.MARKDOWN,
    )
    return WAITING_EDIT_TEXT


async def edit_receive_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Receive the new text and ask for confirmation."""
    new_text = update.message.text
    post_id = context.user_data.get("editing_post_id")
    if not post_id:
        await update.message.reply_text("❌ Sesión de edición expirada. Intenta de nuevo.")
        return ConversationHandler.END

    _edit_sessions[post_id] = new_text
    preview = textwrap.shorten(new_text, width=400, placeholder="…")
    await update.message.reply_text(
        f"*Vista previa del nuevo texto:*\n\n{preview}\n\n"
        "¿Confirmar y aprobar esta publicación?",
        parse_mode=ParseMode.MARKDOWN,
        reply_markup=confirm_edit_keyboard(post_id),
    )
    return CONFIRM_EDIT


async def cb_confirm_edit(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Save edit and approve the post."""
    query = update.callback_query
    await query.answer()
    post_id = int(query.data.split(":")[1])
    new_text = _edit_sessions.pop(post_id, None)
    if not new_text:
        await query.edit_message_text("⚠️ Texto no encontrado. Intenta de nuevo con /pending")
        return ConversationHandler.END

    await db.update_post_content(post_id, new_text)
    await db.update_post_status(post_id, PostStatus.APPROVED)
    post = await db.get_post(post_id)

    await query.edit_message_text(
        f"✅ Texto actualizado. Publicando en {_platform_label(post.platform)}…",
        parse_mode=ParseMode.MARKDOWN,
    )

    from social_automation.publishers import publish_post
    success = await publish_post(post)
    status_msg = "🎉 Publicado correctamente." if success else "❌ Error al publicar. Revisa /status"
    await context.bot.send_message(
        chat_id=update.effective_chat.id, text=status_msg
    )
    context.user_data.pop("editing_post_id", None)
    return ConversationHandler.END


async def cb_cancel_edit(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    post_id = int(query.data.split(":")[1])
    _edit_sessions.pop(post_id, None)
    context.user_data.pop("editing_post_id", None)
    await query.edit_message_text("❌ Edición cancelada.")
    return ConversationHandler.END


async def cmd_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.pop("editing_post_id", None)
    await update.message.reply_text("✅ Operación cancelada.")
    return ConversationHandler.END


# ── Handler registration ─────────────────────────────────────────────────────

def register_handlers(app) -> None:
    """Register all handlers on the Telegram Application."""
    # Commands
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CommandHandler("status", cmd_status))
    app.add_handler(CommandHandler("run", cmd_run))
    app.add_handler(CommandHandler("pending", cmd_pending))
    app.add_handler(CommandHandler("news", cmd_news))
    app.add_handler(CommandHandler("stats", cmd_stats))

    # Edit conversation
    edit_conv = ConversationHandler(
        entry_points=[CallbackQueryHandler(cb_edit_start, pattern=r"^edit:\d+$")],
        states={
            WAITING_EDIT_TEXT: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, edit_receive_text)
            ],
            CONFIRM_EDIT: [
                CallbackQueryHandler(cb_confirm_edit, pattern=r"^confirm_edit:\d+$"),
                CallbackQueryHandler(cb_cancel_edit, pattern=r"^cancel_edit:\d+$"),
            ],
        },
        fallbacks=[CommandHandler("cancel", cmd_cancel)],
        per_message=False,
    )
    app.add_handler(edit_conv)

    # Approval callbacks (outside conversation)
    app.add_handler(CallbackQueryHandler(cb_approve, pattern=r"^approve:\d+$"))
    app.add_handler(CallbackQueryHandler(cb_reject, pattern=r"^reject:\d+$"))
