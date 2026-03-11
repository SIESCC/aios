import Redis from 'ioredis';
export declare const redis: Redis;
export declare const cache: {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    /**
     * Invalidates keys matching a pattern using SCAN (production-safe)
     */
    invalidatePattern(pattern: string): Promise<void>;
};
export default redis;
//# sourceMappingURL=redis.d.ts.map