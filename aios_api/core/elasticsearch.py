import os
from elasticsearch import Elasticsearch
from sentence_transformers import SentenceTransformer
from config import ELASTICSEARCH_URL
import logging

logger = logging.getLogger(__name__)

es_client = Elasticsearch(ELASTICSEARCH_URL)

_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        try:
            _embedder = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            logger.error(f"Failed to load embedder: {e}")
    return _embedder

def generate_embedding(text: str) -> list:
    embedder = get_embedder()
    if embedder:
        return embedder.encode(text).tolist()
    return []
