from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from core.database import get_db
from models.psql_models import AiModelDB
from core.redis_cache import cache_response
from typing import List, Optional

router = APIRouter()

@router.get("/models")
@cache_response(ttl_seconds=600)
async def get_models(
    db: Session = Depends(get_db),
    company: Optional[str] = None,
    open_source: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0
):
    query = db.query(AiModelDB)
    if company:
        query = query.filter(AiModelDB.organization.ilike(f"%{company}%"))
    if open_source is not None:
        query = query.filter(AiModelDB.openSource == open_source)
        
    models = query.order_by(AiModelDB.trendingScore.desc()).offset(offset).limit(limit).all()
    # Serialize safely for cache
    def safe_getattr(obj, attr):
        return getattr(obj, attr) if hasattr(obj, attr) else None
        
    return [{"id": m.id, "name": m.name, "organization": m.organization, "trendingScore": m.trendingScore} for m in models]

@router.get("/models/{model_slug}")
async def get_model_detail(model_slug: str, db: Session = Depends(get_db)):
    model = db.query(AiModelDB).filter(AiModelDB.slug == model_slug).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    return {
        "id": model.id,
        "name": model.name,
        "organization": model.organization,
        "modelType": model.modelType,
        "description": model.description,
        "releaseDate": model.releaseDate,
        "apiAvailable": model.apiAvailable,
        "openSource": model.openSource,
        "parameterCount": model.parameterCount,
        "contextWindow": model.contextWindow,
        "capabilities": model.capabilities,
        "trendingScore": model.trendingScore,
        "website": model.website
    }
