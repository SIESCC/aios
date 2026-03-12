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
AI Tools Scraper
Scrapes public AI tool directories/feeds for new tools
"""
import os
import logging
import feedparser  # pyre-ignore[21]
import psycopg2    # pyre-ignore[21]
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
        import requests # pyre-ignore[21]
        logger.info("▶ Starting tools scraper via RSS & APIs...")
        conn = self.get_db_connection()
        conn.autocommit = False
        saved = 0
        total_found = 0

        # Feed sources
        feeds = [
            "https://hnrss.org/show?q=AI",
            "https://www.producthunt.com/feed"
        ]

        try:
            # 1. Scrape RSS feeds (HN and PH)
            for feed_url in feeds:
                feed = feedparser.parse(feed_url)
                for entry in feed.get("entries", []):
                    title = str(entry.get("title", ""))
                    link = str(entry.get("link", ""))
                    description = str(entry.get("description", ""))
                    
                    if "Show HN: " in title:
                        title = title.replace("Show HN: ", "")
                    # Filter for AI
                    if "ai" not in title.lower() and "ai" not in description.lower() and "gpt" not in description.lower():
                        continue
                        
                    slug = re.sub(r'[^a-zA-Z0-9]', '-', title).strip('-').lower()[:50] # pyre-ignore[16]
                    category = "Productivity"
                    if "video" in title.lower() or "video" in description.lower():
                        category = "Video"
                    elif "audio" in title.lower() or "speech" in description.lower():
                        category = "Audio"
                    elif "code" in title.lower() or "dev" in description.lower():
                        category = "Code Assistants"
                    else:
                        category = "Productivity"

                    pricing = "Freemium"
                    score = 60.0
                    
                    with conn.cursor() as cur:
                        cur.execute("""
                            INSERT INTO ai_tools (
                                id, slug, name, tagline, description, website, category, 
                                pricing, status, "trendingScore", tags, "updatedAt"
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'APPROVED', %s, %s, NOW())
                            ON CONFLICT (slug) DO UPDATE SET
                                "trendingScore" = EXCLUDED."trendingScore",
                                "updatedAt" = NOW()
                        """, (
                            uuid.uuid4().hex, slug, title[:100],
                            title[:200], description[:1000] if description else "AI Tool",
                            link[:255] if link else "https://news.ycombinator.com",
                            category, pricing, score, ['ai', 'tool']
                        ))
                        
                        # Also push to the discovery queue
                        cur.execute("""
                            INSERT INTO discovery_queue (
                                id, source, "toolName", "toolUrl", description, category, score, processed, "discoveredAt", "updatedAt"
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, false, NOW(), NOW())
                            ON CONFLICT ("toolUrl") DO NOTHING
                        """, (
                            uuid.uuid4().hex, "RSS", title[:100], 
                            link[:255] if link else "https://news.ycombinator.com", 
                            description[:500], category, score
                        ))
                        
                    saved += 1
                    total_found += 1

            # 2. Scrape GitHub API
            gh_url = "https://api.github.com/search/repositories?q=topic:ai-tool&sort=stars&order=desc&per_page=15"
            try:
                headers = {"User-Agent": "AIOS-Scraper"}
                if os.getenv("GITHUB_TOKEN"):
                    headers["Authorization"] = f"token {os.getenv('GITHUB_TOKEN')}"
                resp = requests.get(gh_url, headers=headers)
                if resp.status_code == 200:
                    repos = resp.json().get("items", [])
                    for repo in repos:
                        title = str(repo.get("name", ""))
                        desc = str(repo.get("description", "") or "")
                        stars = int(repo.get("stargazers_count", 0))
                        link = str(repo.get("html_url", ""))
                        
                        slug = f"gh-{title.lower()}"[:50] # pyre-ignore[16]
                        score = min(99.0, 50.0 + (float(stars) / 1000.0))
                        
                        with conn.cursor() as cur:
                            cur.execute("""
                                INSERT INTO ai_tools (
                                    id, slug, name, tagline, description, website, category, 
                                    pricing, status, "trendingScore", tags, "updatedAt"
                                ) VALUES (%s, %s, %s, %s, %s, %s, %s, 'APPROVED', %s, %s, NOW())
                                ON CONFLICT (slug) DO UPDATE SET
                                    "trendingScore" = EXCLUDED."trendingScore",
                                    "updatedAt" = NOW()
                            """, (
                                uuid.uuid4().hex, slug, title[:100], # pyre-ignore[16]
                                desc[:200] if desc else title[:200], # pyre-ignore[16]
                                desc[:1000], link[:255], # pyre-ignore[16]
                                "Code Tools", "Free/Open Source", score, ['github', 'open-source', 'ai']
                            ))
                        saved += 1
                        total_found += 1
            except Exception as github_e:
                logger.error(f"GitHub API error in tools scraper: {github_e}")

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
