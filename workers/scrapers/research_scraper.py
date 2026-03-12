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
AI Research Papers Scraper
Fetches papers from arXiv RSS/API for AI-related categories
"""

import os
import time
import logging
import feedparser
import psycopg2
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("research_scraper")

ARXIV_CATEGORIES = [
    "cs.AI",    # Artificial Intelligence
    "cs.LG",    # Machine Learning
    "cs.CL",    # Computation and Language (NLP)
    "cs.CV",    # Computer Vision
    "cs.RO",    # Robotics
    "stat.ML",  # Statistics - Machine Learning
]


class ResearchScraper:
    def __init__(self):
        # Support both explicit parameters and connection string
        self.db_host = os.getenv("DB_HOST", "localhost")
        self.db_port = os.getenv("DB_PORT", "5432")
        self.db_name = os.getenv("DB_NAME", "aios_db")
        self.db_user = os.getenv("DB_USER", "aios")
        self.db_pass = os.getenv("DB_PASSWORD", "aios_secret_change_me")
        self.db_url = os.getenv("DATABASE_URL")
        self.rss_base = "https://rss.arxiv.org/rss"

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

    def fetch_papers_via_rss(self, category: str) -> list:
        """Fetch latest papers via arXiv RSS feed"""
        url = f"{self.rss_base}/{category}"
        try:
            feed = feedparser.parse(url)
            papers = []

            for entry in feed.get("entries", [])[:20]:  # limit to 20 per category
                # Parse arxiv ID from link
                link = str(entry.get("link", ""))
                arxiv_id = link.split("/abs/")[-1] if "/abs/" in link else None

                # Parse date safely
                pub_date = None
                published_parsed = entry.get("published_parsed")
                if published_parsed:
                    pub_date = datetime(*published_parsed[:6])

                # Parse authors safely
                authors = []
                entry_authors = entry.get("authors")
                if entry_authors:
                    authors = [str(a.get("name", "")) for a in entry_authors]
                else:
                    author = entry.get("author")
                    if author:
                        authors = [str(author)]
                
                title = str(entry.get("title", "")).replace("\n", " ").strip()
                abstract = str(entry.get("summary", "")).replace("\n", " ").strip()

                title = title[:500]  # pyre-ignore[16]
                abstract = abstract[:5000]  # pyre-ignore[16]

                papers.append({
                    "arxiv_id": arxiv_id,
                    "title": title,
                    "abstract": abstract,
                    "authors": authors,
                    "link": link,
                    "pdf_link": link.replace("/abs/", "/pdf/") + ".pdf" if "/abs/" in link else None,
                    "category": category,
                    "publication_date": pub_date,
                })

            return papers
        except Exception as e:
            logger.error(f"Failed to fetch arXiv RSS for {category}: {e}")
            return []

    def upsert_paper(self, conn, paper: dict):
        """Insert or update a paper in the database"""
        if not paper.get("arxiv_id"):
            return

        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO research_papers (
                    id, "arxivId", title, authors, abstract, source, category,
                    link, "pdfLink", "publicationDate", "updatedAt"
                ) VALUES (%s, %s, %s, %s, %s, 'arxiv', %s, %s, %s, %s, NOW())
                ON CONFLICT ("arxivId") DO UPDATE SET
                    "publicationDate" = EXCLUDED."publicationDate",
                    "updatedAt" = NOW()
            """, (
                uuid.uuid4().hex,
                paper["arxiv_id"],
                paper["title"],
                paper["authors"],
                paper["abstract"],
                paper["category"],
                paper["link"],
                paper.get("pdf_link"),
                paper.get("publication_date"),
            ))

    def run(self) -> int:
        """Main scraper entrypoint"""
        if not self.db_url:
            logger.error("No DATABASE_URL found. Please set it in environment variables.")
            return 0
            
        conn = self.get_db_connection()
        conn.autocommit = False
        saved: int = 0
        total_found: int = 0

        try:
            for category in ARXIV_CATEGORIES:
                papers = self.fetch_papers_via_rss(category)
                total_found += len(papers)
                logger.info(f"Fetched {len(papers)} papers for {category}")

                for paper in papers:
                    try:
                        self.upsert_paper(conn, paper)
                        saved += 1
                    except Exception as e:
                        logger.warning(f"Failed to save paper {paper.get('arxiv_id')}: {e}")

                time.sleep(1)  # Respect arXiv rate limits

            conn.commit()

            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO scraping_jobs (id, "jobName", status, "itemsFound", "itemsSaved", "completedAt")
                    VALUES (%s, 'research-scraper', 'COMPLETED', %s, %s, NOW())
                """, (uuid.uuid4().hex, total_found, saved))
            conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"Research scraper failed: {e}")
        finally:
            conn.close()

        return saved

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = ResearchScraper()
    scraper.run()
