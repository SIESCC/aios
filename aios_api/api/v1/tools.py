from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.psql_models import AiToolDB
from core.redis_cache import cache_response
from typing import Optional

router = APIRouter()

@router.get("/tools")
@cache_response(ttl_seconds=600)
async def get_tools(
    db: Session = Depends(get_db),
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    query = db.query(AiToolDB)
    if category:
        query = query.filter(AiToolDB.category.ilike(f"%{category}%"))
        
    tools = query.order_by(AiToolDB.trendingScore.desc()).offset(offset).limit(limit).all()
    return [{"id": t.id, "name": t.name, "category": t.category, "trendingScore": t.trendingScore} for t in tools]

@router.get("/tools/{tool_slug}")
async def get_tool_detail(tool_slug: str, db: Session = Depends(get_db)):
    tool = db.query(AiToolDB).filter(AiToolDB.slug == tool_slug).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
        
    return {
        "id": tool.id,
        "name": tool.name,
        "description": tool.description,
        "category": tool.category,
        "pricing": tool.pricing,
        "trendingScore": tool.trendingScore,
        "website": tool.website,
        "tags": tool.tags
    }
