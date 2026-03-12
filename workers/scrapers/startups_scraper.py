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
import os
import logging
import feedparser  # pyre-ignore[21]
import psycopg2    # pyre-ignore[21]
import uuid
import re
from datetime import datetime

logger = logging.getLogger("startups_scraper")

class StartupsScraper:
    def __init__(self):
        self.db_host = os.getenv("DB_HOST", "localhost")
        self.db_port = os.getenv("DB_PORT", "5432")
        self.db_name = os.getenv("DB_NAME", "aios_db")
        self.db_user = os.getenv("DB_USER", "aios")
        self.db_pass = os.getenv("DB_PASSWORD", "aios_secret_change_me")
        self.db_url = os.getenv("DATABASE_URL")
        
        # Funding news RSS
        self.feeds = [
            "https://techcrunch.com/category/artificial-intelligence/feed/",
            "https://hnrss.org/newest?q=AI+raises",
            "https://hnrss.org/newest?q=startup+AI+funding"
        ]

    def get_db_connection(self):
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
        logger.info("▶ Starting AI startups scraper...")
        conn = self.get_db_connection()
        conn.autocommit = False
        saved = 0

        # Regex patterns to catch things like "OpenAI raises $10B", "Mistral secures $400M"
        money_pattern = re.compile(r'\$([0-9.]+)([MBK])')
        company_pattern = re.compile(r'^([A-Z][\w\s&.\-]+)(?=\s+(raises|secures|bags|gets|closes|announces|lands|banks))', re.IGNORECASE)

        total_found = 0

        try:
            for feed_url in self.feeds:
                feed = feedparser.parse(feed_url)
                
                for entry in feed.get("entries", []):
                    title = entry.get("title", "")
                    link = entry.get("link", "")
                    description = entry.get("summary", "")
                    
                    # Search for funding amounts
                    money_match = money_pattern.search(title)
                    company_match = company_pattern.search(title)
                    
                    if money_match and company_match:
                        total_found += 1
                        
                        company_name = company_match.group(1).strip()
                        amount_str = money_match.group(1)
                        multiplier = money_match.group(2).upper()
                        
                        # Convert to cents for BigInt
                        amount_float = float(amount_str)
                        if multiplier == 'B':
                            cents = int(amount_float * 1000000000 * 100)
                        elif multiplier == 'M':
                            cents = int(amount_float * 1000000 * 100)
                        elif multiplier == 'K':
                            cents = int(amount_float * 1000 * 100)
                        else:
                            cents = 0

                        slug = re.sub(r'[^a-zA-Z0-9]', '-', company_name).strip('-').lower()[:100] # pyre-ignore[16]

                        # Determine possible funding round
                        lower_title = title.lower()
                        round_enum = "UNKNOWN"
                        if "seed" in lower_title:
                            round_enum = "SEED"
                        elif "series a" in lower_title:
                            round_enum = "SERIES_A"
                        elif "series b" in lower_title:
                            round_enum = "SERIES_B"
                        elif "series c" in lower_title:
                            round_enum = "SERIES_C"
                        elif "series d" in lower_title:
                            round_enum = "SERIES_D_PLUS"

                        with conn.cursor() as cur:
                            cur.execute("""
                                INSERT INTO ai_startups (
                                    id, name, slug, description, website, industry, 
                                    "fundingAmount", "fundingRound",
                                    "trendingScore", tags, "fundingDate", "updatedAt"
                                ) VALUES (%s, %s, %s, %s, %s, 'AI', %s, %s, %s, %s, NOW(), NOW())
                                ON CONFLICT (slug) DO UPDATE SET
                                    "fundingAmount" = EXCLUDED."fundingAmount",
                                    "fundingRound" = EXCLUDED."fundingRound",
                                    "trendingScore" = EXCLUDED."trendingScore",
                                    "fundingDate" = EXCLUDED."fundingDate",
                                    "updatedAt" = NOW()
                            """, (
                                uuid.uuid4().hex,
                                company_name[:255], # pyre-ignore[16]
                                slug,
                                (title + " - " + description)[:1000], # pyre-ignore[16]
                                link[:255], # pyre-ignore[16]
                                cents,
                                round_enum,
                                75.0 + (cents / 100000000000), # Boost trending by amount
                                ['startup', 'funding']
                            ))
                        saved += 1
                        
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO scraping_jobs (id, "jobName", status, "itemsFound", "itemsSaved", "completedAt")
                    VALUES (%s, 'startups-scraper', 'COMPLETED', %s, %s, NOW())
                """, (uuid.uuid4().hex, total_found, saved))
                
            conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"Startups scraper error: {e}")
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO scraping_jobs (id, "jobName", status, error, "completedAt")
                    VALUES (%s, 'startups-scraper', 'FAILED', %s, NOW())
                """, (uuid.uuid4().hex, str(e)))
            conn.commit()
        finally:
            conn.close()

        return saved

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = StartupsScraper()
    scraper.run()
