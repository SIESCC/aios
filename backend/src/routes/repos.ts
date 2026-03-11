// ============================================================
// GitHub Repos Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';

const router = Router();

// GET /api/repos
router.get('/', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', language, sort = 'stars' } = req.query as Record<string, string>;

  const cacheKey = `repos:${JSON.stringify(req.query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const pageNum = parseInt(page);
  const limitNum = Math.min(50, parseInt(limit));

  const where: Record<string, unknown> = {};
  if (language) where.language = { equals: language, mode: 'insensitive' };

  const orderBy = sort === 'growth' ? { weeklyGrowth: 'desc' as const }
    : sort === 'trending' ? { trendingScore: 'desc' as const }
    : sort === 'forks' ? { forks: 'desc' as const }
    : { stars: 'desc' as const };

  const [repos, total] = await Promise.all([
    prisma.gitHubRepo.findMany({
      where, orderBy, skip: (pageNum - 1) * limitNum, take: limitNum,
    }),
    prisma.gitHubRepo.count({ where }),
  ]);

  const result = { repos, pagination: { page: pageNum, limit: limitNum, total } };
  await cache.set(cacheKey, result, 300);
  res.json(result);
});

// GET /api/repos/trending
router.get('/trending', async (_req: Request, res: Response) => {
  const cached = await cache.get('repos:trending');
  if (cached) return res.json(cached);

  const repos = await prisma.gitHubRepo.findMany({
    orderBy: { weeklyGrowth: 'desc' },
    take: 10,
  });

  await cache.set('repos:trending', repos, 600);
  res.json(repos);
});

export default router;
