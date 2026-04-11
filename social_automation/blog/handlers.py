"""
Telegram handlers for blog post generation and publishing.

Flow:
  /blog               → lists recent published Twitter posts with numbers
  User sends "1 3"    → generates blog post preview from those posts
  Approve button      → publishes to Payload CMS
  Regenerate button   → re-generates from the same posts
"""
import asyncio
import html
import logging
import textwrap
from typing import Optional

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import (
    CallbackQueryHandler, CommandHandler, ContextTypes,
    ConversationHandler, MessageHandler, filters,
)

from social_automation.config import config
from social_automation.database import db
from social_automation.database.models import Post

logger = logging.getLogger(__name__)


def _admin_only(func):
    """Guard: only the configured admin chat may use these handlers."""
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat_id = update.effective_chat.id if update.effective_chat else None
        if chat_id != config.telegram_admin_chat_id:
            return
        return await func(update, context)
    wrapper.__name__ = func.__name__
    return wrapper

# ConversationHandler states
BLOG_WAITING_SELECTION = 0
BLOG_WAITING_TITLE_EDIT = 1

# In-memory store keyed by chat_id
# {chat_id: {"posts": [...Post], "blog": BlogPost, "image_path": str|None}}
_blog_sessions: dict[int, dict] = {}


def _e(text) -> str:
    return html.escape(str(text))


def _blog_approval_keyboard(session_key: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton("Publicar en blog", callback_data=f"blog_publish:{session_key}"),
            InlineKeyboardButton("Regenerar", callback_data=f"blog_regen:{session_key}"),
        ],
        [
            InlineKeyboardButton("Cancelar", callback_data=f"blog_cancel:{session_key}"),
        ],
    ])


def _format_blog_preview(blog) -> str:
    """Format a BlogPost for Telegram preview (HTML)."""
    title = _e(blog.title)
    keyword = _e(blog.focus_keyword)
    slug = _e(blog.slug)
    meta = _e(blog.meta_description)
    # Show first ~600 chars of content
    content_preview = _e(textwrap.shorten(blog.content_markdown, width=600, placeholder="…"))
    return (
        f"<b>Blog post generado</b>\n\n"
        f"<b>Titulo:</b> {title}\n"
        f"<b>Slug:</b> <code>{slug}</code>\n"
        f"<b>Keyword:</b> {keyword}\n"
        f"<b>Meta:</b> {meta}\n\n"
        f"<b>Contenido (preview):</b>\n{content_preview}"
    )


@_admin_only
async def cmd_blog(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    /blog — start the blog generation flow.
    Shows the last 15 published Twitter posts and asks the user to pick 2-3.
    """
    chat_id = update.effective_chat.id
    posts = await db.get_published_twitter_posts(limit=15)
    if not posts:
        await update.message.reply_text(
            "No hay tweets publicados todavía. Publica primero en X y luego usa /blog.",
            parse_mode=ParseMode.HTML,
        )
        return ConversationHandler.END

    # Store list in session
    _blog_sessions[chat_id] = {"tweet_list": posts, "blog": None, "image_path": None}

    lines = ["<b>Tweets publicados disponibles</b>\n\nSelecciona 2-3 enviando sus números (ej: <code>1 3 5</code>):\n"]
    for i, post in enumerate(posts, 1):
        ts = post.published_at.strftime("%d/%m %H:%M") if post.published_at else "?"
        news = _e(textwrap.shorten(
            post.news_item.title if post.news_item else post.content,
            width=70, placeholder="…"
        ))
        lines.append(f"{i}. [{ts}] {news}")

    await update.message.reply_text("\n".join(lines), parse_mode=ParseMode.HTML)
    return BLOG_WAITING_SELECTION


async def blog_receive_selection(
    update: Update, context: ContextTypes.DEFAULT_TYPE
) -> int:
    """Parse the user's number selection and trigger blog generation."""
    chat_id = update.effective_chat.id
    session = _blog_sessions.get(chat_id)
    if not session:
        await update.message.reply_text("Sesión expirada. Usa /blog de nuevo.")
        return ConversationHandler.END

    text = update.message.text.strip()
    try:
        indices = [int(x) - 1 for x in text.split()]
    except ValueError:
        await update.message.reply_text(
            "Formato incorrecto. Envía los números separados por espacios, ej: <code>1 3</code>",
            parse_mode=ParseMode.HTML,
        )
        return BLOG_WAITING_SELECTION

    tweet_list: list[Post] = session["tweet_list"]
    selected: list[Post] = []
    for idx in indices:
        if 0 <= idx < len(tweet_list):
            selected.append(tweet_list[idx])

    if len(selected) < 2:
        await update.message.reply_text(
            "Selecciona al menos 2 tweets. Intenta de nuevo (ej: <code>1 2 3</code>):",
            parse_mode=ParseMode.HTML,
        )
        return BLOG_WAITING_SELECTION

    if len(selected) > 5:
        selected = selected[:5]

    session["selected_posts"] = selected
    msg = await update.message.reply_text(
        f"Generando artículo a partir de {len(selected)} tweet(s)...",
    )

    # Generate in background so we can show progress
    asyncio.create_task(
        _generate_and_preview(chat_id, selected, context.bot, msg.message_id)
    )
    return ConversationHandler.END


async def _generate_and_preview(
    chat_id: int,
    posts: list[Post],
    bot,
    progress_msg_id: int,
) -> None:
    """Generate blog post then send preview to the user."""
    from social_automation.blog.generator import generate_blog_post

    session = _blog_sessions.get(chat_id, {})
    session_key = str(chat_id)

    try:
        # Run blocking GPT call in executor
        loop = asyncio.get_event_loop()
        blog = await loop.run_in_executor(None, generate_blog_post, posts)
        session["blog"] = blog
        session["selected_posts"] = posts

        # Try to generate a featured image
        image_path: Optional[str] = None
        if blog.image_prompt:
            try:
                from social_automation.content.image_generator import generate_image_from_prompt
                image_path = await generate_image_from_prompt(
                    blog.image_prompt, f"blog_{chat_id}"
                )
            except Exception as img_exc:
                logger.warning("Blog image generation failed: %s", img_exc)
        session["image_path"] = image_path

        preview_text = _format_blog_preview(blog)
        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text=preview_text,
            parse_mode=ParseMode.HTML,
            reply_markup=_blog_approval_keyboard(session_key),
        )

    except Exception as exc:
        logger.error("Blog generation failed: %s", exc)
        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text=f"Error generando el artículo: {html.escape(str(exc))}",
            parse_mode=ParseMode.HTML,
        )


async def cb_blog_publish(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Publish the generated blog post to Payload CMS."""
    query = update.callback_query
    await query.answer()
    chat_id = update.effective_chat.id
    session = _blog_sessions.get(chat_id)

    if not session or not session.get("blog"):
        await query.edit_message_text("Sesión expirada. Usa /blog para empezar de nuevo.")
        return

    blog = session["blog"]
    image_path = session.get("image_path")

    await query.edit_message_text(
        f"Publicando <b>{html.escape(blog.title)}</b> en el blog...",
        parse_mode=ParseMode.HTML,
    )

    try:
        from social_automation.blog.publisher import publish_blog_post
        slug = await publish_blog_post(blog, image_path)
        _blog_sessions.pop(chat_id, None)

        from social_automation.config import config as _cfg
        article_url = f"{_cfg.website_url.rstrip('/')}/{_cfg.blog_url_prefix.strip('/')}/{slug}"

        await context.bot.send_message(
            chat_id=chat_id,
            text=(
                f"Articulo publicado en el blog.\n\n"
                f"<b>Titulo:</b> {html.escape(blog.title)}\n"
                f"<b>URL:</b> {html.escape(article_url)}"
            ),
            parse_mode=ParseMode.HTML,
        )

        # Auto-announce on Twitter if enabled
        if _cfg.twitter_enabled:
            asyncio.create_task(
                _announce_on_twitter(blog, slug, image_path, chat_id, context.bot)
            )

    except Exception as exc:
        logger.error("Blog publish failed: %s", exc)
        await context.bot.send_message(
            chat_id=chat_id,
            text=f"Error publicando el articulo: {html.escape(str(exc))}",
            parse_mode=ParseMode.HTML,
        )


async def _announce_on_twitter(
    blog, slug: str, image_path: Optional[str], chat_id: int, bot
) -> None:
    """Post a blog announcement tweet and notify the admin in Telegram."""
    try:
        from social_automation.blog.announcer import announce_blog_post
        loop = asyncio.get_event_loop()
        tweet_id = await loop.run_in_executor(
            None, announce_blog_post, blog, slug, image_path
        )
        await bot.send_message(
            chat_id=chat_id,
            text=(
                f"Tweet de anuncio publicado.\n"
                f"ID: <code>{html.escape(tweet_id)}</code>"
            ),
            parse_mode=ParseMode.HTML,
        )
    except Exception as exc:
        logger.error("Blog Twitter announcement failed: %s", exc)
        await bot.send_message(
            chat_id=chat_id,
            text=f"No se pudo publicar el tweet de anuncio: {html.escape(str(exc))}",
            parse_mode=ParseMode.HTML,
        )


async def cb_blog_regen(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Regenerate the blog post from the same selected posts."""
    query = update.callback_query
    await query.answer()
    chat_id = update.effective_chat.id
    session = _blog_sessions.get(chat_id)

    if not session or not session.get("selected_posts"):
        await query.edit_message_text("Sesion expirada. Usa /blog para empezar de nuevo.")
        return

    posts = session["selected_posts"]
    await query.edit_message_text(
        f"Regenerando articulo a partir de {len(posts)} tweet(s)...",
    )
    asyncio.create_task(
        _generate_and_preview(chat_id, posts, context.bot, query.message.message_id)
    )


async def cb_blog_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Cancel blog generation."""
    query = update.callback_query
    await query.answer()
    chat_id = update.effective_chat.id
    _blog_sessions.pop(chat_id, None)
    await query.edit_message_text("Generacion de blog post cancelada.")


async def blog_cmd_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """Handle /cancel during blog conversation."""
    chat_id = update.effective_chat.id
    _blog_sessions.pop(chat_id, None)
    await update.message.reply_text("Operacion cancelada.")
    return ConversationHandler.END


def register_blog_handlers(app) -> None:
    """Register all blog-related handlers on the Telegram Application."""
    blog_conv = ConversationHandler(
        entry_points=[CommandHandler("blog", cmd_blog)],
        states={
            BLOG_WAITING_SELECTION: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, blog_receive_selection),
            ],
        },
        fallbacks=[CommandHandler("cancel", blog_cmd_cancel)],
        per_message=False,
    )
    app.add_handler(blog_conv)

    # Callback handlers (outside conversation — triggered after ConversationHandler ends)
    app.add_handler(CallbackQueryHandler(cb_blog_publish, pattern=r"^blog_publish:"))
    app.add_handler(CallbackQueryHandler(cb_blog_regen, pattern=r"^blog_regen:"))
    app.add_handler(CallbackQueryHandler(cb_blog_cancel, pattern=r"^blog_cancel:"))
