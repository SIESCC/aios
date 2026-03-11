"""
AIOS Pipeline Orchestrator
Schedules and runs all automation workers
"""

import os
import time
import schedule
import logging
from dotenv import load_dotenv

load_dotenv()

os.makedirs("logs", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/orchestrator.log"),
    ],
)
logger = logging.getLogger("orchestrator")

# Import scrapers
from scrapers.github_scraper import GitHubScraper
from scrapers.arxiv_scraper import ArXivScraper
from scrapers.tools_scraper import ToolsScraper
from scrapers.news_scraper import NewsScraper
from scrapers.models_scraper import ModelsScraper
from scrapers.startups_scraper import StartupsScraper
from scrapers.prompts_scraper import PromptsScraper
from ai_processor.summarizer import AISummarizer


def run_github_scraper():
    """Fetch trending AI GitHub repositories"""
    logger.info("▶ Starting GitHub scraper...")
    try:
        scraper = GitHubScraper()
        count = scraper.run()
        logger.info(f"✅ GitHub scraper complete: {count} repos processed")
    except Exception as e:
        logger.error(f"❌ GitHub scraper failed: {e}", exc_info=True)


def run_arxiv_scraper():
    """Fetch latest AI research papers from arXiv"""
    logger.info("▶ Starting arXiv scraper...")
    try:
        scraper = ArXivScraper()
        count = scraper.run()
        logger.info(f"✅ arXiv scraper complete: {count} papers processed")
    except Exception as e:
        logger.error(f"❌ arXiv scraper failed: {e}", exc_info=True)


def run_news_scraper():
    """Fetch AI industry news"""
    logger.info("▶ Starting news scraper...")
    try:
        scraper = NewsScraper()
        count = scraper.run()
        logger.info(f"✅ News scraper complete: {count} articles processed")
    except Exception as e:
        logger.error(f"❌ News scraper failed: {e}", exc_info=True)


def run_tools_scraper():
    """Fetch AI tools from hacker news feed"""
    logger.info("▶ Starting tools scraper...")
    try:
        scraper = ToolsScraper()
        count = scraper.run()
        logger.info(f"✅ Tools scraper complete: {count} tools processed")
    except Exception as e:
        logger.error(f"❌ Tools scraper failed: {e}", exc_info=True)


def run_models_scraper():
    """Fetch top models from Hugging Face"""
    logger.info("▶ Starting models scraper...")
    try:
        scraper = ModelsScraper()
        count = scraper.run()
        logger.info(f"✅ Models scraper complete: {count} models processed")
    except Exception as e:
        logger.error(f"❌ Models scraper failed: {e}", exc_info=True)


def run_startups_scraper():
    """Fetch AI startup funding news"""
    logger.info("▶ Starting startups scraper...")
    try:
        scraper = StartupsScraper()
        count = scraper.run()
        logger.info(f"✅ Startups scraper complete: {count} startups processed")
    except Exception as e:
        logger.error(f"❌ Startups scraper failed: {e}", exc_info=True)


def run_prompts_scraper():
    """Fetch new AI prompts"""
    logger.info("▶ Starting prompts scraper...")
    try:
        scraper = PromptsScraper()
        count = scraper.run()
        logger.info(f"✅ Prompts scraper complete: {count} prompts processed")
    except Exception as e:
        logger.error(f"❌ Prompts scraper failed: {e}", exc_info=True)


def run_summarizer():
    """Generate AI summaries for queued items"""
    logger.info("▶ Starting AI summarizer...")
    try:
        summarizer = AISummarizer()
        count = summarizer.run()
        logger.info(f"✅ Summarizer complete: {count} items summarized")
    except Exception as e:
        logger.error(f"❌ Summarizer failed: {e}", exc_info=True)


def main():
    logger.info("🚀 AIOS Orchestrator starting...")

    # Run immediately on startup
    run_arxiv_scraper()
    run_github_scraper()
    run_news_scraper()
    run_tools_scraper()
    run_models_scraper()
    run_startups_scraper()
    run_prompts_scraper()

    # Schedule recurring runs
    schedule.every(3).hours.do(run_github_scraper)
    schedule.every(3).hours.do(run_arxiv_scraper)
    schedule.every(3).hours.do(run_news_scraper)
    schedule.every(3).hours.do(run_tools_scraper)
    schedule.every(3).hours.do(run_models_scraper)
    schedule.every(3).hours.do(run_startups_scraper)
    schedule.every(3).hours.do(run_prompts_scraper)
    schedule.every(3).hours.do(run_summarizer)

    logger.info("⏰ Schedules set. Running...")

    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


if __name__ == "__main__":
    main()
