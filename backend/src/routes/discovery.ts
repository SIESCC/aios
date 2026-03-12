// ============================================================
// AI Tool Auto-Discovery Engine Routes
// Manages the discovery queue and auto-classification
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import { authenticate, requireAdmin } from '../middleware/auth';
import { logger } from '../lib/logger';

const router = Router();

// GET /api/discovery/queue — View discovery queue (admin)
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', processed = 'false' } = req.query as Record<string, string>;
    
    const pageNum = parseInt(page);
    const limitNum = Math.min(50, parseInt(limit));
    const isProcessed = processed === 'true';

    const [items, total] = await Promise.all([
      prisma.discoveryQueue.findMany({
        where: { processed: isProcessed },
        orderBy: { score: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.discoveryQueue.count({ where: { processed: isProcessed } }),
    ]);

    res.json({ items, pagination: { page: pageNum, limit: limitNum, total } });
  } catch (err) {
    logger.error('Discovery queue error:', err);
    res.status(500).json({ error: 'Failed to fetch discovery queue' });
  }
});

// GET /api/discovery/stats — Discovery statistics
router.get('/stats', async (_req: Request, res: Response) => {
  const cached = await cache.get('discovery:stats');
  if (cached) return res.json(cached);

  const [total, pending, processed, sources] = await Promise.all([
    prisma.discoveryQueue.count(),
    prisma.discoveryQueue.count({ where: { processed: false } }),
    prisma.discoveryQueue.count({ where: { processed: true } }),
    prisma.discoveryQueue.groupBy({
      by: ['source'],
      _count: { source: true },
      orderBy: { _count: { source: 'desc' } },
    }),
  ]);

  const result = {
    total,
    pending,
    processed,
    sources: sources.map(s => ({ source: s.source, count: s._count.source })),
  };

  await cache.set('discovery:stats', result, 300);
  res.json(result);
});

// POST /api/discovery/approve/:id — Approve a discovered tool into ai_tools
router.post('/approve/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const item = await prisma.discoveryQueue.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Discovery item not found' });

    const slug = item.toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Create AI tool from discovery
    const tool = await prisma.aiTool.create({
      data: {
        name: item.toolName,
        slug: slug + '-' + Date.now().toString(36),
        tagline: item.description?.slice(0, 200) || item.toolName,
        description: item.description || item.toolName,
        website: item.toolUrl,
        category: item.category || 'Other',
        status: 'PENDING',
        sourceUrl: item.toolUrl,
        trendingScore: item.score,
      },
    });

    // Mark as processed
    await prisma.discoveryQueue.update({
      where: { id: item.id },
      data: { processed: true, processedAt: new Date() },
    });

    await cache.invalidatePattern('discovery:*');
    await cache.invalidatePattern('tools:*');
    res.json(tool);
  } catch (err) {
    logger.error('Discovery approve error:', err);
    res.status(500).json({ error: 'Failed to approve discovery' });
  }
});

// POST /api/discovery/dismiss/:id — Dismiss a discovered tool
router.post('/dismiss/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.discoveryQueue.update({
      where: { id: req.params.id },
      data: { processed: true, processedAt: new Date() },
    });
    await cache.invalidatePattern('discovery:*');
    res.json({ success: true });
  } catch (err) {
    logger.error('Discovery dismiss error:', err);
    res.status(500).json({ error: 'Failed to dismiss' });
  }
});

export default router;
