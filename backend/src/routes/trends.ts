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

// GET /api/trends/growth-analytics — Comprehensive trend signals
router.get('/growth-analytics', async (_req: Request, res: Response) => {
  const cached = await cache.get('trends:growth-analytics');
  if (cached) return res.json(cached);

  const [
    fastestGrowingRepos, topTrendingTools,
    mostActiveCategories, recentStartupFunding,
    recentPapers, totalStartups,
  ] = await Promise.all([
    // Fastest growing GitHub repos
    prisma.gitHubRepo.findMany({
      orderBy: { weeklyGrowth: 'desc' },
      take: 10,
      select: { id: true, fullName: true, stars: true, weeklyGrowth: true, language: true, repoUrl: true, description: true },
    }),
    // Top trending AI tools this week
    prisma.aiTool.findMany({
      where: { status: 'APPROVED' },
      orderBy: { trendingScore: 'desc' },
      take: 10,
      select: { id: true, name: true, slug: true, category: true, trendingScore: true, weeklyGrowth: true, logoUrl: true, tagline: true },
    }),
    // Most active AI categories
    prisma.aiTool.groupBy({
      by: ['category'],
      where: { status: 'APPROVED' },
      _count: { category: true },
      _avg: { trendingScore: true, weeklyGrowth: true },
      orderBy: { _avg: { trendingScore: 'desc' } },
      take: 10,
    }),
    // Recent startup funding events
    prisma.aiStartup.findMany({
      where: { fundingDate: { not: null } },
      orderBy: { fundingDate: 'desc' },
      take: 10,
      select: { id: true, name: true, slug: true, industry: true, fundingRound: true, fundingAmount: true, fundingDate: true, country: true },
    }),
    // Recent research papers
    prisma.researchPaper.findMany({
      orderBy: { publicationDate: 'desc' },
      take: 10,
      select: { id: true, title: true, category: true, publicationDate: true, trendingScore: true, citationCount: true },
    }),
    prisma.aiStartup.count(),
  ]);

  const result = {
    fastestGrowingRepos,
    topTrendingTools,
    mostActiveCategories: mostActiveCategories.map(c => ({
      category: c.category,
      count: c._count.category,
      avgTrending: Math.round((c._avg.trendingScore || 0) * 10) / 10,
      avgWeeklyGrowth: Math.round((c._avg.weeklyGrowth || 0) * 10) / 10,
    })),
    recentStartupFunding,
    recentPapers,
    totalStartups,
  };

  await cache.set('trends:growth-analytics', result, 300);
  res.json(result);
});

// GET /api/trends/industry-dashboard — Global AI industry metrics
router.get('/industry-dashboard', async (_req: Request, res: Response) => {
  const cached = await cache.get('trends:industry-dashboard');
  if (cached) return res.json(cached);

  const [
    totalTools, totalModels, totalPapers, totalRepos,
    totalStartups, totalNews, totalWorkflows,
    toolsByCategory, modelsByType, startupsByCountry,
    topInvestors,
  ] = await Promise.all([
    prisma.aiTool.count({ where: { status: 'APPROVED' } }),
    prisma.aiModel.count(),
    prisma.researchPaper.count(),
    prisma.gitHubRepo.count(),
    prisma.aiStartup.count(),
    prisma.aiNewsItem.count(),
    prisma.workflow.count(),
    prisma.aiTool.groupBy({
      by: ['category'],
      where: { status: 'APPROVED' },
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: 12,
    }),
    prisma.aiModel.groupBy({
      by: ['modelType'],
      _count: { modelType: true },
      orderBy: { _count: { modelType: 'desc' } },
    }),
    prisma.aiStartup.groupBy({
      by: ['country'],
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    }),
    prisma.aiStartup.findMany({
      where: { investors: { isEmpty: false } },
      select: { investors: true },
    }),
  ]);

  // Aggregate top investors
  const investorCount: Record<string, number> = {};
  topInvestors.forEach(s => {
    s.investors.forEach(inv => {
      investorCount[inv] = (investorCount[inv] || 0) + 1;
    });
  });
  const topInvestorsList = Object.entries(investorCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const result = {
    overview: { totalTools, totalModels, totalPapers, totalRepos, totalStartups, totalNews, totalWorkflows },
    toolsByCategory: toolsByCategory.map(c => ({ category: c.category, count: c._count.category })),
    modelsByType: modelsByType.map(m => ({ type: m.modelType, count: m._count.modelType })),
    startupsByCountry: startupsByCountry.map(s => ({ country: s.country || 'Unknown', count: s._count.country })),
    topInvestors: topInvestorsList,
  };

  await cache.set('trends:industry-dashboard', result, 600);
  res.json(result);
});

export default router;

