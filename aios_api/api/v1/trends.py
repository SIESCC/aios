from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.elasticsearch import es_client
from core.redis_cache import cache_response
from models.psql_models import AiModelDB, ResearchPaperDB, AiStartupDB
from sqlalchemy import text

router = APIRouter()

@router.get("/trending")
@cache_response(ttl_seconds=300)
async def get_trending_topics():
    try:
        aggs_query = {
            "size": 0,
            "query": {
                "range": {
                    "timestamp": {
                        "gte": "now-7d/d"
                    }
                }
            },
            "aggs": {
                "trending_tags": {
                    "terms": {
                        "field": "tags",
                        "size": 10,
                        "order": { "_count": "desc" }
                    }
                }
            }
        }
        res = es_client.search(index="ai_*_index", body=aggs_query)
        buckets = res["aggregations"]["trending_tags"]["buckets"]
        return [bucket["key"] for bucket in buckets]
    except Exception:
        # Fallback
        return ["AI Agents", "Large Language Models", "Generative AI", "Computer Vision"]

@router.get("/analytics")
@cache_response(ttl_seconds=3600)
async def get_system_analytics(db: Session = Depends(get_db)):
    try:
        new_models_week = db.execute(text("SELECT count(*) FROM ai_models WHERE \"createdAt\" >= NOW() - INTERVAL '7 days'")).scalar()
        new_papers = db.execute(text("SELECT count(*) FROM research_papers WHERE \"publicationDate\" >= NOW() - INTERVAL '7 days'")).scalar()
        total_startups = db.query(AiStartupDB).count()
        
        return {
            "new_models_this_week": new_models_week or 0,
            "new_papers_this_week": new_papers or 0,
            "total_startups_tracked": total_startups or 0
        }
    except Exception:
        return {
            "new_models_this_week": 0,
            "new_papers_this_week": 0,
            "total_startups_tracked": 0
        }
