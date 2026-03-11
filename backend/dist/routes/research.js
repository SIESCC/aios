"use strict";
// ============================================================
// Research Papers Routes
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
const router = (0, express_1.Router)();
// GET /api/research
router.get('/', async (req, res) => {
    const { page = '1', limit = '20', category, search, sort = 'newest' } = req.query;
    const cacheKey = `research:${JSON.stringify(req.query)}`;
    const cached = await redis_1.cache.get(cacheKey);
    if (cached)
        return res.json(cached);
    const pageNum = parseInt(page);
    const limitNum = Math.min(50, parseInt(limit));
    const where = {};
    if (category)
        where.category = category;
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { abstract: { contains: search, mode: 'insensitive' } },
        ];
    }
    const orderBy = sort === 'trending' ? { trendingScore: 'desc' }
        : sort === 'cited' ? { citationCount: 'desc' }
            : { publicationDate: 'desc' };
    const [papers, total] = await Promise.all([
        prisma_1.prisma.researchPaper.findMany({
            where,
            orderBy,
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            select: {
                id: true, title: true, authors: true, abstract: true, aiSummary: true,
                source: true, category: true, tags: true, publicationDate: true, link: true,
                citationCount: true, trendingScore: true, createdAt: true,
            },
        }),
        prisma_1.prisma.researchPaper.count({ where }),
    ]);
    const result = { papers, pagination: { page: pageNum, limit: limitNum, total } };
    await redis_1.cache.set(cacheKey, result, 300);
    res.json(result);
});
// GET /api/research/latest — For homepage
router.get('/latest', async (_req, res) => {
    const cached = await redis_1.cache.get('research:latest');
    if (cached)
        return res.json(cached);
    const papers = await prisma_1.prisma.researchPaper.findMany({
        orderBy: { publicationDate: 'desc' },
        take: 6,
        select: {
            id: true, title: true, authors: true, aiSummary: true,
            publicationDate: true, link: true, category: true,
        },
    });
    await redis_1.cache.set('research:latest', papers, 600);
    res.json(papers);
});
// GET /api/research/:id
router.get('/:id', async (req, res) => {
    const paper = await prisma_1.prisma.researchPaper.findUnique({ where: { id: req.params.id } });
    if (!paper)
        return res.status(404).json({ error: 'Paper not found' });
    res.json(paper);
});
exports.default = router;
//# sourceMappingURL=research.js.map