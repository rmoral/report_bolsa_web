"""
Generates a professional Twitter/X watchlist post for a given session.

The tweet announces that the selected tickers will be followed during
today's trading session. Posted pre-market, so market cap is used
instead of % change (which is unavailable before the open).

Character limit: ≤240 chars body + 2-3 hashtags.
"""
import logging
from datetime import date

from openai import OpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from social_automation.config import config
from social_automation.watchlist.fetcher import TickerInfo, format_market_cap

logger = logging.getLogger(__name__)

_client = OpenAI(api_key=config.openai_api_key)

SYSTEM_PROMPT = """You are a professional market analyst and financial writer for \
earlymarketreports.com, posting daily pre-market watchlists on X (Twitter) for \
institutional and retail investors.

Your writing rules:
- Write in English.
- Sound like a Bloomberg or Reuters markets desk professional.
- No emojis, no exclamation marks, no hype language.
- IMPORTANT: Do NOT use the $SYMBOL cashtag format (e.g. $NVDA). The API restricts \
cashtags. Instead, mention tickers as plain uppercase text (e.g. NVDA, AAPL) or \
inside parentheses after the company name (e.g. "NVIDIA (NVDA)").
- Reference each company by name at least once.
- Include the phrase "today's session" naturally.
- Stay under 240 characters for the body text (excluding hashtags).
- For hashtags, you MAY use #SYMBOL format (e.g. #NVDA) — that is fine.
- Never fabricate data beyond what is provided.
"""


def _build_prompt(tickers: list[TickerInfo]) -> str:
    today = date.today().strftime("%B %d, %Y")

    lines = [f"Date: {today}", "Tickers to feature:"]
    for t in tickers:
        mcap = format_market_cap(t)
        mcap_str = f" | Market cap: {mcap}" if mcap else ""
        sector_str = f" ({t.sector})" if t.sector else ""
        lines.append(f"  {t.symbol} — {t.name}{sector_str}{mcap_str}")

    return "\n".join(lines) + """

Write a single pre-market X post announcing these stocks as the watchlist \
for today's trading session. Mention all tickers as plain text (SYMBOL or \
"Company Name (SYMBOL)"). Do NOT use $SYMBOL cashtag format in the body. \
Include a short sentence of context. Body text ≤240 characters.

Return ONLY:
TEXT: <tweet body, max 240 chars, tickers as plain text — no $SYMBOL>
HASHTAGS: <2-4 hashtags, may use #SYMBOL format>"""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def generate_watchlist_tweet(tickers: list[TickerInfo]) -> tuple[str, str]:
    """
    Generate a pre-market watchlist tweet for the given tickers.
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

    # Twitter Free tier allows only one cashtag ($SYMBOL) per tweet.
    # Strip any $SYMBOL the model may have included despite instructions.
    import re
    content = re.sub(r'\$([A-Z]{1,5})\b', r'\1', content)

    if len(content) > 240:
        content = content[:237] + "…"

    logger.info(
        "Generated watchlist tweet (%d chars) for %s",
        len(content), [t.symbol for t in tickers],
    )
    return content, hashtags
