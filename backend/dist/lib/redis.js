"use strict";
// ============================================================
// Redis Client (ioredis)
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("./logger");
exports.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
});
exports.redis.on('connect', () => logger_1.logger.info('Redis connected'));
exports.redis.on('error', (err) => logger_1.logger.error('Redis error:', err.message));
// Cache helpers
exports.cache = {
    async get(key) {
        try {
            const val = await exports.redis.get(key);
            if (!val)
                return null;
            return JSON.parse(val);
        }
        catch {
            return null;
        }
    },
    async set(key, value, ttlSeconds = 300) {
        await exports.redis.setex(key, ttlSeconds, JSON.stringify(value));
    },
    async del(key) {
        await exports.redis.del(key);
    },
    /**
     * Invalidates keys matching a pattern using SCAN (production-safe)
     */
    async invalidatePattern(pattern) {
        const stream = exports.redis.scanStream({
            match: pattern,
            count: 100,
        });
        stream.on('data', (keys) => {
            if (keys.length > 0) {
                exports.redis.del(...keys);
            }
        });
        return new Promise((resolve, reject) => {
            stream.on('end', () => resolve());
            stream.on('error', (err) => reject(err));
        });
    },
};
exports.default = exports.redis;
//# sourceMappingURL=redis.js.map