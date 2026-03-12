// ============================================================
// AI Tool Recommendation Engine Routes
// Intelligent tool discovery based on user queries
// ============================================================

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { cache } from '../lib/redis';
import { logger } from '../lib/logger';

const router = Router();

// Category keywords mapping for intelligent matching
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Chatbots': ['chat', 'chatbot', 'conversation', 'assistant', 'qa', 'question'],
  'Code Assistants': ['code', 'coding', 'programming', 'developer', 'development', 'ide', 'editor', 'debug'],
  'Image Generation': ['image', 'photo', 'picture', 'art', 'design', 'illustration', 'visual', 'graphic'],
  'Video': ['video', 'film', 'animation', 'movie', 'clip', 'editing'],
  'Audio': ['audio', 'voice', 'speech', 'music', 'sound', 'podcast', 'transcription'],
  'Writing': ['writing', 'content', 'blog', 'article', 'copy', 'text', 'document', 'essay'],
  'Search': ['search', 'research', 'find', 'discover', 'information', 'knowledge'],
  'Data Analysis': ['data', 'analytics', 'analysis', 'visualization', 'spreadsheet', 'csv'],
  'Marketing': ['marketing', 'seo', 'social media', 'advertising', 'campaign', 'email'],
  'Productivity': ['productivity', 'workflow', 'automation', 'task', 'organize', 'schedule'],
  'Translation': ['translate', 'translation', 'language', 'multilingual', 'localization'],
  'Education': ['education', 'learning', 'teach', 'course', 'tutor', 'study'],
};

function extractRelevantCategories(query: string): string[] {
  const ql = query.toLowerCase();
  const matched: string[] = [];
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => ql.includes(kw))) {
      matched.push(category);
    }
  }
  return matched;
}

function computeRelevanceScore(tool: any, query: string, matchedCategories: string[]): number {
  const ql = query.toLowerCase();
  let score = 0;
  
  // Category match (highest weight)
  if (matchedCategories.includes(tool.category)) score += 40;
  
  // Name match
  if (tool.name.toLowerCase().includes(ql.split(' ').pop() || '')) score += 20;
  
  // Tag match
  const queryWords = ql.split(/\s+/).filter(w => w.length > 2);
  const matchedTags = tool.tags?.filter((tag: string) => 
    queryWords.some(w => tag.toLowerCase().includes(w))
  )?.length || 0;
  score += matchedTags * 10;
  
  // Description match
  const descL = (tool.description || '').toLowerCase();
  queryWords.forEach(w => {
    if (descL.includes(w)) score += 5;
  });
  
  // Trending score boost
  score += (tool.trendingScore || 0) * 0.3;
  
  // Rating boost
  if (tool._count?.ratings > 0) score += Math.min(tool._count.ratings * 2, 10);
  
  // Pricing preference (free tools get slight boost)
  if (tool.pricing === 'Free') score += 5;
  if (tool.pricing === 'Freemium') score += 3;
  
  return Math.round(score * 10) / 10;
}

// GET /api/recommend?q=best AI tools for video editing
router.get('/', async (req: Request, res: Response) => {
  try {
    const { q, limit = '10' } = req.query as Record<string, string>;
    if (!q || q.trim().length < 3) {
      return res.status(400).json({ error: 'Query must be at least 3 characters' });
    }

    const cacheKey = `recommend:${q.toLowerCase().trim()}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const query = q.trim();
    const matchedCategories = extractRelevantCategories(query);
    const limitNum = Math.min(20, parseInt(limit));

    // Build WHERE clause
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const orConditions: any[] = [];

    // Search by matched categories
    if (matchedCategories.length > 0) {
      orConditions.push({ category: { in: matchedCategories } });
    }

    // Search by name match
    queryWords.forEach(word => {
      orConditions.push({ name: { contains: word, mode: 'insensitive' } });
      orConditions.push({ description: { contains: word, mode: 'insensitive' } });
      orConditions.push({ tags: { hasSome: [word] } });
    });

    if (orConditions.length === 0) {
      orConditions.push({ name: { contains: query, mode: 'insensitive' } });
    }

    const tools = await prisma.aiTool.findMany({
      where: {
        status: 'APPROVED',
        OR: orConditions,
      },
      include: { _count: { select: { ratings: true } } },
      take: 50, // Get more to rank
    });

    // Score and rank
    const scored = tools.map(tool => ({
      ...tool,
      relevanceScore: computeRelevanceScore(tool, query, matchedCategories),
    }));

    scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const recommendations = scored.slice(0, limitNum);

    const result = {
      query,
      matchedCategories,
      recommendations,
      totalFound: scored.length,
    };

    await cache.set(cacheKey, result, 300);
    res.json(result);
  } catch (err) {
    logger.error('Recommendation error:', err);
    res.status(500).json({ error: 'Recommendation failed' });
  }
});

export default router;
