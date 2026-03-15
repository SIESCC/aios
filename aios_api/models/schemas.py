from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class BaseIntelligence(BaseModel):
    id: str
    title: str
    category: str
    tags: List[str] = []
    source: str
    url: Optional[str] = None
    timestamp: datetime
    trending_score: float

class AiModelSchema(BaseIntelligence):
    company: str
    architecture: Optional[str] = None
    parameters: Optional[str] = None
    open_source: bool = False
    api_available: bool = False

class AiToolSchema(BaseIntelligence):
    description: str
    pricing: str = "Free"

class ResearchPaperSchema(BaseIntelligence):
    authors: List[str]
    abstract: str
    citation_count: int = 0
    pdf_link: Optional[str] = None

class SearchResultResponse(BaseModel):
    query: str
    total_hits: int
    processing_time_ms: int
    results: List[Dict[str, Any]]
