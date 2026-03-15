from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from core.database import get_db
from core.redis_cache import cache_response

router = APIRouter()

@router.get("/alerts")
@cache_response(ttl_seconds=120)
async def get_ecosystem_alerts(db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT name as title, 'model' as category, website as url, "trendingScore" 
            FROM ai_models 
            WHERE "createdAt" >= NOW() - INTERVAL '24 hours' 
            AND "trendingScore" > 85.0 
            UNION ALL
            SELECT name as title, 'tool' as category, website as url, "trendingScore" 
            FROM ai_tools 
            WHERE "createdAt" >= NOW() - INTERVAL '24 hours' 
            AND "trendingScore" > 85.0
            ORDER BY "trendingScore" DESC LIMIT 5
        """)
        major_releases = db.execute(query).fetchall()
        
        return [{"event": row.title, "type": row.category, "url": row.url, "impact_score": row.trendingScore} for row in major_releases]
    except Exception:
        return []

@router.get("/latest")
@cache_response(ttl_seconds=300)
async def get_latest_releases(db: Session = Depends(get_db)):
    try:
        query = text("""
            SELECT name, 'model' as type, "createdAt" as created_at FROM ai_models
            UNION ALL
            SELECT name, 'tool' as type, "createdAt" as created_at FROM ai_tools
            ORDER BY created_at DESC LIMIT 10
        """)
        latest = db.execute(query).fetchall()
        return [{"name": getattr(row, 'name', None), "type": getattr(row, 'type', None), "created_at": str(getattr(row, 'created_at', None))} for row in latest]
    except Exception:
        return []
