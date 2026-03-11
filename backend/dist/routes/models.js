"use strict";
// ============================================================
// AI Models Leaderboard Routes
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
const router = (0, express_1.Router)();
// GET /api/models — Leaderboard with filtering
router.get('/', async (req, res) => {
    const { type, org, sort = 'trending', page = '1', limit = '20' } = req.query;
    const cacheKey = `models:${JSON.stringify(req.query)}`;
    const cached = await redis_1.cache.get(cacheKey);
    if (cached)
        return res.json(cached);
    const where = {};
    if (type)
        where.modelType = type.toUpperCase();
    if (org)
        where.organization = { contains: org, mode: 'insensitive' };
    const pageNum = parseInt(page);
    const limitNum = Math.min(50, parseInt(limit));
    const orderBy = sort === 'trending' ? { trendingScore: 'desc' }
        : sort === 'newest' ? { releaseDate: 'desc' }
            : { trendingScore: 'desc' };
    const [models, total] = await Promise.all([
        prisma_1.prisma.aiModel.findMany({ where, orderBy, skip: (pageNum - 1) * limitNum, take: limitNum }),
        prisma_1.prisma.aiModel.count({ where }),
    ]);
    const result = { models, pagination: { page: pageNum, limit: limitNum, total } };
    await redis_1.cache.set(cacheKey, result, 300);
    res.json(result);
});
// GET /api/models/leaderboard/:type — Type-specific leaderboard
router.get('/leaderboard/:type', async (req, res) => {
    const { type } = req.params;
    const validTypes = ['LLM', 'CODE', 'IMAGE', 'AUDIO', 'VIDEO', 'MULTIMODAL'];
    if (!validTypes.includes(type.toUpperCase())) {
        return res.status(400).json({ error: 'Invalid model type' });
    }
    const cacheKey = `models:leaderboard:${type}`;
    const cached = await redis_1.cache.get(cacheKey);
    if (cached)
        return res.json(cached);
    const models = await prisma_1.prisma.aiModel.findMany({
        where: { modelType: type.toUpperCase() },
        orderBy: { trendingScore: 'desc' },
        take: 20,
    });
    await redis_1.cache.set(cacheKey, models, 600);
    res.json(models);
});
// GET /api/models/:slug
router.get('/:slug', async (req, res) => {
    const model = await prisma_1.prisma.aiModel.findUnique({ where: { slug: req.params.slug } });
    if (!model)
        return res.status(404).json({ error: 'Model not found' });
    res.json(model);
});
exports.default = router;
//# sourceMappingURL=models.js.map