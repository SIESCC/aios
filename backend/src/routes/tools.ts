// ============================================================
// AI Tools Routes
// Core module: Discovery + Comparison
// ============================================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import { authenticate, optionalAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { logger } from '../lib/logger';

const router = Router();

const CACHE_TTL = 300; // 5 minutes

// ─────────────────────────────────────────────
// GET /api/tools — List & filter tools
// ─────────────────────────────────────────────
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = '1',
      limit = '24',
      category,
      pricing,
      search,
      sort = 'trending',
      tags,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(48, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const cacheKey = `tools:list:${JSON.stringify(req.query)}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const where: Record<string, unknown> = { status: 'APPROVED' };
    if (category) where.category = category;
    if (pricing) where.pricing = pricing;
    if (tags) where.tags = { hasSome: tags.split(',') };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    const orderBy = sort === 'trending' ? { trendingScore: 'desc' as const }
      : sort === 'newest' ? { createdAt: 'desc' as const }
      : sort === 'rating' ? { ratings: { _count: 'desc' as const } }
      : { trendingScore: 'desc' as const };

    const [tools, total] = await Promise.all([
      prisma.aiTool.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          _count: { select: { ratings: true, comments: true } },
        },
      }),
      prisma.aiTool.count({ where }),
    ]);

    const result = {
      tools,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };

    await cache.set(cacheKey, result, CACHE_TTL);
    res.json(result);
  } catch (err) {
    logger.error('Tools list error:', err);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

// GET /api/tools/trending
router.get('/trending', async (_req: Request, res: Response) => {
  const cached = await cache.get('tools:trending');
  if (cached) return res.json(cached);

  const tools = await prisma.aiTool.findMany({
    where: { status: 'APPROVED' },
    orderBy: { trendingScore: 'desc' },
    take: 12,
    select: {
      id: true, slug: true, name: true, tagline: true, category: true,
      logoUrl: true, pricing: true, trendingScore: true, weeklyGrowth: true,
    },
  });

  await cache.set('tools:trending', tools, CACHE_TTL);
  res.json(tools);
});

// GET /api/tools/categories
router.get('/categories', async (_req: Request, res: Response) => {
  const cached = await cache.get('tools:categories');
  if (cached) return res.json(cached);

  const categories = await prisma.aiTool.groupBy({
    by: ['category'],
    where: { status: 'APPROVED' },
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
  });

  const result = categories.map((c) => ({
    name: c.category,
    count: c._count.category,
  }));

  await cache.set('tools:categories', result, 600);
  res.json(result);
});

// GET /api/tools/compare — Compare multiple tools
router.get('/compare/tools', async (req: Request, res: Response) => {
  const { ids } = req.query as { ids: string };
  if (!ids) return res.status(400).json({ error: 'IDs required' });

  const idList = ids.split(',').slice(0, 5); // max 5 tools
  const tools = await prisma.aiTool.findMany({
    where: { id: { in: idList }, status: 'APPROVED' },
    include: { _count: { select: { ratings: true } } },
  });

  res.json(tools);
});

// GET /api/tools/:slug — Single tool
router.get('/:slug', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tool = await prisma.aiTool.findUnique({
      where: { slug: req.params.slug },
      include: {
        ratings: {
          include: { user: { select: { username: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        comments: {
          include: { user: { select: { username: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: { select: { ratings: true, comments: true, bookmarks: true } },
      },
    });

    if (!tool) return res.status(404).json({ error: 'Tool not found' });

    // Track view (simple protection: only increment if not crawler/bot)
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    const isBot = /bot|spider|crawl|slurp|emul|phantom/i.test(userAgent);
    
    if (!isBot) {
      // In production, use a Redis-based per-IP/User debounce here
      prisma.aiTool.update({
        where: { id: tool.id },
        data: { totalViews: { increment: 1 } },
      }).catch(err => logger.error('View count increment failed', err));
    }

    res.json(tool);
  } catch (err) {
    logger.error('Tool detail error:', err);
    res.status(500).json({ error: 'Failed to fetch tool' });
  }
});

// POST /api/tools — Submit new tool (authenticated)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(100),
      tagline: z.string().max(200),
      description: z.string().min(20),
      website: z.string().url(),
      category: z.string(),
      pricing: z.string(),
      tags: z.array(z.string()).max(10),
      logoUrl: z.string().url().optional(),
    });

    const data = schema.parse(req.body);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const tool = await prisma.aiTool.create({
      data: { ...data, slug, status: 'PENDING' },
    });

    res.status(201).json(tool);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ error: 'Failed to create tool' });
  }
});


// POST /api/tools/:id/rate
router.post('/:id/rate', authenticate, async (req: AuthRequest, res: Response) => {
  const { rating, review } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be 1-5' });
  }

  const existing = await prisma.toolRating.findUnique({
    where: { userId_toolId: { userId: req.user!.id, toolId: req.params.id } },
  });

  const result = existing
    ? await prisma.toolRating.update({
        where: { id: existing.id },
        data: { rating, review },
      })
    : await prisma.toolRating.create({
        data: { userId: req.user!.id, toolId: req.params.id, rating, review },
      });

  await cache.invalidatePattern(`tools:*`);
  res.json(result);
});

export default router;
