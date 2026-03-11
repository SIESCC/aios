"use strict";
// ============================================================
// Prompts Library Routes
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const redis_1 = require("../lib/redis");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/prompts
router.get('/', auth_1.optionalAuth, async (req, res) => {
    const { page = '1', limit = '24', category, search, sort = 'rating' } = req.query;
    const cacheKey = `prompts:${JSON.stringify(req.query)}`;
    const cached = await redis_1.cache.get(cacheKey);
    if (cached)
        return res.json(cached);
    const pageNum = parseInt(page);
    const limitNum = Math.min(50, parseInt(limit));
    const where = { status: 'APPROVED' };
    if (category)
        where.category = category;
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }
    const orderBy = sort === 'newest' ? { createdAt: 'desc' }
        : sort === 'copies' ? { copyCount: 'desc' }
            : { rating: 'desc' };
    const [prompts, total] = await Promise.all([
        prisma_1.prisma.prompt.findMany({
            where,
            orderBy,
            skip: (pageNum - 1) * limitNum,
            take: limitNum,
            include: { author: { select: { username: true, avatar: true } } },
        }),
        prisma_1.prisma.prompt.count({ where }),
    ]);
    const result = { prompts, pagination: { page: pageNum, limit: limitNum, total } };
    await redis_1.cache.set(cacheKey, result, 300);
    res.json(result);
});
// GET /api/prompts/categories
router.get('/categories', async (_req, res) => {
    const categories = await prisma_1.prisma.prompt.groupBy({
        by: ['category'],
        where: { status: 'APPROVED' },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
    });
    res.json(categories.map((c) => ({ name: c.category, count: c._count.category })));
});
// GET /api/prompts/:slug
router.get('/:slug', async (req, res) => {
    const prompt = await prisma_1.prisma.prompt.findUnique({
        where: { slug: req.params.slug },
        include: { author: { select: { username: true, avatar: true } } },
    });
    if (!prompt)
        return res.status(404).json({ error: 'Prompt not found' });
    res.json(prompt);
});
// POST /api/prompts — Submit prompt
router.post('/', auth_1.authenticate, async (req, res) => {
    const schema = zod_1.z.object({
        title: zod_1.z.string().min(5).max(150),
        description: zod_1.z.string().optional(),
        promptText: zod_1.z.string().min(10),
        usageExample: zod_1.z.string().optional(),
        category: zod_1.z.string(),
        tags: zod_1.z.array(zod_1.z.string()).max(5),
        model: zod_1.z.string().optional(),
    });
    try {
        const data = schema.parse(req.body);
        const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            + '-' + Date.now().toString(36);
        const prompt = await prisma_1.prisma.prompt.create({
            data: { ...data, slug, authorId: req.user.id, status: 'PENDING' },
        });
        res.status(201).json(prompt);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        res.status(500).json({ error: 'Failed to create prompt' });
    }
});
// POST /api/prompts/:id/copy — Track copy count
router.post('/:id/copy', async (req, res) => {
    await prisma_1.prisma.prompt.update({
        where: { id: req.params.id },
        data: { copyCount: { increment: 1 } },
    });
    res.json({ success: true });
});
exports.default = router;
//# sourceMappingURL=prompts.js.map