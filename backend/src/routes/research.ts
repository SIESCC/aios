// ============================================================
// Research Papers Routes
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';

const router = Router();

// GET /api/research
router.get('/', async (req: Request, res: Response) => {
  const { page = '1', limit = '20', category, search, sort = 'newest' } = req.query as Record<string, string>;

  const cacheKey = `research:${JSON.stringify(req.query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return res.json(cached);

  const pageNum = parseInt(page);
  const limitNum = Math.min(50, parseInt(limit));

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { abstract: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy = sort === 'trending' ? { trendingScore: 'desc' as const }
    : sort === 'cited' ? { citationCount: 'desc' as const }
    : { publicationDate: 'desc' as const };

  const [papers, total] = await Promise.all([
    prisma.researchPaper.findMany({
      where,
      orderBy,
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      select: {
        id: true, title: true, authors: true, abstract: true, aiSummary: true,
        source: true, category: true, tags: true, publicationDate: true, link: true,
        citationCount: true, trendingScore: true, createdAt: true,
      },
    }),
    prisma.researchPaper.count({ where }),
  ]);

  const result = { papers, pagination: { page: pageNum, limit: limitNum, total } };
  await cache.set(cacheKey, result, 300);
  res.json(result);
});

// GET /api/research/latest — For homepage
router.get('/latest', async (_req: Request, res: Response) => {
  const cached = await cache.get('research:latest');
  if (cached) return res.json(cached);

  const papers = await prisma.researchPaper.findMany({
    orderBy: { publicationDate: 'desc' },
    take: 6,
    select: {
      id: true, title: true, authors: true, aiSummary: true,
      publicationDate: true, link: true, category: true,
    },
  });

  await cache.set('research:latest', papers, 600);
  res.json(papers);
});

// GET /api/research/:id
router.get('/:id', async (req: Request, res: Response) => {
  const paper = await prisma.researchPaper.findUnique({ where: { id: req.params.id } });
  if (!paper) return res.status(404).json({ error: 'Paper not found' });
  res.json(paper);
});

export default router;
