"""
Generates a professional Twitter/X watchlist post for a given session.

The tweet announces that the 5 selected tickers will be followed during
today's trading session, with brief market context per company.
Character limit: ≤240 chars body + 2-3 hashtags.
"""
import logging
from datetime import date

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.config import config
from social_automation.watchlist.fetcher import TickerInfo, format_change

logger = logging.getLogger(__name__)

_client = OpenAI(api_key=config.openai_api_key)

SYSTEM_PROMPT = """You are a professional market analyst and financial writer for \
earlymarketreports.com, posting daily pre-market watchlists on X (Twitter) for \
institutional and retail investors.

Your writing rules:
- Write in English.
- Sound like a Bloomberg or Reuters markets desk professional.
- No emojis, no exclamation marks, no hype language.
- Lead with the tickers in $SYMBOL format — they must appear prominently.
- Reference each company by name at least once.
- Include the phrase "today's session" or "today's trading session" naturally.
- Stay under 240 characters for the body text (excluding hashtags).
- End with 2-3 specific, lowercase hashtags on a new line.
- Never fabricate data beyond what is provided.
"""


def _build_prompt(tickers: list[TickerInfo]) -> str:
    today = date.today().strftime("%B %d, %Y")

    lines = [f"Date: {today}", "Tickers to feature:"]
    for t in tickers:
        change_str = f", {format_change(t)}" if t.change_pct is not None else ""
        price_str = f"${t.price:.2f}" if t.price else "N/A"
        sector_str = f" ({t.sector})" if t.sector else ""
        lines.append(f"  ${t.symbol} — {t.name}{sector_str} | {price_str}{change_str}")

    return "\n".join(lines) + """

Write a single X post announcing these 5 stocks as the watchlist for today's trading session.
Mention all 5 tickers in $SYMBOL format. Include a short sentence of market context.
Body text must be ≤240 characters. End with 2-3 hashtags on a new line.

Return ONLY:
TEXT: <tweet body, max 240 chars, all 5 $SYMBOLs included>
HASHTAGS: <2-3 hashtags>"""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def generate_watchlist_tweet(tickers: list[TickerInfo]) -> tuple[str, str]:
    """
    Generate a watchlist tweet for the given tickers.
    Returns (content, hashtags).
    """
    response = _client.chat.completions.create(
        model=config.openai_model,
        max_tokens=300,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_prompt(tickers)},
        ],
    )
    raw = response.choices[0].message.content or ""

    content = ""
    hashtags = ""
    for line in raw.strip().splitlines():
        if line.startswith("TEXT:"):
            content = line[5:].strip()
        elif line.startswith("HASHTAGS:"):
            hashtags = line[9:].strip()

    if not content:
        raise ValueError("GPT returned empty watchlist tweet")

    # Hard truncate if GPT went over (safety net)
    if len(content) > 240:
        content = content[:237] + "…"

    logger.info("Generated watchlist tweet (%d chars) for %s", len(content), [t.symbol for t in tickers])
    return content, hashtags
