# pyre-ignore-all-errors
"""
AI Tools Scraper
Scrapes public AI tool directories/feeds for new tools
"""
import os
import logging
import feedparser
import psycopg2
import uuid
import re
from datetime import datetime

logger = logging.getLogger("tools_scraper")

class ToolsScraper:
    def __init__(self):
        # Support both explicit parameters and connection string
        self.db_host = os.getenv("DB_HOST", "localhost")
        self.db_port = os.getenv("DB_PORT", "5432")
        self.db_name = os.getenv("DB_NAME", "aios_db")
        self.db_user = os.getenv("DB_USER", "aios")
        self.db_pass = os.getenv("DB_PASSWORD", "aios_secret_change_me")
        self.db_url = os.getenv("DATABASE_URL")
        
        # HackerNews Search API for "Show HN AI"
        self.feed_url = "https://hnrss.org/show?q=AI"

    def get_db_connection(self):
        """Stable connection module reading credentials from env variables"""
        if self.db_url:
            return psycopg2.connect(self.db_url)
        return psycopg2.connect(
            host=self.db_host,
            port=self.db_port,
            dbname=self.db_name,
            user=self.db_user,
            password=self.db_pass
        )

    def run(self) -> int:
        logger.info("▶ Starting tools scraper via RSS...")
        conn = self.get_db_connection()
        conn.autocommit = False
        saved = 0

        try:
            feed = feedparser.parse(self.feed_url)
            total_found = len(feed.entries)
            
            for entry in feed.get("entries", []):
                title = str(entry.get("title", ""))
                link = str(entry.get("link", ""))
                description = str(entry.get("description", ""))
                
                # Clean up "Show HN: " prefix
                if title.startswith("Show HN: "):
                    title = title[9:]  # pyre-ignore[16]
                
                # Basic generation of slug, category, pricing
                slug = re.sub(r'[^a-zA-Z0-9]', '-', title).strip('-').lower()
                slug = slug[:50]  # pyre-ignore[16]
                category = "Productivity"
                if "video" in title.lower() or "video" in description.lower():
                    category = "Video"
                elif "audio" in title.lower() or "speech" in description.lower():
                    category = "Audio"
                elif "code" in title.lower() or "dev" in description.lower():
                    category = "Code Assistants"
                elif "writing" in title.lower() or "text" in description.lower():
                    category = "Writing"

                pricing = "Freemium" # Assume freemium as default for Show HN
                
                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO ai_tools (
                            id, slug, name, tagline, description, website, category, 
                            pricing, status, "trendingScore", tags, "updatedAt"
                        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'APPROVED', %s, %s, NOW())
                        ON CONFLICT (slug) DO UPDATE SET
                            "trendingScore" = EXCLUDED."trendingScore",
                            "updatedAt" = NOW()
                    """, (
                        uuid.uuid4().hex,
                        slug,
                        title[:100],  # pyre-ignore[16]
                        title[:200], # pyre-ignore[16] tagline as title initially
                        description[:1000] if description else "AI Tool discovered via HN",  # pyre-ignore[16]
                        link[:255] if link else "https://news.ycombinator.com",  # pyre-ignore[16]
                        category,
                        pricing,
                        55.0, # Baseline score
                        ['ai', 'startup']
                    ))
                saved += 1
                
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO scraping_jobs (id, "jobName", status, "itemsFound", "itemsSaved", "completedAt")
                    VALUES (%s, 'tools-scraper', 'COMPLETED', %s, %s, NOW())
                """, (uuid.uuid4().hex, total_found, saved))
                
            conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"Tools scraper error: {e}")
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO scraping_jobs (id, "jobName", status, error, "completedAt")
                    VALUES (%s, 'tools-scraper', 'FAILED', %s, NOW())
                """, (uuid.uuid4().hex, str(e)))
            conn.commit()
        finally:
            conn.close()

        return saved

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = ToolsScraper()
    scraper.run()
