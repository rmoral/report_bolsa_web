"""
Fetches top global news from multiple sources:
  - Brave Search News API (economic, political, market headlines)
  - NewsAPI (economic, political, market headlines)
  - RSS feeds (Reuters, FT, Bloomberg, AP, Yahoo Finance)
"""
import asyncio
import logging
import ssl
from datetime import datetime, timedelta, timezone
from typing import List
from urllib.parse import urlparse

import aiohttp
import certifi
import feedparser

from social_automation.config import config
from social_automation.database.models import NewsItem

logger = logging.getLogger(__name__)

# SSL context using certifi — fixes macOS certificate verification errors
_ssl_context = ssl.create_default_context(cafile=certifi.where())

# High-quality RSS feeds by category
RSS_FEEDS = {
    "economic": [
        "https://feeds.reuters.com/reuters/businessNews",
        "https://feeds.bloomberg.com/markets/news.rss",
        "https://feeds.ft.com/rss/home/us",
        "https://finance.yahoo.com/news/rssindex",
        "https://www.investing.com/rss/news_25.rss",
    ],
    "political": [
        "https://feeds.reuters.com/Reuters/worldNews",
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
        "https://feeds.a.dj.com/rss/RSSWorldNews.xml",
    ],
    "market": [
        "https://feeds.reuters.com/reuters/businessNews",
        "https://feeds.marketwatch.com/marketwatch/topstories/",
        "https://finance.yahoo.com/news/rssindex",
        "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml",
        "https://feeds.cnbc.com/financial-news",
    ],
}

# NewsAPI query config
NEWSAPI_QUERIES = [
    ("economy stocks market finance inflation GDP", "economic"),
    ("politics government president election policy", "political"),
    ("stock market S&P nasdaq dow wall street trading", "market"),
]

# Brave Search News queries
BRAVE_QUERIES = [
    ("global economy inflation interest rates GDP", "economic"),
    ("world politics government elections geopolitics", "political"),
    ("stock market nasdaq dow jones S&P 500 trading", "market"),
]

BRAVE_NEWS_URL = "https://api.search.brave.com/res/v1/news/search"


async def _fetch_rss(
    session: aiohttp.ClientSession, url: str, category: str, run_id: str
) -> List[NewsItem]:
    """Fetch and parse a single RSS feed."""
    items: List[NewsItem] = []
    try:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
            text = await resp.text()
        feed = feedparser.parse(text)
        source = urlparse(url).netloc.replace("www.", "").replace("feeds.", "")
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        for entry in feed.entries[:10]:
            pub_date = None
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                import calendar
                pub_date = datetime.fromtimestamp(
                    calendar.timegm(entry.published_parsed), tz=timezone.utc
                )
                if pub_date < cutoff:
                    continue
            items.append(
                NewsItem(
                    title=entry.get("title", "")[:500],
                    description=(entry.get("summary") or entry.get("description") or "")[:2000],
                    url=entry.get("link", "")[:1000],
                    source=source,
                    category=category,
                    published_at=pub_date,
                    run_id=run_id,
                )
            )
    except Exception as exc:
        logger.warning("RSS fetch failed for %s: %s", url, exc)
    return items


async def _fetch_brave(run_id: str) -> List[NewsItem]:
    """Fetch news from Brave Search News API."""
    if not config.brave_api_key:
        return []
    items: List[NewsItem] = []
    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": config.brave_api_key,
    }
    connector = aiohttp.TCPConnector(ssl=_ssl_context)
    async with aiohttp.ClientSession(headers=headers, connector=connector) as session:
        for query, category in BRAVE_QUERIES:
            try:
                params = {"q": query, "count": 10, "freshness": "pd"}
                async with session.get(
                    BRAVE_NEWS_URL, params=params, timeout=aiohttp.ClientTimeout(total=20)
                ) as resp:
                    data = await resp.json()
                for article in data.get("results", []):
                    pub_date = None
                    age_str = article.get("page_fetched") or article.get("age")
                    if age_str:
                        try:
                            pub_date = datetime.fromisoformat(age_str.replace("Z", "+00:00"))
                        except (ValueError, AttributeError):
                            pass
                    source_name = (
                        article.get("meta_url", {}).get("hostname")
                        or article.get("source", "")
                    )
                    items.append(
                        NewsItem(
                            title=(article.get("title") or "")[:500],
                            description=(article.get("description") or "")[:2000],
                            url=(article.get("url") or "")[:1000],
                            source=source_name[:200],
                            category=category,
                            published_at=pub_date,
                            run_id=run_id,
                        )
                    )
            except Exception as exc:
                logger.warning("Brave Search query failed (%s): %s", query[:30], exc)
    logger.info("Brave Search fetched %d items", len(items))
    return items


async def _fetch_newsapi(run_id: str) -> List[NewsItem]:
    """Fetch top headlines from NewsAPI."""
    if not config.newsapi_enabled:
        return []
    items: List[NewsItem] = []
    from_date = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%S")
    base_url = "https://newsapi.org/v2/everything"
    params_base = {
        "apiKey": config.newsapi_key,
        "language": "en",
        "sortBy": "popularity",
        "pageSize": 10,
        "from": from_date,
    }
    connector = aiohttp.TCPConnector(ssl=_ssl_context)
    async with aiohttp.ClientSession(connector=connector) as session:
        for query, category in NEWSAPI_QUERIES:
            try:
                params = {**params_base, "q": query}
                async with session.get(
                    base_url, params=params, timeout=aiohttp.ClientTimeout(total=20)
                ) as resp:
                    data = await resp.json()
                for article in data.get("articles", []):
                    pub_str = article.get("publishedAt")
                    pub_date = None
                    if pub_str:
                        try:
                            pub_date = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
                        except ValueError:
                            pass
                    items.append(
                        NewsItem(
                            title=(article.get("title") or "")[:500],
                            description=(
                                article.get("description") or article.get("content") or ""
                            )[:2000],
                            url=(article.get("url") or "")[:1000],
                            source=(article.get("source", {}).get("name") or "")[:200],
                            category=category,
                            published_at=pub_date,
                            run_id=run_id,
                        )
                    )
            except Exception as exc:
                logger.warning("NewsAPI query failed (%s): %s", query[:30], exc)
    return items


async def fetch_all_news(run_id: str) -> List[NewsItem]:
    """
    Fetch news from all configured sources concurrently.
    Returns deduplicated list of NewsItem objects (not yet saved to DB).
    """
    logger.info("Fetching news for run_id=%s", run_id)
    all_items: List[NewsItem] = []

    # RSS feeds — all in parallel
    rss_tasks = []
    connector = aiohttp.TCPConnector(limit=20, ssl=_ssl_context)
    async with aiohttp.ClientSession(connector=connector) as session:
        for category, urls in RSS_FEEDS.items():
            for url in urls:
                rss_tasks.append(_fetch_rss(session, url, category, run_id))
        results = await asyncio.gather(*rss_tasks, return_exceptions=True)
    for result in results:
        if isinstance(result, list):
            all_items.extend(result)

    # Brave Search and NewsAPI — in parallel
    brave_items, newsapi_items = await asyncio.gather(
        _fetch_brave(run_id),
        _fetch_newsapi(run_id),
    )
    all_items.extend(brave_items)
    all_items.extend(newsapi_items)

    # Deduplicate by title similarity (simple: exact title match)
    seen_titles: set = set()
    unique_items: List[NewsItem] = []
    for item in all_items:
        title_key = item.title.lower().strip()[:100]
        if title_key and title_key not in seen_titles:
            seen_titles.add(title_key)
            unique_items.append(item)

    logger.info("Fetched %d unique news items", len(unique_items))
    return unique_items
