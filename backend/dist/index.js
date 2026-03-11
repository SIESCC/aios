"use strict";
// ============================================================
// AIOS Backend — Main Entry Point
// Express.js with modular routing
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = require("dotenv");
const logger_1 = require("./lib/logger");
const prisma_1 = require("./lib/prisma");
const redis_1 = require("./lib/redis");
const queue_1 = require("./jobs/queue");
// Route imports
const auth_1 = __importDefault(require("./routes/auth"));
const tools_1 = __importDefault(require("./routes/tools"));
const models_1 = __importDefault(require("./routes/models"));
const research_1 = __importDefault(require("./routes/research"));
const repos_1 = __importDefault(require("./routes/repos"));
const startups_1 = __importDefault(require("./routes/startups"));
const prompts_1 = __importDefault(require("./routes/prompts"));
const trends_1 = __importDefault(require("./routes/trends"));
const search_1 = __importDefault(require("./routes/search"));
const admin_1 = __importDefault(require("./routes/admin"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// ─────────────────────────────────────────────
// Security Middleware
// ─────────────────────────────────────────────
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Allowed static origins
        const allowedOrigins = [
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            'http://localhost:3000',
        ];
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Global rate limiter
const globalLimiter = (0, express_rate_limit_1.default)({
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
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)('combined', {
    stream: { write: (msg) => logger_1.logger.http(msg.trim()) },
}));
// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get('/health', async (_req, res) => {
    try {
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        const redisPing = await redis_1.redis.ping();
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                redis: redisPing === 'PONG' ? 'connected' : 'error',
            }
        });
    }
    catch (err) {
        res.status(503).json({ status: 'unhealthy', error: String(err) });
    }
});
// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/tools', tools_1.default);
app.use('/api/models', models_1.default);
app.use('/api/research', research_1.default);
app.use('/api/repos', repos_1.default);
app.use('/api/startups', startups_1.default);
app.use('/api/prompts', prompts_1.default);
app.use('/api/trends', trends_1.default);
app.use('/api/search', search_1.default);
app.use('/api/admin', admin_1.default);
// ─────────────────────────────────────────────
// 404 & Error Handlers
// ─────────────────────────────────────────────
app.use('*', (_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.use((err, _req, res, _next) => {
    logger_1.logger.error(err.stack || err.message);
    res.status(500).json({ error: 'Internal server error' });
});
// ─────────────────────────────────────────────
// Server Startup
// ─────────────────────────────────────────────
// BigInt serialization fix for JSON.stringify
BigInt.prototype.toJSON = function () {
    return this.toString();
};
async function start() {
    try {
        await prisma_1.prisma.$connect();
        logger_1.logger.info('✅ Connected to PostgreSQL');
        // Ensure Redis is connected before proceeding
        if (redis_1.redis.status !== 'ready' && redis_1.redis.status !== 'connecting') {
            await redis_1.redis.connect();
        }
        logger_1.logger.info('✅ Connected to Redis');
        await (0, queue_1.initQueues)();
        logger_1.logger.info('✅ BullMQ queues initialized');
        app.listen(PORT, () => {
            logger_1.logger.info(`🚀 AIOS API running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Graceful shutdown
const shutdown = async (signal) => {
    logger_1.logger.info(`${signal} received, shutting down...`);
    await prisma_1.prisma.$disconnect();
    redis_1.redis.disconnect();
    process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
start();
exports.default = app;
//# sourceMappingURL=index.js.map