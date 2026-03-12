// ============================================================
// Admin Routes — Content management + monitoring
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireAdmin } from '../middleware/auth';
import { cache } from '../lib/redis';

import { z } from 'zod';
import { logger } from '../lib/logger';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ── Tool Management ────────────────────────────────────────

// GET /api/admin/tools/pending
router.get('/tools/pending', async (_req: Request, res: Response) => {
  try {
    const tools = await prisma.aiTool.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    res.json(tools);
  } catch (err) {
    logger.error('Admin pending tools error:', err);
    res.status(500).json({ error: 'Failed to fetch pending tools' });
  }
});

// PATCH /api/admin/tools/:id/approve
router.patch('/tools/:id/approve', async (req: Request, res: Response) => {
  try {
    const tool = await prisma.aiTool.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' },
    });
    await cache.invalidatePattern('tools:*');
    res.json(tool);
  } catch (err) {
    logger.error('Admin approve tool error:', err);
    res.status(500).json({ error: 'Failed to approve tool' });
  }
});

// PATCH /api/admin/tools/:id/reject
router.patch('/tools/:id/reject', async (req: Request, res: Response) => {
  try {
    const tool = await prisma.aiTool.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });
    await cache.invalidatePattern('tools:*');
    res.json(tool);
  } catch (err) {
    logger.error('Admin reject tool error:', err);
    res.status(500).json({ error: 'Failed to reject tool' });
  }
});

// PUT /api/admin/tools/:id — Full update (Validated)
router.put('/tools/:id', async (req: Request, res: Response) => {
  try {
    const updateSchema = z.object({
      name: z.string().optional(),
      tagline: z.string().optional(),
      description: z.string().optional(),
      website: z.string().url().optional(),
      category: z.string().optional(),
      pricing: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
      trendingScore: z.number().optional(),
    });

    const data = updateSchema.parse(req.body);

    const tool = await prisma.aiTool.update({
      where: { id: req.params.id },
      data,
    });
    await cache.invalidatePattern('tools:*');
    res.json(tool);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    logger.error('Admin update tool error:', err);
    res.status(500).json({ error: 'Failed to update tool' });
  }
});

// DELETE /api/admin/tools/:id
router.delete('/tools/:id', async (req: Request, res: Response) => {
  try {
    await prisma.aiTool.delete({ where: { id: req.params.id } });
    await cache.invalidatePattern('tools:*');
    res.json({ success: true });
  } catch (err) {
    logger.error('Admin delete tool error:', err);
    res.status(500).json({ error: 'Failed to delete tool' });
  }
});


// ── Prompt Management ─────────────────────────────────────

// GET /api/admin/prompts/pending
router.get('/prompts/pending', async (_req: Request, res: Response) => {
  const prompts = await prisma.prompt.findMany({
    where: { status: 'PENDING' },
    include: { author: { select: { username: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(prompts);
});

// PATCH /api/admin/prompts/:id/approve
router.patch('/prompts/:id/approve', async (req: Request, res: Response) => {
  const prompt = await prisma.prompt.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED' },
  });
  await cache.invalidatePattern('prompts:*');
  res.json(prompt);
});

// ── System Stats ───────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', async (_req: Request, res: Response) => {
  const [
    totalUsers, totalTools, pendingTools,
    totalPapers, totalRepos, totalStartups, totalPrompts,
    scrapingJobs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.aiTool.count(),
    prisma.aiTool.count({ where: { status: 'PENDING' } }),
    prisma.researchPaper.count(),
    prisma.gitHubRepo.count(),
    prisma.aiStartup.count(),
    prisma.prompt.count(),
    prisma.scrapingJob.findMany({
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
router.get('/jobs', async (req: Request, res: Response) => {
  const { limit = '50' } = req.query as Record<string, string>;
  const jobs = await prisma.scrapingJob.findMany({
    orderBy: { startedAt: 'desc' },
    take: parseInt(limit),
  });
  res.json(jobs);
});

// GET /api/admin/users
router.get('/users', async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, username: true, role: true, createdAt: true },
  });
  res.json(users);
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!['USER', 'ADMIN', 'MODERATOR'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { role },
    select: { id: true, email: true, username: true, role: true },
  });
  res.json(user);
});

// ── Community Submission Management ───────────────────────

// GET /api/admin/community/pending
router.get('/community/pending', async (_req: Request, res: Response) => {
  const submissions = await prisma.communitySubmission.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
  res.json(submissions);
});

// PATCH /api/admin/community/:id/approve
router.patch('/community/:id/approve', async (req: Request, res: Response) => {
  const submission = await prisma.communitySubmission.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED' },
  });
  await cache.invalidatePattern('community:*');
  res.json(submission);
});

// PATCH /api/admin/community/:id/reject
router.patch('/community/:id/reject', async (req: Request, res: Response) => {
  const submission = await prisma.communitySubmission.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED' },
  });
  await cache.invalidatePattern('community:*');
  res.json(submission);
});

export default router;
