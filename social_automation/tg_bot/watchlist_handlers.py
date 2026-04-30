"""
Telegram handler for /watchlist command.

Flow:
  /watchlist AAPL MSFT NVDA TSLA META
    → fetches real-time data for each ticker
    → generates watchlist tweet via GPT
    → shows preview with Approve / Reject / Edit buttons

  /watchlist  (no args)
    → asks the user to send 5 tickers
"""
import asyncio
import html
import logging
import uuid
from datetime import datetime, timezone

from telegram import Update
from telegram.constants import ParseMode
from telegram.ext import (
    CommandHandler, ContextTypes, ConversationHandler, MessageHandler, filters,
)

from social_automation.config import config
from social_automation.database import db
from social_automation.database.models import Platform, Post
from social_automation.tg_bot.handlers import _send_post_for_approval

logger = logging.getLogger(__name__)

# ConversationHandler state
WL_WAITING_TICKERS = 0

MAX_TICKERS = 5
MIN_TICKERS = 2


def _admin_guard(func):
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat_id = update.effective_chat.id if update.effective_chat else None
        if chat_id != config.telegram_admin_chat_id:
            return
        return await func(update, context)
    wrapper.__name__ = func.__name__
    return wrapper


def _parse_tickers(text: str) -> list[str]:
    """Extract ticker symbols from a string. Accepts 'AAPL $MSFT aapl' etc."""
    tokens = text.upper().split()
    tickers = []
    for t in tokens:
        clean = t.lstrip("$").strip(",;")
        if 1 <= len(clean) <= 5 and clean.isalpha():
            tickers.append(clean)
    return tickers[:MAX_TICKERS]


@_admin_guard
async def cmd_watchlist(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    """
    /watchlist [TICKER1 TICKER2 ...] — generate a session watchlist tweet.
    If tickers are provided inline, process immediately.
    """
    inline = _parse_tickers(" ".join(context.args)) if context.args else []

    if len(inline) >= MIN_TICKERS:
        msg = await update.message.reply_text(
            f"Obteniendo datos de mercado para: {' '.join('$' + t for t in inline)}…"
        )
        asyncio.create_task(
            _generate_and_send(inline, update.effective_chat.id, context.bot, msg.message_id)
        )
        return ConversationHandler.END

    await update.message.reply_text(
        "Envía los tickers para el watchlist de hoy (mínimo 2, máximo 5).\n"
        "Ejemplo: <code>NVDA AAPL META MSFT TSLA</code>",
        parse_mode=ParseMode.HTML,
    )
    return WL_WAITING_TICKERS


async def wl_receive_tickers(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    tickers = _parse_tickers(update.message.text)

    if len(tickers) < MIN_TICKERS:
        await update.message.reply_text(
            f"Introduce al menos {MIN_TICKERS} tickers válidos. "
            "Ejemplo: <code>NVDA AAPL META MSFT TSLA</code>",
            parse_mode=ParseMode.HTML,
        )
        return WL_WAITING_TICKERS

    msg = await update.message.reply_text(
        f"Obteniendo datos de mercado para: {' '.join('$' + t for t in tickers)}…"
    )
    asyncio.create_task(
        _generate_and_send(tickers, update.effective_chat.id, context.bot, msg.message_id)
    )
    return ConversationHandler.END


async def _generate_and_send(
    tickers: list[str], chat_id: int, bot, progress_msg_id: int
) -> None:
    """Fetch market data, generate tweet, send for approval."""
    from social_automation.watchlist.fetcher import fetch_tickers
    from social_automation.watchlist.generator import generate_watchlist_tweet

    try:
        # Fetch market data (blocking, run in executor)
        loop = asyncio.get_event_loop()
        ticker_data = await loop.run_in_executor(None, fetch_tickers, tickers)

        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text=f"Datos obtenidos. Generando tweet…",
        )

        content, hashtags = await loop.run_in_executor(
            None, generate_watchlist_tweet, ticker_data
        )

        # Show data summary before the tweet
        from social_automation.watchlist.fetcher import format_market_cap
        lines = ["<b>Datos de mercado:</b>"]
        for t in ticker_data:
            price_str = f"${t.price:.2f}" if t.price else "N/A"
            mcap_str = format_market_cap(t)
            mcap_display = f" | Cap: {mcap_str}" if mcap_str else ""
            lines.append(f"  <code>${t.symbol}</code> {html.escape(t.name)} — {price_str}{mcap_display}")

        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text="\n".join(lines),
            parse_mode=ParseMode.HTML,
        )

        # Create and save the post
        run_id = f"wl_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        post = Post(
            news_item_id=None,
            platform=Platform.TWITTER,
            content=content,
            hashtags=hashtags,
            run_id=run_id,
        )
        await db.save_posts([post])
        saved = await db.get_post(post.id)

        if len(config.twitter_accounts) > 1:
            from social_automation.tg_bot.keyboards import account_selection_keyboard
            await bot.send_message(
                chat_id=chat_id,
                text="¿En qué cuenta de X publicar el watchlist?",
                reply_markup=account_selection_keyboard(config.twitter_accounts, saved.id),
            )
        else:
            await _send_post_for_approval(bot, saved, chat_id)

    except Exception as exc:
        logger.error("Watchlist generation failed: %s", exc, exc_info=True)
        await bot.edit_message_text(
            chat_id=chat_id,
            message_id=progress_msg_id,
            text=f"Error generando el watchlist: {html.escape(str(exc))}",
        )


async def wl_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Operación cancelada.")
    return ConversationHandler.END


def register_watchlist_handlers(app) -> None:
    wl_conv = ConversationHandler(
        entry_points=[CommandHandler("watchlist", cmd_watchlist)],
        states={
            WL_WAITING_TICKERS: [
                MessageHandler(filters.TEXT & ~filters.COMMAND, wl_receive_tickers),
            ],
        },
        fallbacks=[CommandHandler("cancel", wl_cancel)],
        per_message=False,
    )
    app.add_handler(wl_conv)
