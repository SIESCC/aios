from fastapi import APIRouter, Query
from core.elasticsearch import es_client, generate_embedding
from models.schemas import SearchResultResponse
from typing import Optional
import time

router = APIRouter()

@router.get("/search", response_model=SearchResultResponse)
async def global_search(
    q: str = Query(..., description="The search query"),
    category: Optional[str] = None,
    limit: int = Query(20, le=100)
):
    start_time = time.time()
    
    try:
        # Generate Semantic Vector
        vector = generate_embedding(q)
        
        filters = []
        if category:
            filters.append({"term": {"category": category}})

        if vector:
            query_body = {
                "knn": {
                    "field": "text_embedding",
                    "query_vector": vector,
                    "k": limit,
                    "num_candidates": 100,
                    "boost": 0.5
                },
                "query": {
                    "bool": {
                        "must": [{"multi_match": {"query": q, "fields": ["title^2", "summary"], "fuzziness": "AUTO"}}],
                        "filter": filters
                    }
                },
                "size": limit
            }
        else:
            query_body = {
                "query": {
                    "bool": {
                        "must": [{"multi_match": {"query": q, "fields": ["title^2", "summary"], "fuzziness": "AUTO"}}],
                        "filter": filters
                    }
                },
                "size": limit
            }

        res = es_client.search(index="ai_*_index", body=query_body)
        
        return {
            "query": q,
            "total_hits": res["hits"]["total"]["value"] if isinstance(res["hits"]["total"], dict) else res["hits"]["total"],
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "results": [hit["_source"] for hit in res["hits"]["hits"]]
        }
    except Exception as e:
        # Fallback if ES is not available or query fails
        return {
            "query": q,
            "total_hits": 0,
            "processing_time_ms": int((time.time() - start_time) * 1000),
            "results": []
        }
