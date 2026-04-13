"""
Fetches real-time market data for a list of ticker symbols using yfinance.
Returns price, % change from previous close, company name, and sector.
"""
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class TickerInfo:
    symbol: str
    name: str               # Company display name
    price: Optional[float]
    prev_close: Optional[float]
    change_pct: Optional[float]   # % change from previous close
    sector: str
    currency: str


def fetch_ticker(symbol: str) -> TickerInfo:
    """Fetch market data for a single ticker. Never raises — returns partial data on error."""
    symbol = symbol.upper().strip().lstrip("$")
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info

        price = getattr(info, "last_price", None) or getattr(info, "regularMarketPrice", None)
        prev_close = getattr(info, "previous_close", None) or getattr(info, "regularMarketPreviousClose", None)
        change_pct = None
        if price and prev_close and prev_close > 0:
            change_pct = round((price - prev_close) / prev_close * 100, 2)

        # Full info for name and sector (slower, use with try/except)
        try:
            full = ticker.info
            name = (
                full.get("shortName")
                or full.get("longName")
                or symbol
            )
            sector = full.get("sector", "")
            currency = full.get("currency", "USD")
        except Exception:
            name = symbol
            sector = ""
            currency = "USD"

        return TickerInfo(
            symbol=symbol,
            name=name,
            price=round(price, 2) if price else None,
            prev_close=round(prev_close, 2) if prev_close else None,
            change_pct=change_pct,
            sector=sector,
            currency=currency,
        )

    except Exception as exc:
        logger.warning("yfinance fetch failed for %s: %s", symbol, exc)
        return TickerInfo(
            symbol=symbol, name=symbol, price=None, prev_close=None,
            change_pct=None, sector="", currency="USD",
        )


def fetch_tickers(symbols: list[str]) -> list[TickerInfo]:
    """Fetch market data for multiple tickers. Returns list in same order."""
    return [fetch_ticker(s) for s in symbols]


def format_change(t: TickerInfo) -> str:
    """Format % change as '+1.5%' or '-0.8%' or '' if unknown."""
    if t.change_pct is None:
        return ""
    sign = "+" if t.change_pct >= 0 else ""
    return f"{sign}{t.change_pct:.1f}%"
