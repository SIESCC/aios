// ============================================================
// Community Contribution Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import { logger } from '../lib/logger';

const router = Router();

// GET /api/community — List approved submissions
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', type } = req.query as Record<string, string>;

    const cacheKey = `community:${JSON.stringify(req.query)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const pageNum = parseInt(page);
    const limitNum = Math.min(50, parseInt(limit));
    const where: Record<string, unknown> = { status: 'APPROVED' };
    if (type) where.type = type.toUpperCase();

    const [submissions, total] = await Promise.all([
      prisma.communitySubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.communitySubmission.count({ where }),
    ]);

    const result = { submissions, pagination: { page: pageNum, limit: limitNum, total } };
    await cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    logger.error('Community list error:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// GET /api/community/stats
router.get('/stats', async (_req: Request, res: Response) => {
  const cached = await cache.get('community:stats');
  if (cached) return res.json(cached);

  const [totalReviews, totalPrompts, totalWorkflows, totalComparisons, pending] = await Promise.all([
    prisma.communitySubmission.count({ where: { type: 'TOOL_REVIEW', status: 'APPROVED' } }),
    prisma.communitySubmission.count({ where: { type: 'PROMPT', status: 'APPROVED' } }),
    prisma.communitySubmission.count({ where: { type: 'WORKFLOW', status: 'APPROVED' } }),
    prisma.communitySubmission.count({ where: { type: 'COMPARISON', status: 'APPROVED' } }),
    prisma.communitySubmission.count({ where: { status: 'PENDING' } }),
  ]);

  const result = { totalReviews, totalPrompts, totalWorkflows, totalComparisons, pending };
  await cache.set('community:stats', result, 300);
  res.json(result);
});

// POST /api/community — Submit contribution
router.post('/', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      type: z.enum(['TOOL_REVIEW', 'PROMPT', 'WORKFLOW', 'COMPARISON']),
      title: z.string().min(3).max(200),
      content: z.string().min(10),
      metadata: z.record(z.any()).optional(),
      authorName: z.string().optional(),
      authorEmail: z.string().email().optional(),
    });

    const data = schema.parse(req.body);

    const submission = await prisma.communitySubmission.create({
      data: {
        type: data.type,
        title: data.title,
        content: data.content,
        metadata: data.metadata,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
      },
    });

    res.status(201).json(submission);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    logger.error('Community submit error:', err);
    res.status(500).json({ error: 'Failed to submit' });
  }
});

export default router;
