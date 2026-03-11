// ============================================================
// Prisma Client Singleton
// ============================================================

import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

if (process.env.NODE_ENV !== 'production') {
  (prisma as any).$on('query', (e: any) => {
    if (process.env.LOG_QUERIES === 'true') {
      logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`);
    }
  });
}

(prisma as any).$on('error', (e: any) => {
  logger.error('Prisma error:', e.message);
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
