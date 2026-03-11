// ============================================================
// AIOS Backend — Main Entry Point
// Express.js with modular routing
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { redis } from './lib/redis';
import { initQueues } from './jobs/queue';

// Route imports
import authRoutes from './routes/auth';
import toolsRoutes from './routes/tools';
import modelsRoutes from './routes/models';
import researchRoutes from './routes/research';
import reposRoutes from './routes/repos';
import startupsRoutes from './routes/startups';
import promptsRoutes from './routes/prompts';
import trendsRoutes from './routes/trends';
import searchRoutes from './routes/search';
import adminRoutes from './routes/admin';

config();

const app = express();
const PORT = process.env.PORT || 4000;

// ─────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// ─────────────────────────────────────────────
// General Middleware
// ─────────────────────────────────────────────

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisPing = await redis.ping();
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisPing === 'PONG' ? 'connected' : 'error',
      }
    });
  } catch (err: any) {
    res.status(503).json({ status: 'unhealthy', error: String(err) });
  }
});

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/repos', reposRoutes);
app.use('/api/startups', startupsRoutes);
app.use('/api/prompts', promptsRoutes);
app.use('/api/trends', trendsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);

// ─────────────────────────────────────────────
// 404 & Error Handlers
// ─────────────────────────────────────────────

app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ─────────────────────────────────────────────
// Server Startup
// ─────────────────────────────────────────────

// BigInt serialization fix for JSON.stringify
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function start() {
  try {
    await prisma.$connect();
    logger.info('✅ Connected to PostgreSQL');
    
    // Ensure Redis is connected before proceeding
    if (redis.status !== 'ready' && redis.status !== 'connecting') {
      await redis.connect();
    }
    logger.info('✅ Connected to Redis');
    
    await initQueues();
    logger.info('✅ BullMQ queues initialized');
    
    app.listen(PORT, () => {
      logger.info(`🚀 AIOS API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down...`);
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();


export default app;
