import os
import logging
import requests
import psycopg2
import uuid
from datetime import datetime

logger = logging.getLogger("models_scraper")

class ModelsScraper:
    """
    Fetches trending and top downloaded AI models from Hugging Face API
    """

    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "AIOS-Bot/1.0"})

    def fetch_top_models(self) -> list:
        # Fetching top downloaded models recently
        url = "https://huggingface.co/api/models?sort=downloads&direction=-1&limit=20"
        try:
            resp = self.session.get(url, timeout=15)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Failed to fetch models: {e}")
            return []

    def run(self) -> int:
        logger.info("▶ Starting models scraper...")
        conn = psycopg2.connect(self.db_url)
        conn.autocommit = False
        saved = 0

        try:
            models = self.fetch_top_models()
            for model in models:
                model_id = model.get("modelId", "")
                name = model_id.split("/")[-1] if "/" in model_id else model_id
                org = model_id.split("/")[0] if "/" in model_id else "Community"
                
                tags = model.get("tags", [])
                pipeline_tag = model.get("pipeline_tag", "AI Model")
                downloads = model.get("downloads", 0)
                
                # Assign to our schema model types
                if "text-generation" in tags or "text2text-generation" in tags or "nlp" in tags:
                    model_type = "LLM"
                    capabilities = ["text"]
                elif "image-generation" in tags or "text-to-image" in tags:
                    model_type = "MULTIMODAL"
                    capabilities = ["text", "vision"]
                elif "audio" in tags or "text-to-speech" in tags:
                    model_type = "MULTIMODAL"
                    capabilities = ["audio"]
                else:
                    model_type = "LLM"
                    capabilities = ["text"]
                
                # Approximate release date from last modified if available
                updated_at_str = model.get("lastModified", "")
                release_date = None
                if updated_at_str:
                    try:
                        # Assuming ISO format returned by HF
                        release_date = datetime.strptime(updated_at_str[:19], "%Y-%m-%dT%H:%M:%S")
                    except:
                        release_date = datetime.now()
                else:
                    release_date = datetime.now()

                trending_score = min(100.0, downloads / 10000.0) # Simple synthetic score

                with conn.cursor() as cur:
                    cur.execute("""
                        INSERT INTO ai_models (
                            id, slug, name, organization, description, "modelType", 
                            "openSource", "apiAvailable", "trendingScore", capabilities, "releaseDate", "updatedAt"
                        ) VALUES (%s, %s, %s, %s, %s, %s, true, true, %s, %s, %s, NOW())
                        ON CONFLICT (slug) DO UPDATE SET
                            "trendingScore" = EXCLUDED."trendingScore",
                            "updatedAt" = NOW()
                    """, (
                        uuid.uuid4().hex,
                        model_id.replace("/", "-").lower(),
                        name,
                        org,
                        f"{pipeline_tag.capitalize()} model by {org}",
                        model_type,
                        trending_score,
                        capabilities,
                        release_date
                    ))
                saved += 1
                
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO scraping_jobs (id, "jobName", status, "itemsFound", "itemsSaved", "completedAt")
                    VALUES (%s, 'models-scraper', 'COMPLETED', %s, %s, NOW())
                """, (uuid.uuid4().hex, len(models), saved))
                
            conn.commit()
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Models scraper error: {e}")
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO scraping_jobs (id, "jobName", status, error, "completedAt")
                    VALUES (%s, 'models-scraper', 'FAILED', %s, NOW())
                """, (uuid.uuid4().hex, str(e)))
            conn.commit()
        finally:
            conn.close()

        return saved

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    scraper = ModelsScraper()
    scraper.run()
