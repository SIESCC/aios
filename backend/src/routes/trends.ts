// ============================================================
// Trends Dashboard Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';

const router = Router();

// GET /api/trends/overview — Main dashboard stats
router.get('/overview', async (_req: Request, res: Response) => {
  const cacheKey = 'trends:overview';
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const [
    totalTools, totalModels, totalPapers, totalRepos,
    trendingTools, trendingRepos, latestPapers,
  ] = await Promise.all([
    prisma.aiTool.count({ where: { status: 'APPROVED' } }),
    prisma.aiModel.count(),
    prisma.researchPaper.count(),
    prisma.gitHubRepo.count(),
    prisma.aiTool.findMany({
      where: { status: 'APPROVED' },
      orderBy: { trendingScore: 'desc' },
      take: 5,
      select: { id: true, name: true, slug: true, trendingScore: true, weeklyGrowth: true, category: true, logoUrl: true },
    }),
    prisma.gitHubRepo.findMany({
      orderBy: { weeklyGrowth: 'desc' },
      take: 5,
      select: { id: true, fullName: true, stars: true, weeklyGrowth: true, language: true, repoUrl: true },
    }),
    prisma.researchPaper.findMany({
      orderBy: { publicationDate: 'desc' },
      take: 5,
      select: { id: true, title: true, authors: true, publicationDate: true, category: true },
    }),
  ]);

  const result = {
    stats: { totalTools, totalModels, totalPapers, totalRepos },
    trendingTools,
    trendingRepos,
    latestPapers,
  };

  await cache.set(cacheKey, result, 300);
  res.json(result);
});

// GET /api/trends/categories — Category trend data
router.get('/categories', async (_req: Request, res: Response) => {
  const cached = await cache.get('trends:categories');
  if (cached) return res.json(cached);

  const categories = await prisma.aiTool.groupBy({
    by: ['category'],
    where: { status: 'APPROVED' },
    _count: { category: true },
    _avg: { trendingScore: true },
    orderBy: { _count: { category: 'desc' } },
  });

  const result = categories.map((c) => ({
    category: c.category,
    count: c._count.category,
    avgTrending: Math.round((c._avg.trendingScore || 0) * 10) / 10,
  }));

  await cache.set('trends:categories', result, 600);
  res.json(result);
});

// GET /api/trends/history — Time series data
router.get('/history', async (req: Request, res: Response) => {
  const { entityType = 'tool', days = '30' } = req.query as Record<string, string>;
  const daysAgo = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

  const data = await prisma.trendData.findMany({
    where: {
      entityType,
      recordedAt: { gte: daysAgo },
    },
    orderBy: { recordedAt: 'asc' },
    take: 1000,
  });

  res.json(data);
});

// GET /api/trends/news — AI news feed
router.get('/news', async (req: Request, res: Response) => {
  const { limit = '10' } = req.query as Record<string, string>;
  const cached = await cache.get(`trends:news:${limit}`);
  if (cached) return res.json(cached);

  const news = await prisma.aiNewsItem.findMany({
    orderBy: { publishedAt: 'desc' },
    take: parseInt(limit),
  });

  await cache.set(`trends:news:${limit}`, news, 300);
  res.json(news);
});

export default router;
