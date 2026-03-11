// ============================================================
// Redis Client (ioredis)
// ============================================================

import Redis from 'ioredis';
import { logger } from './logger';

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err: any) => logger.error('Redis error:', err.message));

// Cache helpers
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const val = await redis.get(key);
      if (!val) return null;
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  /**
   * Invalidates keys matching a pattern using SCAN (production-safe)
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const stream = redis.scanStream({
      match: pattern,
      count: 100,
    });

    stream.on('data', (keys: string[]) => {
      if (keys.length > 0) {
        redis.del(...keys);
      }
    });

    return new Promise((resolve, reject) => {
      stream.on('end', () => resolve());
      stream.on('error', (err: any) => reject(err));
    });
  },
};

export default redis;

