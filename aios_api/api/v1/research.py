from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from models.psql_models import ResearchPaperDB
from core.redis_cache import cache_response
from typing import Optional

router = APIRouter()

@router.get("/research")
@cache_response(ttl_seconds=600)
async def get_research(
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    query = db.query(ResearchPaperDB)
    papers = query.order_by(ResearchPaperDB.trendingScore.desc()).offset(offset).limit(limit).all()
    return [{"id": p.id, "title": p.title, "authors": p.authors, "trendingScore": p.trendingScore} for p in papers]

@router.get("/research/{arxiv_id}")
async def get_research_detail(arxiv_id: str, db: Session = Depends(get_db)):
    paper = db.query(ResearchPaperDB).filter(ResearchPaperDB.arxivId == arxiv_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    return {
        "id": paper.id,
        "arxivId": paper.arxivId,
        "title": paper.title,
        "authors": paper.authors,
        "abstract": paper.abstract,
        "category": paper.category,
        "citationCount": paper.citationCount,
        "trendingScore": paper.trendingScore,
        "publicationDate": paper.publicationDate,
        "link": paper.link,
        "pdfLink": paper.pdfLink
    }
