"""
Fetches market data for a list of ticker symbols using yfinance.
Returns price, market capitalisation, company name, and sector.
"""
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class TickerInfo:
    symbol: str
    name: str
    price: Optional[float]
    market_cap: Optional[float]   # in USD
    sector: str
    currency: str


def format_market_cap(t: TickerInfo) -> str:
    """Format market cap as '$2.5T', '$850B', '$12M', or '' if unknown."""
    if not t.market_cap:
        return ""
    if t.market_cap >= 1e12:
        return f"${t.market_cap / 1e12:.2f}T"
    if t.market_cap >= 1e9:
        return f"${t.market_cap / 1e9:.1f}B"
    if t.market_cap >= 1e6:
        return f"${t.market_cap / 1e6:.0f}M"
    return f"${t.market_cap:,.0f}"


def fetch_ticker(symbol: str) -> TickerInfo:
    """Fetch market data for a single ticker. Never raises — returns partial data on error."""
    symbol = symbol.upper().strip().lstrip("$")
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)

        try:
            info = ticker.info
            name = info.get("shortName") or info.get("longName") or symbol
            sector = info.get("sector", "")
            currency = info.get("currency", "USD")
            market_cap = info.get("marketCap")
            price = info.get("regularMarketPrice") or info.get("currentPrice")
        except Exception:
            name = symbol
            sector = ""
            currency = "USD"
            market_cap = None
            price = None

        return TickerInfo(
            symbol=symbol,
            name=name,
            price=round(price, 2) if price else None,
            market_cap=market_cap,
            sector=sector,
            currency=currency,
        )

    except Exception as exc:
        logger.warning("yfinance fetch failed for %s: %s", symbol, exc)
        return TickerInfo(
            symbol=symbol, name=symbol, price=None,
            market_cap=None, sector="", currency="USD",
        )


def fetch_tickers(symbols: list[str]) -> list[TickerInfo]:
    """Fetch market data for multiple tickers. Returns list in same order."""
    return [fetch_ticker(s) for s in symbols]
