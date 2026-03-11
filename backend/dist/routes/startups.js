"use strict";
// ============================================================
// AI Startups Routes
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
const router = (0, express_1.Router)();
// GET /api/startups
router.get('/', async (req, res) => {
    const { page = '1', limit = '20', country, industry, round, sort = 'newest' } = req.query;
    const cacheKey = `startups:${JSON.stringify(req.query)}`;
    const cached = await redis_1.cache.get(cacheKey);
    if (cached)
        return res.json(cached);
    const pageNum = parseInt(page);
    const limitNum = Math.min(50, parseInt(limit));
    const where = {};
    if (country)
        where.country = { equals: country, mode: 'insensitive' };
    if (industry)
        where.industry = { equals: industry, mode: 'insensitive' };
    if (round)
        where.fundingRound = round.toUpperCase();
    const orderBy = sort === 'funding' ? { fundingAmount: 'desc' }
        : sort === 'trending' ? { trendingScore: 'desc' }
            : { fundingDate: 'desc' };
    const [startups, total] = await Promise.all([
        prisma_1.prisma.aiStartup.findMany({
            where, orderBy, skip: (pageNum - 1) * limitNum, take: limitNum,
        }),
        prisma_1.prisma.aiStartup.count({ where }),
    ]);
    const result = { startups, pagination: { page: pageNum, limit: limitNum, total } };
    await redis_1.cache.set(cacheKey, result, 300);
    res.json(result);
});
// GET /api/startups/latest-funding
router.get('/latest-funding', async (_req, res) => {
    const cached = await redis_1.cache.get('startups:latest-funding');
    if (cached)
        return res.json(cached);
    const startups = await prisma_1.prisma.aiStartup.findMany({
        where: { fundingDate: { not: null } },
        orderBy: { fundingDate: 'desc' },
        take: 8,
    });
    await redis_1.cache.set('startups:latest-funding', startups, 600);
    res.json(startups);
});
// GET /api/startups/:slug
router.get('/:slug', async (req, res) => {
    const startup = await prisma_1.prisma.aiStartup.findUnique({ where: { slug: req.params.slug } });
    if (!startup)
        return res.status(404).json({ error: 'Startup not found' });
    res.json(startup);
});
exports.default = router;
//# sourceMappingURL=startups.js.map