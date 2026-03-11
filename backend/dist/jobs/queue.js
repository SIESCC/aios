"use strict";
// ============================================================
// BullMQ Queue Definitions
// Manages job queues for all automation pipelines
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queues = void 0;
exports.initQueues = initQueues;
exports.getQueueStats = getQueueStats;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../lib/logger");
// BullMQ needs a dedicated connection to avoid conflicts with subscriber/blocking commands
const connection = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Critical for BullMQ
});
// ── Queue Definitions ──────────────────────────────────────
exports.queues = {
    github: new bullmq_1.Queue('github-scraper', { connection: connection }),
    arxiv: new bullmq_1.Queue('arxiv-scraper', { connection: connection }),
    news: new bullmq_1.Queue('news-scraper', { connection: connection }),
    tools: new bullmq_1.Queue('tools-scraper', { connection: connection }),
    trending: new bullmq_1.Queue('trending-calculator', { connection: connection }),
    summarizer: new bullmq_1.Queue('ai-summarizer', { connection: connection }),
};
// ── Queue Initialization ───────────────────────────────────
async function initQueues() {
    // Schedule recurring jobs
    await exports.queues.github.add('fetch-trending', {}, {
        repeat: { pattern: process.env.GITHUB_SCRAPE_CRON || '0 */6 * * *' },
        removeOnComplete: 10,
        removeOnFail: 5,
    });
    await exports.queues.arxiv.add('fetch-papers', {}, {
        repeat: { pattern: process.env.ARXIV_SCRAPE_CRON || '0 */12 * * *' },
        removeOnComplete: 10,
        removeOnFail: 5,
    });
    await exports.queues.news.add('fetch-news', {}, {
        repeat: { pattern: process.env.NEWS_SCRAPE_CRON || '0 */3 * * *' },
        removeOnComplete: 10,
        removeOnFail: 5,
    });
    await exports.queues.trending.add('recalculate-scores', {}, {
        repeat: { pattern: '0 */1 * * *' }, // every hour
        removeOnComplete: 5,
        removeOnFail: 5,
    });
    logger_1.logger.info('✅ Queues scheduled');
}
// ── Queue Stats Helper ─────────────────────────────────────
async function getQueueStats() {
    const stats = {};
    for (const [name, queue] of Object.entries(exports.queues)) {
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
//# sourceMappingURL=queue.js.map