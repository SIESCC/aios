"""
AI Summarizer
Uses OpenAI to generate simplified summaries for research papers
"""

import os
import logging
import psycopg2
from openai import OpenAI

logger = logging.getLogger("ai_summarizer")

SYSTEM_PROMPT = """You are an expert AI researcher who explains complex papers to a general technical audience.
Summarize the following research paper abstract in 2-3 clear sentences that capture:
1. What problem is being solved
2. The key approach/method used
3. The main result or contribution

Keep it accessible, avoid jargon where possible, and be specific."""


class AISummarizer:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        api_key = os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=api_key) if api_key else None

    def summarize(self, abstract: str) -> str | None:
        if not self.client:
            logger.warning("No OpenAI API key configured")
            return None

        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Abstract:\n{abstract}"},
                ],
                max_tokens=200,
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI error: {e}")
            return None

    def run(self) -> int:
        """Process papers that don't have AI summaries yet"""
        conn = psycopg2.connect(self.db_url)
        conn.autocommit = False
        processed = 0

        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, abstract FROM research_papers
                    WHERE "aiSummary" IS NULL AND abstract IS NOT NULL
                    LIMIT 20
                """)
                papers = cur.fetchall()

            logger.info(f"Found {len(papers)} papers to summarize")

            for paper_id, abstract in papers:
                if not abstract or len(abstract) < 50:
                    continue

                summary = self.summarize(abstract)
                if summary:
                    with conn.cursor() as cur:
                        cur.execute("""
                            UPDATE research_papers SET "aiSummary" = %s WHERE id = %s
                        """, (summary, paper_id))
                    conn.commit()
                    processed += 1
                    logger.info(f"✅ Summarized paper {paper_id}")

        except Exception as e:
            conn.rollback()
            logger.error(f"Summarizer failed: {e}")
        finally:
            conn.close()

        return processed
