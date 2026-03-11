"use strict";
// ============================================================
// Trends Dashboard Routes
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
const router = (0, express_1.Router)();
// GET /api/trends/overview — Main dashboard stats
router.get('/overview', async (_req, res) => {
    const cacheKey = 'trends:overview';
    const cached = await redis_1.cache.get(cacheKey);
    if (cached)
        return res.json(cached);
    const [totalTools, totalModels, totalPapers, totalRepos, trendingTools, trendingRepos, latestPapers,] = await Promise.all([
        prisma_1.prisma.aiTool.count({ where: { status: 'APPROVED' } }),
        prisma_1.prisma.aiModel.count(),
        prisma_1.prisma.researchPaper.count(),
        prisma_1.prisma.gitHubRepo.count(),
        prisma_1.prisma.aiTool.findMany({
            where: { status: 'APPROVED' },
            orderBy: { trendingScore: 'desc' },
            take: 5,
            select: { id: true, name: true, slug: true, trendingScore: true, weeklyGrowth: true, category: true, logoUrl: true },
        }),
        prisma_1.prisma.gitHubRepo.findMany({
            orderBy: { weeklyGrowth: 'desc' },
            take: 5,
            select: { id: true, fullName: true, stars: true, weeklyGrowth: true, language: true, repoUrl: true },
        }),
        prisma_1.prisma.researchPaper.findMany({
            orderBy: { publicationDate: 'desc' },
            take: 5,
            select: { id: true, title: true, authors: true, publicationDate: true, category: true },
        }),
    ]);
    const result = {
        stats: { totalTools, totalModels, totalPapers, totalRepos },
        trendingTools,
        trendingRepos,
        latestPapers,
    };
    await redis_1.cache.set(cacheKey, result, 300);
    res.json(result);
});
// GET /api/trends/categories — Category trend data
router.get('/categories', async (_req, res) => {
    const cached = await redis_1.cache.get('trends:categories');
    if (cached)
        return res.json(cached);
    const categories = await prisma_1.prisma.aiTool.groupBy({
        by: ['category'],
        where: { status: 'APPROVED' },
        _count: { category: true },
        _avg: { trendingScore: true },
        orderBy: { _count: { category: 'desc' } },
    });
    const result = categories.map((c) => ({
        category: c.category,
        count: c._count.category,
        avgTrending: Math.round((c._avg.trendingScore || 0) * 10) / 10,
    }));
    await redis_1.cache.set('trends:categories', result, 600);
    res.json(result);
});
// GET /api/trends/history — Time series data
router.get('/history', async (req, res) => {
    const { entityType = 'tool', days = '30' } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    const data = await prisma_1.prisma.trendData.findMany({
        where: {
            entityType,
            recordedAt: { gte: daysAgo },
        },
        orderBy: { recordedAt: 'asc' },
        take: 1000,
    });
    res.json(data);
});
// GET /api/trends/news — AI news feed
router.get('/news', async (req, res) => {
    const { limit = '10' } = req.query;
    const cached = await redis_1.cache.get(`trends:news:${limit}`);
    if (cached)
        return res.json(cached);
    const news = await prisma_1.prisma.aiNewsItem.findMany({
        orderBy: { publishedAt: 'desc' },
        take: parseInt(limit),
    });
    await redis_1.cache.set(`trends:news:${limit}`, news, 300);
    res.json(news);
});
exports.default = router;
//# sourceMappingURL=trends.js.map