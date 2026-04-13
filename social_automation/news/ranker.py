"""
Ranks news items by impact.

Scoring = keyword_score × source_weight + freshness_score + category_bonus
Items below MIN_IMPACT_SCORE are discarded before returning top_n.

Focus: US stock market, economic indicators, geopolitics with market impact.
"""
import re
from typing import List

from social_automation.database.models import NewsItem

# ── Source authority weights ──────────────────────────────────────────────────
SOURCE_WEIGHTS = {
    "reuters": 1.5,
    "bloomberg": 1.5,
    "ft.com": 1.4,
    "financialtimes": 1.4,
    "wsj": 1.4,
    "wallstreetjournal": 1.4,
    "nytimes": 1.3,
    "bbc": 1.2,
    "apnews": 1.2,
    "cnbc": 1.3,
    "marketwatch": 1.2,
    "barrons": 1.3,
    "seeking alpha": 1.1,
    "yahoo": 1.0,
    "investing": 1.0,
}

# ── Impact keywords and scores ────────────────────────────────────────────────
# US stock market — highest weight
IMPACT_KEYWORDS: dict[str, float] = {
    # US market events
    "s&p 500": 2.0, "nasdaq": 1.8, "dow jones": 1.8, "dow": 1.5,
    "wall street": 1.5, "stock market": 1.5,
    "earnings": 1.8, "earnings beat": 2.0, "earnings miss": 2.5,
    "guidance": 1.5, "revenue": 1.3, "profit warning": 2.5,
    "ipo": 1.5, "merger": 1.8, "acquisition": 1.5, "buyback": 1.3,
    "short squeeze": 2.0, "options expiry": 1.3,
    # Market moves
    "crash": 3.0, "collapse": 3.0, "correction": 2.0, "bear market": 2.5,
    "bull market": 1.5, "rally": 1.5, "surge": 1.5, "plunge": 2.5,
    "sell-off": 2.0, "selloff": 2.0, "record high": 2.0, "record low": 2.0,
    "bubble": 2.0, "volatility": 1.5, "vix": 1.8,
    "bankruptcy": 2.5, "default": 2.5, "bailout": 2.5,
    # Federal Reserve / monetary policy — very high impact
    "federal reserve": 2.5, "fed": 2.0, "fomc": 2.5,
    "interest rate": 2.5, "rate cut": 2.5, "rate hike": 2.5,
    "quantitative": 2.0, "balance sheet": 1.5, "jerome powell": 2.0,
    # Economic indicators
    "inflation": 2.5, "cpi": 2.5, "pce": 2.0, "core inflation": 2.5,
    "gdp": 2.0, "recession": 2.5, "unemployment": 2.0, "jobs report": 2.5,
    "nonfarm payrolls": 2.5, "retail sales": 1.8, "pmi": 1.8,
    "consumer confidence": 1.5, "housing": 1.3,
    # Big US companies
    "nvidia": 2.0, "apple": 1.8, "microsoft": 1.8, "amazon": 1.8,
    "tesla": 1.8, "meta": 1.8, "alphabet": 1.8, "google": 1.5,
    "berkshire": 1.5, "jpmorgan": 1.8, "goldman sachs": 1.8,
    "bank of america": 1.5, "wells fargo": 1.5,
    # Geopolitics with direct market impact
    "tariff": 2.5, "trade war": 2.5, "trade deal": 2.0,
    "sanction": 2.5, "embargo": 2.0, "export ban": 2.0,
    "war": 2.5, "invasion": 2.5, "ceasefire": 2.0, "conflict": 1.8,
    "nuclear": 2.5, "china": 1.5, "russia": 1.5, "ukraine": 1.5,
    "taiwan": 2.0, "opec": 2.0, "oil": 2.0, "energy crisis": 2.5,
    # Commodities and crypto
    "gold": 1.5, "silver": 1.3, "oil price": 2.0, "crude": 1.8,
    "bitcoin": 1.8, "crypto": 1.5, "ethereum": 1.5,
}

# Minimum total score to be included in results
MIN_IMPACT_SCORE = 2.0


def _source_weight(source: str) -> float:
    source_lower = (source or "").lower()
    for key, weight in SOURCE_WEIGHTS.items():
        if key in source_lower:
            return weight
    return 0.9


def _keyword_score(text: str) -> float:
    text_lower = text.lower()
    score = 0.0
    for keyword, value in IMPACT_KEYWORDS.items():
        if keyword in text_lower:
            score += value
    return score


def _freshness_score(item: NewsItem) -> float:
    if not item.published_at:
        return 0.5
    from datetime import datetime, timezone
    age_hours = (datetime.now(timezone.utc) - item.published_at).total_seconds() / 3600
    if age_hours < 2:
        return 1.0
    if age_hours < 6:
        return 0.8
    if age_hours < 12:
        return 0.6
    return 0.4


def _category_bonus(item: NewsItem) -> float:
    """Extra weight for the highest-value categories."""
    bonuses = {"market": 0.5, "economic": 0.3, "geopolitical": 0.3}
    return bonuses.get(item.category or "", 0.0)


def rank_news(items: List[NewsItem], top_n: int = 10) -> List[NewsItem]:
    """
    Score, filter (MIN_IMPACT_SCORE), and rank news items by impact.
    Mutates items in place (sets impact_score). Returns top_n items.
    """
    for item in items:
        combined_text = f"{item.title} {item.description or ''}"
        keyword = _keyword_score(combined_text)
        source = _source_weight(item.source or "")
        freshness = _freshness_score(item)
        bonus = _category_bonus(item)
        item.impact_score = round(keyword * source + freshness + bonus, 3)

    # Filter out low-impact items before ranking
    relevant = [item for item in items if item.impact_score >= MIN_IMPACT_SCORE]

    if not relevant:
        # Fallback: if nothing passes the threshold, take best available
        logger.info("No items above MIN_IMPACT_SCORE=%.1f, using top %d unfiltered", MIN_IMPACT_SCORE, top_n)
        relevant = items

    ranked = sorted(relevant, key=lambda x: x.impact_score, reverse=True)
    logger.info(
        "Ranked %d items (from %d total, %d passed threshold %.1f)",
        min(top_n, len(ranked)), len(items), len(relevant), MIN_IMPACT_SCORE,
    )
    return ranked[:top_n]


import logging
logger = logging.getLogger(__name__)
