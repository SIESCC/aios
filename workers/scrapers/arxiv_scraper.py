# pyre-ignore-all-errors
"""
arXiv AI Research Papers Scraper
Fetches papers from arXiv RSS/API for AI-related categories
"""

import os
import time
import logging
import feedparser
import psycopg2
import uuid
from datetime import datetime, timedelta
from email import utils as email_utils

logger = logging.getLogger("arxiv_scraper")

ARXIV_CATEGORIES = [
    "cs.AI",    # Artificial Intelligence
    "cs.LG",    # Machine Learning
    "cs.CL",    # Computation and Language (NLP)
    "cs.CV",    # Computer Vision
    "cs.RO",    # Robotics
    "stat.ML",  # Statistics - Machine Learning
]


class ArXivScraper:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.api_base = "https://export.arxiv.org/api/query"
        self.rss_base = "https://rss.arxiv.org/rss"

    def fetch_papers_via_rss(self, category: str) -> list:
        """Fetch latest papers via arXiv RSS feed"""
        url = f"{self.rss_base}/{category}"
        try:
            feed = feedparser.parse(url)
            papers = []

            for entry in feed.entries[:20]:  # limit to 20 per category
                # Parse arxiv ID from link
                link = entry.get("link", "")
                arxiv_id = link.split("/abs/")[-1] if "/abs/" in link else None

                # Parse date
                pub_date = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    pub_date = datetime(*entry.published_parsed[:6])

                # Authors
                authors = []
                if hasattr(entry, "authors"):
                    authors = [a.get("name", "") for a in entry.authors]
                elif hasattr(entry, "author"):
                    authors = [entry.author]

                papers.append({
                    "arxiv_id": arxiv_id,
                    "title": entry.get("title", "").replace("\n", " ").strip(),
                    "abstract": entry.get("summary", "").replace("\n", " ").strip(),
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
                paper["title"][:500],
                paper["authors"],
                paper["abstract"][:5000],
                paper["category"],
                paper["link"],
                paper.get("pdf_link"),
                paper.get("publication_date"),
            ))

    def run(self) -> int:
        """Main scraper entrypoint"""
        conn = psycopg2.connect(self.db_url)
        conn.autocommit = False
        saved = 0
        total_found = 0

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

                time.sleep(3)  # Respect arXiv rate limits

            conn.commit()

            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO scraping_jobs (id, "jobName", status, "itemsFound", "itemsSaved", "completedAt")
                    VALUES (%s, 'arxiv-scraper', 'COMPLETED', %s, %s, NOW())
                """, (uuid.uuid4().hex, total_found, saved))
            conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"arXiv scraper failed: {e}")
        finally:
            conn.close()

        return saved
