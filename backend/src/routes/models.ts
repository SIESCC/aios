// ============================================================
// AI Models Leaderboard Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import { ModelType } from '@prisma/client';

const router = Router();

// GET /api/models — Leaderboard with filtering
router.get('/', async (req: Request, res: Response) => {
  const { type, org, sort = 'trending', page = '1', limit = '20' } = req.query as Record<string, string>;

  const cacheKey = `models:${JSON.stringify(req.query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const where: Record<string, unknown> = {};
  if (type) where.modelType = type.toUpperCase();
  if (org) where.organization = { contains: org, mode: 'insensitive' };

  const pageNum = parseInt(page);
  const limitNum = Math.min(50, parseInt(limit));

  const orderBy = sort === 'trending' ? { trendingScore: 'desc' as const }
    : sort === 'newest' ? { releaseDate: 'desc' as const }
    : { trendingScore: 'desc' as const };

  const [models, total] = await Promise.all([
    prisma.aiModel.findMany({ where, orderBy, skip: (pageNum - 1) * limitNum, take: limitNum }),
    prisma.aiModel.count({ where }),
  ]);

  const result = { models, pagination: { page: pageNum, limit: limitNum, total } };
  await cache.set(cacheKey, result, 300);
  res.json(result);
});

// GET /api/models/leaderboard/:type — Type-specific leaderboard
router.get('/leaderboard/:type', async (req: Request, res: Response) => {
  const { type } = req.params;
  const validTypes = ['LLM', 'CODE', 'IMAGE', 'AUDIO', 'VIDEO', 'MULTIMODAL'];
  if (!validTypes.includes(type.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid model type' });
  }

  const cacheKey = `models:leaderboard:${type}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const models = await prisma.aiModel.findMany({
    where: { modelType: type.toUpperCase() as ModelType },
    orderBy: { trendingScore: 'desc' },
    take: 20,
  });

  await cache.set(cacheKey, models, 600);
  res.json(models);
});

// GET /api/models/:slug
router.get('/:slug', async (req: Request, res: Response) => {
  const model = await prisma.aiModel.findUnique({ where: { slug: req.params.slug } });
  if (!model) return res.status(404).json({ error: 'Model not found' });
  res.json(model);
});

export default router;
