"use strict";
// ============================================================
// Prisma Client Singleton
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ?? new client_1.PrismaClient({
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
    ],
});
if (process.env.NODE_ENV !== 'production') {
    exports.prisma.$on('query', (e) => {
        if (process.env.LOG_QUERIES === 'true') {
            logger_1.logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`);
        }
    });
}
exports.prisma.$on('error', (e) => {
    logger_1.logger.error('Prisma error:', e.message);
});
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = exports.prisma;
}
//# sourceMappingURL=prisma.js.map