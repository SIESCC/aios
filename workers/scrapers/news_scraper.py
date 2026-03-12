# pyright: reportCallIssue=false
# pyright: reportOptionalMemberAccess=false
# pyright: reportArgumentType=false
# pyright: reportOperatorIssue=false
# pyright: reportAttributeAccessIssue=false
# pyright: reportGeneralTypeIssues=false
# pyright: reportOptionalSubscript=false
# pyright: reportOptionalOperand=false
# pyright: reportOptionalIterable=false
# pyright: reportArgumentType=false
# pyre-ignore-all-errors
"""
AI News Scraper
Fetches AI industry news from RSS feeds
"""

import os
import logging
import feedparser
import psycopg2
import uuid
from datetime import datetime

logger = logging.getLogger("news_scraper")

NEWS_FEEDS = [
    {"url": "https://techcrunch.com/tag/artificial-intelligence/feed/", "source": "TechCrunch"},
    {"url": "https://venturebeat.com/ai/feed/", "source": "VentureBeat"},
    {"url": "https://the-decoder.com/feed/", "source": "The Decoder"},
    {"url": "https://www.artificialintelligence-news.com/feed/", "source": "AI News"},
]


class NewsScraper:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")

    def fetch_feed(self, feed_config: dict) -> list:
        try:
            feed = feedparser.parse(feed_config["url"])
            articles = []
            for entry in feed.entries[:15]:
                pub_date = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    pub_date = datetime(*entry.published_parsed[:6])

                articles.append({
                    "title": entry.get("title", "")[:500],
                    "url": entry.get("link", ""),
                    "summary": entry.get("summary", "")[:2000],
                    "source": feed_config["source"],
                    "published_at": pub_date,
                })
            return articles
        except Exception as e:
            logger.error(f"Failed to fetch {feed_config['source']}: {e}")
            return []

    def upsert_article(self, conn, article: dict):
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO ai_news (id, title, summary, url, source, "publishedAt")
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (url) DO NOTHING
            """, (
                uuid.uuid4().hex, article["title"], article["summary"],
                article["url"], article["source"], article["published_at"],
            ))

    def run(self) -> int:
        conn = psycopg2.connect(self.db_url)
        conn.autocommit = False
        saved = 0

        try:
            for feed_config in NEWS_FEEDS:
                articles = self.fetch_feed(feed_config)
                logger.info(f"Fetched {len(articles)} articles from {feed_config['source']}")
                for article in articles:
                    if not article["url"]:
                        continue
                    try:
                        self.upsert_article(conn, article)
                        saved += 1
                    except Exception as e:
                        logger.warning(f"Failed to save article: {e}")

            conn.commit()

            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO scraping_jobs (id, "jobName", status, "itemsSaved", "completedAt")
                    VALUES (%s, 'news-scraper', 'COMPLETED', %s, NOW())
                """, (uuid.uuid4().hex, saved,))
            conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"News scraper failed: {e}")
        finally:
            conn.close()

        return saved
