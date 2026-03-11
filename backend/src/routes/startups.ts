// ============================================================
// AI Startups Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';

const router = Router();

// GET /api/startups
router.get('/', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', country, industry, round, sort = 'newest' } = req.query as Record<string, string>;

  const cacheKey = `startups:${JSON.stringify(req.query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const pageNum = parseInt(page);
  const limitNum = Math.min(50, parseInt(limit));

  const where: Record<string, unknown> = {};
  if (country) where.country = { equals: country, mode: 'insensitive' };
  if (industry) where.industry = { equals: industry, mode: 'insensitive' };
  if (round) where.fundingRound = round.toUpperCase();

  const orderBy = sort === 'funding' ? { fundingAmount: 'desc' as const }
    : sort === 'trending' ? { trendingScore: 'desc' as const }
    : { fundingDate: 'desc' as const };

  const [startups, total] = await Promise.all([
    prisma.aiStartup.findMany({
      where, orderBy, skip: (pageNum - 1) * limitNum, take: limitNum,
    }),
    prisma.aiStartup.count({ where }),
  ]);

  const result = { startups, pagination: { page: pageNum, limit: limitNum, total } };
  await cache.set(cacheKey, result, 300);
  res.json(result);
});

// GET /api/startups/latest-funding
router.get('/latest-funding', async (_req: Request, res: Response) => {
  const cached = await cache.get('startups:latest-funding');
  if (cached) return res.json(cached);

  const startups = await prisma.aiStartup.findMany({
    where: { fundingDate: { not: null } },
    orderBy: { fundingDate: 'desc' },
    take: 8,
  });

  await cache.set('startups:latest-funding', startups, 600);
  res.json(startups);
});

// GET /api/startups/:slug
router.get('/:slug', async (req: Request, res: Response) => {
  const startup = await prisma.aiStartup.findUnique({ where: { slug: req.params.slug } });
  if (!startup) return res.status(404).json({ error: 'Startup not found' });
  res.json(startup);
});

export default router;
