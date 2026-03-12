// ============================================================
// AI Workflow Builder Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { logger } from '../lib/logger';

const router = Router();

// GET /api/workflows — List workflows
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', category, sort = 'popular' } = req.query as Record<string, string>;

    const cacheKey = `workflows:${JSON.stringify(req.query)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const pageNum = parseInt(page);
    const limitNum = Math.min(50, parseInt(limit));
    const where: Record<string, unknown> = { isPublic: true };
    if (category) where.category = category;

    const orderBy = sort === 'popular' ? { usageCount: 'desc' as const }
      : sort === 'newest' ? { createdAt: 'desc' as const }
      : { usageCount: 'desc' as const };

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        orderBy,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      }),
      prisma.workflow.count({ where }),
    ]);

    const result = { workflows, pagination: { page: pageNum, limit: limitNum, total } };
    await cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    logger.error('Workflows list error:', err);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// GET /api/workflows/featured — Featured/recommended workflows
router.get('/featured', async (_req: Request, res: Response) => {
  const cached = await cache.get('workflows:featured');
  if (cached) return res.json(cached);

  const workflows = await prisma.workflow.findMany({
    where: { featured: true, isPublic: true },
    orderBy: { usageCount: 'desc' },
    take: 6,
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  await cache.set('workflows:featured', workflows, 600);
  res.json(workflows);
});

// GET /api/workflows/categories
router.get('/categories', async (_req: Request, res: Response) => {
  const cached = await cache.get('workflows:categories');
  if (cached) return res.json(cached);

  const categories = await prisma.workflow.groupBy({
    by: ['category'],
    where: { isPublic: true },
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });

  const result = categories.map((c) => ({
    name: c.category,
    count: c._count.category,
  }));

  await cache.set('workflows:categories', result, 600);
  res.json(result);
});

// GET /api/workflows/:slug
router.get('/:slug', async (req: Request, res: Response) => {
  const workflow = await prisma.workflow.findUnique({
    where: { slug: req.params.slug },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

  // Increment usage
  prisma.workflow.update({
    where: { id: workflow.id },
    data: { usageCount: { increment: 1 } },
  }).catch(() => {});

  res.json(workflow);
});

// POST /api/workflows — Create workflow
router.post('/', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      title: z.string().min(2).max(200),
      description: z.string().optional(),
      category: z.string(),
      steps: z.array(z.object({
        toolName: z.string(),
        toolSlug: z.string().optional(),
        action: z.string(),
        description: z.string().optional(),
      })).min(2).max(20),
    });

    const data = schema.parse(req.body);
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const workflow = await prisma.workflow.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        category: data.category,
        steps: {
          create: data.steps.map((step, i) => ({
            stepOrder: i + 1,
            toolName: step.toolName,
            toolSlug: step.toolSlug,
            action: step.action,
            description: step.description,
          })),
        },
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    await cache.invalidatePattern('workflows:*');
    res.status(201).json(workflow);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    logger.error('Create workflow error:', err);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

export default router;
