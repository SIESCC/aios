# pyre-ignore-all-errors
"""
GitHub Trending AI Repositories Scraper
Fetches and stores trending AI repos from GitHub API
"""

import os
import json
import logging
import requests
import psycopg2
import uuid
from datetime import datetime, timedelta
from urllib.parse import quote

logger = logging.getLogger("github_scraper")

AI_TOPICS = [
    "artificial-intelligence", "machine-learning", "deep-learning",
    "llm", "large-language-model", "transformer", "neural-network",
    "generative-ai", "diffusion", "computer-vision", "nlp",
]


class GitHubScraper:
    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN", "")
        self.db_url = os.getenv("DATABASE_URL")
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "AIOS-Bot/1.0",
        })
        # Only use token if it looks real (not a placeholder)
        if self.token and not self.token.startswith("ghp_..."):
            self.session.headers["Authorization"] = f"token {self.token}"
            self.per_page = 30
        else:
            self.per_page = 10  # Lower for unauthenticated

    def fetch_trending_repos(self, topic: str, min_stars: int = 50) -> list:
        """Fetch repos by topic, sorted by stars, with recent activity"""
        created_after = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        query = f"topic:{topic} stars:>{min_stars} created:>{created_after}"
        url = f"https://api.github.com/search/repositories?q={quote(query)}&sort=stars&order=desc&per_page={self.per_page}"

        try:
            resp = self.session.get(url, timeout=15)
            if resp.status_code == 403:
                logger.warning(f"Rate limited on topic {topic}, sleeping 60s")
                import time
                time.sleep(60)
                resp = self.session.get(url, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            return data.get("items", [])
        except Exception as e:
            logger.error(f"Failed to fetch topic {topic}: {e}")
            return []

    def fetch_weekly_stars(self, full_name: str) -> int:
        """Get approximate weekly star growth via traffic API"""
        # Note: traffic API requires push access. Use star count delta instead.
        # This is a simplified approximation.
        return 0

    def upsert_repo(self, conn, repo: dict):
        """Insert or update a GitHub repo in the database"""
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO github_repos (
                    id, "repoId", name, "fullName", description, language,
                    stars, forks, watchers, topics, "repoUrl", homepage,
                    "isFork", "pushedAt", "lastScraped", "updatedAt"
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT ("repoId") DO UPDATE SET
                    stars = EXCLUDED.stars,
                    forks = EXCLUDED.forks,
                    watchers = EXCLUDED.watchers,
                    "lastScraped" = NOW(),
                    "updatedAt" = NOW()
            """, (
                uuid.uuid4().hex, repo["id"], repo["name"], repo["full_name"],
                repo.get("description", "")[:500] if repo.get("description") else None,
                repo.get("language"),
                repo.get("stargazers_count", 0),
                repo.get("forks_count", 0),
                repo.get("watchers_count", 0),
                repo.get("topics", []),
                repo["html_url"],
                repo.get("homepage"),
                repo.get("fork", False),
                repo.get("pushed_at"),
            ))

    def run(self) -> int:
        """Main scraper entrypoint"""
        conn = psycopg2.connect(self.db_url)
        conn.autocommit = False
        saved = 0

        try:
            seen_ids = set()
            all_repos = []

            for topic in AI_TOPICS:
                repos = self.fetch_trending_repos(topic)
                for repo in repos:
                    if repo["id"] not in seen_ids:
                        seen_ids.add(repo["id"])
                        all_repos.append(repo)

            logger.info(f"Found {len(all_repos)} unique repos across {len(AI_TOPICS)} topics")

            for repo in all_repos:
                try:
                    self.upsert_repo(conn, repo)
                    saved += 1
                except Exception as e:
                    logger.warning(f"Failed to save repo {repo.get('full_name')}: {e}")

            conn.commit()

            # Log job
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO scraping_jobs (id, "jobName", status, "itemsFound", "itemsSaved", "completedAt")
                    VALUES (%s, %s, 'COMPLETED', %s, %s, NOW())
                """, (uuid.uuid4().hex, "github-scraper", len(all_repos), saved))
            conn.commit()

        except Exception as e:
            conn.rollback()
            logger.error(f"GitHub scraper transaction failed: {e}")
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO scraping_jobs (id, "jobName", status, error, "completedAt")
                    VALUES (%s, 'github-scraper', 'FAILED', %s, NOW())
                """, (uuid.uuid4().hex, str(e),))
            conn.commit()
        finally:
            conn.close()

        return saved
