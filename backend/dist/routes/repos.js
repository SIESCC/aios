"use strict";
// ============================================================
// GitHub Repos Routes
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
const router = (0, express_1.Router)();
// GET /api/repos
router.get('/', async (req, res) => {
    const { page = '1', limit = '20', language, sort = 'stars' } = req.query;
    const cacheKey = `repos:${JSON.stringify(req.query)}`;
    const cached = await redis_1.cache.get(cacheKey);
    if (cached)
        return res.json(cached);
    const pageNum = parseInt(page);
    const limitNum = Math.min(50, parseInt(limit));
    const where = {};
    if (language)
        where.language = { equals: language, mode: 'insensitive' };
    const orderBy = sort === 'growth' ? { weeklyGrowth: 'desc' }
        : sort === 'trending' ? { trendingScore: 'desc' }
            : sort === 'forks' ? { forks: 'desc' }
                : { stars: 'desc' };
    const [repos, total] = await Promise.all([
        prisma_1.prisma.gitHubRepo.findMany({
            where, orderBy, skip: (pageNum - 1) * limitNum, take: limitNum,
        }),
        prisma_1.prisma.gitHubRepo.count({ where }),
    ]);
    const result = { repos, pagination: { page: pageNum, limit: limitNum, total } };
    await redis_1.cache.set(cacheKey, result, 300);
    res.json(result);
});
// GET /api/repos/trending
router.get('/trending', async (_req, res) => {
    const cached = await redis_1.cache.get('repos:trending');
    if (cached)
        return res.json(cached);
    const repos = await prisma_1.prisma.gitHubRepo.findMany({
        orderBy: { weeklyGrowth: 'desc' },
        take: 10,
    });
    await redis_1.cache.set('repos:trending', repos, 600);
    res.json(repos);
});
exports.default = router;
//# sourceMappingURL=repos.js.map