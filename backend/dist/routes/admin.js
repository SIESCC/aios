"use strict";
// ============================================================
// Admin Routes — Content management + monitoring
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const redis_1 = require("../lib/redis");
const zod_1 = require("zod");
const logger_1 = require("../lib/logger");
const router = (0, express_1.Router)();
// All admin routes require authentication + admin role
router.use(auth_1.authenticate, auth_1.requireAdmin);
// ── Tool Management ────────────────────────────────────────
// GET /api/admin/tools/pending
router.get('/tools/pending', async (_req, res) => {
    try {
        const tools = await prisma_1.prisma.aiTool.findMany({
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
        });
        res.json(tools);
    }
    catch (err) {
        logger_1.logger.error('Admin pending tools error:', err);
        res.status(500).json({ error: 'Failed to fetch pending tools' });
    }
});
// PATCH /api/admin/tools/:id/approve
router.patch('/tools/:id/approve', async (req, res) => {
    try {
        const tool = await prisma_1.prisma.aiTool.update({
            where: { id: req.params.id },
            data: { status: 'APPROVED' },
        });
        await redis_1.cache.invalidatePattern('tools:*');
        res.json(tool);
    }
    catch (err) {
        logger_1.logger.error('Admin approve tool error:', err);
        res.status(500).json({ error: 'Failed to approve tool' });
    }
});
// PATCH /api/admin/tools/:id/reject
router.patch('/tools/:id/reject', async (req, res) => {
    try {
        const tool = await prisma_1.prisma.aiTool.update({
            where: { id: req.params.id },
            data: { status: 'REJECTED' },
        });
        await redis_1.cache.invalidatePattern('tools:*');
        res.json(tool);
    }
    catch (err) {
        logger_1.logger.error('Admin reject tool error:', err);
        res.status(500).json({ error: 'Failed to reject tool' });
    }
});
// PUT /api/admin/tools/:id — Full update (Validated)
router.put('/tools/:id', async (req, res) => {
    try {
        const updateSchema = zod_1.z.object({
            name: zod_1.z.string().optional(),
            tagline: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            website: zod_1.z.string().url().optional(),
            category: zod_1.z.string().optional(),
            pricing: zod_1.z.string().optional(),
            tags: zod_1.z.array(zod_1.z.string()).optional(),
            status: zod_1.z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
            trendingScore: zod_1.z.number().optional(),
        });
        const data = updateSchema.parse(req.body);
        const tool = await prisma_1.prisma.aiTool.update({
            where: { id: req.params.id },
            data,
        });
        await redis_1.cache.invalidatePattern('tools:*');
        res.json(tool);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        logger_1.logger.error('Admin update tool error:', err);
        res.status(500).json({ error: 'Failed to update tool' });
    }
});
// DELETE /api/admin/tools/:id
router.delete('/tools/:id', async (req, res) => {
    try {
        await prisma_1.prisma.aiTool.delete({ where: { id: req.params.id } });
        await redis_1.cache.invalidatePattern('tools:*');
        res.json({ success: true });
    }
    catch (err) {
        logger_1.logger.error('Admin delete tool error:', err);
        res.status(500).json({ error: 'Failed to delete tool' });
    }
});
// ── Prompt Management ─────────────────────────────────────
// GET /api/admin/prompts/pending
router.get('/prompts/pending', async (_req, res) => {
    const prompts = await prisma_1.prisma.prompt.findMany({
        where: { status: 'PENDING' },
        include: { author: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(prompts);
});
// PATCH /api/admin/prompts/:id/approve
router.patch('/prompts/:id/approve', async (req, res) => {
    const prompt = await prisma_1.prisma.prompt.update({
        where: { id: req.params.id },
        data: { status: 'APPROVED' },
    });
    await redis_1.cache.invalidatePattern('prompts:*');
    res.json(prompt);
});
// ── System Stats ───────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', async (_req, res) => {
    const [totalUsers, totalTools, pendingTools, totalPapers, totalRepos, totalStartups, totalPrompts, scrapingJobs,] = await Promise.all([
        prisma_1.prisma.user.count(),
        prisma_1.prisma.aiTool.count(),
        prisma_1.prisma.aiTool.count({ where: { status: 'PENDING' } }),
        prisma_1.prisma.researchPaper.count(),
        prisma_1.prisma.gitHubRepo.count(),
        prisma_1.prisma.aiStartup.count(),
        prisma_1.prisma.prompt.count(),
        prisma_1.prisma.scrapingJob.findMany({
            orderBy: { startedAt: 'desc' },
            take: 20,
        }),
    ]);
    res.json({
        stats: { totalUsers, totalTools, pendingTools, totalPapers, totalRepos, totalStartups, totalPrompts },
        recentJobs: scrapingJobs,
    });
});
// GET /api/admin/jobs — Scraping job history
router.get('/jobs', async (req, res) => {
    const { limit = '50' } = req.query;
    const jobs = await prisma_1.prisma.scrapingJob.findMany({
        orderBy: { startedAt: 'desc' },
        take: parseInt(limit),
    });
    res.json(jobs);
});
// GET /api/admin/users
router.get('/users', async (_req, res) => {
    const users = await prisma_1.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, username: true, role: true, createdAt: true },
    });
    res.json(users);
});
// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
    const { role } = req.body;
    if (!['USER', 'ADMIN', 'MODERATOR'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await prisma_1.prisma.user.update({
        where: { id: req.params.id },
        data: { role },
        select: { id: true, email: true, username: true, role: true },
    });
    res.json(user);
});
exports.default = router;
//# sourceMappingURL=admin.js.map