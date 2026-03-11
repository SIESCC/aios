// ============================================================
// Prompts Library Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/prompts
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '24', category, search, sort = 'rating' } = req.query as Record<string, string>;

  const cacheKey = `prompts:${JSON.stringify(req.query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const pageNum = parseInt(page);
  const limitNum = Math.min(50, parseInt(limit));

  const where: Record<string, unknown> = { status: 'APPROVED' };
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy = sort === 'newest' ? { createdAt: 'desc' as const }
    : sort === 'copies' ? { copyCount: 'desc' as const }
    : { rating: 'desc' as const };

  const [prompts, total] = await Promise.all([
    prisma.prompt.findMany({
      where,
      orderBy,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: { author: { select: { username: true, avatar: true } } },
    }),
    prisma.prompt.count({ where }),
  ]);

  const result = { prompts, pagination: { page: pageNum, limit: limitNum, total } };
  await cache.set(cacheKey, result, 300);
  res.json(result);
});

// GET /api/prompts/categories
router.get('/categories', async (_req: Request, res: Response) => {
  const categories = await prisma.prompt.groupBy({
    by: ['category'],
    where: { status: 'APPROVED' },
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });
  res.json(categories.map((c) => ({ name: c.category, count: c._count.category })));
});

// GET /api/prompts/:slug
router.get('/:slug', async (req: Request, res: Response) => {
  const prompt = await prisma.prompt.findUnique({
    where: { slug: req.params.slug },
    include: { author: { select: { username: true, avatar: true } } },
  });
  if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
  res.json(prompt);
});

// POST /api/prompts — Submit prompt
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    title: z.string().min(5).max(150),
    description: z.string().optional(),
    promptText: z.string().min(10),
    usageExample: z.string().optional(),
    category: z.string(),
    tags: z.array(z.string()).max(5),
    model: z.string().optional(),
  });

  try {
    const data = schema.parse(req.body);
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      + '-' + Date.now().toString(36);

    const prompt = await prisma.prompt.create({
      data: { ...data, slug, authorId: req.user!.id, status: 'PENDING' },
    });

    res.status(201).json(prompt);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

// POST /api/prompts/:id/copy — Track copy count
router.post('/:id/copy', async (req: Request, res: Response) => {
  await prisma.prompt.update({
    where: { id: req.params.id },
    data: { copyCount: { increment: 1 } },
  });
  res.json({ success: true });
});

export default router;
