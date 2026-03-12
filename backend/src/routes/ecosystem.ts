// ============================================================
// AI Ecosystem Map Routes
// Returns nodes and edges for interactive graph visualization
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import { logger } from '../lib/logger';

const router = Router();

// GET /api/ecosystem/graph — Full graph data for visualization
router.get('/graph', async (_req: Request, res: Response) => {
  try {
    const cached = await cache.get('ecosystem:graph');
    if (cached) return res.json(cached);

    // Fetch nodes from all entity types
    const [tools, models, startups, papers, repos, relations] = await Promise.all([
      prisma.aiTool.findMany({
        where: { status: 'APPROVED' },
        select: { id: true, name: true, category: true, trendingScore: true, slug: true },
        orderBy: { trendingScore: 'desc' },
        take: 30,
      }),
      prisma.aiModel.findMany({
        select: { id: true, name: true, modelType: true, organization: true, trendingScore: true, slug: true },
        orderBy: { trendingScore: 'desc' },
        take: 20,
      }),
      prisma.aiStartup.findMany({
        select: { id: true, name: true, industry: true, trendingScore: true, slug: true },
        orderBy: { trendingScore: 'desc' },
        take: 15,
      }),
      prisma.researchPaper.findMany({
        select: { id: true, title: true, category: true, trendingScore: true },
        orderBy: { trendingScore: 'desc' },
        take: 10,
      }),
      prisma.gitHubRepo.findMany({
        select: { id: true, fullName: true, stars: true, language: true, trendingScore: true },
        orderBy: { trendingScore: 'desc' },
        take: 15,
      }),
      prisma.ecosystemRelation.findMany({
        take: 200,
      }),
    ]);

    // Build nodes with types
    const nodes = [
      ...tools.map(t => ({ id: t.id, name: t.name, type: 'tool', group: t.category, score: t.trendingScore, slug: t.slug })),
      ...models.map(m => ({ id: m.id, name: m.name, type: 'model', group: m.modelType, score: m.trendingScore, slug: m.slug })),
      ...startups.map(s => ({ id: s.id, name: s.name, type: 'startup', group: s.industry || 'AI', score: s.trendingScore, slug: s.slug })),
      ...papers.map(p => ({ id: p.id, name: p.title.slice(0, 40), type: 'paper', group: p.category || 'Research', score: p.trendingScore })),
      ...repos.map(r => ({ id: r.id, name: r.fullName, type: 'repo', group: r.language || 'Python', score: r.trendingScore })),
    ];

    // Build edges from relationships, with auto-generated edges based on categories/organizations
    const edges = [
      ...relations.map(r => ({
        source: r.sourceId,
        target: r.targetId,
        type: r.relationshipType,
        strength: r.strength,
      })),
    ];

    // Auto-generate edges: connect models to tools from same org
    const modelOrgMap = new Map<string, string[]>();
    models.forEach(m => {
      const existing = modelOrgMap.get(m.organization.toLowerCase()) || [];
      existing.push(m.id);
      modelOrgMap.set(m.organization.toLowerCase(), existing);
    });

    // Connect startups to their tools/models by name matching
    startups.forEach(s => {
      const nameL = s.name.toLowerCase();
      tools.forEach(t => {
        if (t.name.toLowerCase().includes(nameL) || nameL.includes(t.name.toLowerCase().split(' ')[0])) {
          edges.push({ source: s.id, target: t.id, type: 'owns', strength: 0.9 });
        }
      });
      const orgModels = modelOrgMap.get(nameL);
      if (orgModels) {
        orgModels.forEach(mid => {
          edges.push({ source: s.id, target: mid, type: 'owns', strength: 0.9 });
        });
      }
    });

    // Connect tools in same category
    const catToolMap = new Map<string, string[]>();
    tools.forEach(t => {
      const existing = catToolMap.get(t.category) || [];
      existing.push(t.id);
      catToolMap.set(t.category, existing);
    });
    catToolMap.forEach((ids) => {
      for (let i = 0; i < ids.length && i < 4; i++) {
        for (let j = i + 1; j < ids.length && j < 5; j++) {
          edges.push({ source: ids[i], target: ids[j], type: 'competes', strength: 0.3 });
        }
      }
    });

    const result = { nodes, edges, stats: { nodes: nodes.length, edges: edges.length } };
    await cache.set('ecosystem:graph', result, 600);
    res.json(result);
  } catch (err) {
    logger.error('Ecosystem graph error:', err);
    res.status(500).json({ error: 'Failed to build ecosystem graph' });
  }
});

// GET /api/ecosystem/stats — Quick ecosystem summary
router.get('/stats', async (_req: Request, res: Response) => {
  const cached = await cache.get('ecosystem:stats');
  if (cached) return res.json(cached);

  const [tools, models, startups, papers, repos, relations] = await Promise.all([
    prisma.aiTool.count({ where: { status: 'APPROVED' } }),
    prisma.aiModel.count(),
    prisma.aiStartup.count(),
    prisma.researchPaper.count(),
    prisma.gitHubRepo.count(),
    prisma.ecosystemRelation.count(),
  ]);

  const result = { tools, models, startups, papers, repos, relations };
  await cache.set('ecosystem:stats', result, 300);
  res.json(result);
});

export default router;
