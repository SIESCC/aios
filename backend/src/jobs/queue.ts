// ============================================================
// BullMQ Queue Definitions
// Manages job queues for all automation pipelines
// ============================================================

import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

// BullMQ needs a dedicated connection to avoid conflicts with subscriber/blocking commands
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Critical for BullMQ
});

// ── Queue Definitions ──────────────────────────────────────

export const queues = {
  github: new Queue('github-scraper', { connection: connection as any }),
  arxiv: new Queue('arxiv-scraper', { connection: connection as any }),
  news: new Queue('news-scraper', { connection: connection as any }),
  tools: new Queue('tools-scraper', { connection: connection as any }),
  trending: new Queue('trending-calculator', { connection: connection as any }),
  summarizer: new Queue('ai-summarizer', { connection: connection as any }),
};

// ── Queue Initialization ───────────────────────────────────

export async function initQueues() {
  // Schedule recurring jobs
  await queues.github.add('fetch-trending', {}, {
    repeat: { pattern: process.env.GITHUB_SCRAPE_CRON || '0 */6 * * *' },
    removeOnComplete: 10,
    removeOnFail: 5,
  });

  await queues.arxiv.add('fetch-papers', {}, {
    repeat: { pattern: process.env.ARXIV_SCRAPE_CRON || '0 */12 * * *' },
    removeOnComplete: 10,
    removeOnFail: 5,
  });

  await queues.news.add('fetch-news', {}, {
    repeat: { pattern: process.env.NEWS_SCRAPE_CRON || '0 */3 * * *' },
    removeOnComplete: 10,
    removeOnFail: 5,
  });

  await queues.trending.add('recalculate-scores', {}, {
    repeat: { pattern: '0 */1 * * *' }, // every hour
    removeOnComplete: 5,
    removeOnFail: 5,
  });

  logger.info('✅ Queues scheduled');
}

// ── Queue Stats Helper ─────────────────────────────────────

export async function getQueueStats() {
  const stats: Record<string, unknown> = {};
  for (const [name, queue] of Object.entries(queues)) {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);
    stats[name] = { waiting, active, completed, failed };
  }
  return stats;
}
