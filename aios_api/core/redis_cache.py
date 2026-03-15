import redis
import json
from functools import wraps
from config import REDIS_URL
import logging

logger = logging.getLogger(__name__)

redis_client = redis.from_url(REDIS_URL, decode_responses=True)

def cache_response(ttl_seconds: int = 300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{kwargs}"
            try:
                cached_data = redis_client.get(cache_key)
                if cached_data:
                    return json.loads(cached_data)
            except Exception:
                pass
            
            result = await func(*args, **kwargs)
            
            try:
                def default_serializer(obj):
                    if hasattr(obj, 'model_dump'):
                        return obj.model_dump()
                    if hasattr(obj, 'isoformat'):
                        return obj.isoformat()
                    return str(obj)

                redis_client.setex(cache_key, ttl_seconds, json.dumps(result, default=default_serializer))
            except Exception as e:
                logger.warning(f"Failed to cache response: {e}")
            return result
        return wrapper
    return decorator
