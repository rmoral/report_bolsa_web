"""
Ranks news items by global impact using keyword scoring + source authority.
Returns the top N most impactful items for content generation.
"""
import re
from typing import List

from social_automation.database.models import NewsItem

# Source authority weights (higher = more trusted/impactful)
SOURCE_WEIGHTS = {
    "reuters": 1.5,
    "bloomberg": 1.5,
    "ft.com": 1.4,
    "financialtimes": 1.4,
    "wsj": 1.4,
    "nytimes": 1.3,
    "bbc": 1.3,
    "apnews": 1.2,
    "cnbc": 1.2,
    "marketwatch": 1.1,
    "yahoo": 1.0,
    "investing": 1.0,
}

# High-impact keywords and their scores
IMPACT_KEYWORDS: dict[str, float] = {
    # Market events
    "crash": 3.0, "collapse": 3.0, "crisis": 2.5, "recession": 2.5,
    "bubble": 2.0, "correction": 1.5, "rally": 1.5, "surge": 1.5,
    "plunge": 2.0, "soar": 1.5, "record high": 2.0, "record low": 2.0,
    "bear market": 2.0, "bull market": 1.5,
    # Economic indicators
    "inflation": 2.0, "interest rate": 2.0, "fed": 1.8, "federal reserve": 1.8,
    "ecb": 1.5, "gdp": 1.5, "unemployment": 1.5, "cpi": 1.5, "jobs report": 1.5,
    "earnings": 1.2, "revenue": 1.0, "profit": 1.0,
    # Political impact
    "war": 2.5, "sanction": 2.0, "election": 1.8, "president": 1.5,
    "government": 1.2, "policy": 1.2, "tariff": 1.8, "trade war": 2.0,
    "geopolitical": 1.5, "nuclear": 2.5, "ceasefire": 2.0, "invasion": 2.5,
    # Companies/indices
    "s&p 500": 1.5, "nasdaq": 1.5, "dow jones": 1.5, "nikkei": 1.3,
    "bitcoin": 1.5, "crypto": 1.3, "oil": 1.5, "gold": 1.3,
    "apple": 1.2, "tesla": 1.2, "nvidia": 1.3, "microsoft": 1.2, "amazon": 1.2,
    # Global events
    "pandemic": 2.5, "outbreak": 2.0, "earthquake": 1.8, "disaster": 1.8,
    "breakthrough": 1.5, "merger": 1.5, "acquisition": 1.3, "ipo": 1.3,
    "bankruptcy": 2.0, "default": 2.0, "bailout": 2.0,
}


def _source_weight(source: str) -> float:
    source_lower = (source or "").lower()
    for key, weight in SOURCE_WEIGHTS.items():
        if key in source_lower:
            return weight
    return 0.9  # Unknown source


def _keyword_score(text: str) -> float:
    text_lower = text.lower()
    score = 0.0
    for keyword, value in IMPACT_KEYWORDS.items():
        if keyword in text_lower:
            score += value
    return score


def _freshness_score(item: NewsItem) -> float:
    """More recent news = higher score."""
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


def rank_news(items: List[NewsItem], top_n: int = 10) -> List[NewsItem]:
    """
    Score and rank news items by impact. Mutates items in place (sets impact_score).
    Returns top_n items sorted by score descending.
    """
    for item in items:
        combined_text = f"{item.title} {item.description or ''}"
        score = (
            _keyword_score(combined_text) * _source_weight(item.source or "")
            + _freshness_score(item)
        )
        item.impact_score = round(score, 3)

    ranked = sorted(items, key=lambda x: x.impact_score, reverse=True)
    return ranked[:top_n]
