"use strict";
// ============================================================
// Auth Routes — Register, Login, Refresh, Me
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../lib/logger");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    password: zod_1.z.string().min(8),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
function generateTokens(payload) {
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
}
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);
        const existing = await prisma_1.prisma.user.findFirst({
            where: { OR: [{ email: data.email }, { username: data.username }] },
        });
        if (existing) {
            return res.status(409).json({ error: 'Email or username already taken' });
        }
        const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
        const user = await prisma_1.prisma.user.create({
            data: { email: data.email, username: data.username, passwordHash },
            select: { id: true, email: true, username: true, role: true, createdAt: true },
        });
        const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
        // Store refresh token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.refreshToken.create({
            data: { token: tokens.refreshToken, userId: user.id, expiresAt },
        });
        res.status(201).json({ user, ...tokens });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        logger_1.logger.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
        if (!user || !(await bcryptjs_1.default.compare(data.password, user.passwordHash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const tokens = generateTokens({ id: user.id, email: user.email, role: user.role });
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.refreshToken.create({
            data: { token: tokens.refreshToken, userId: user.id, expiresAt },
        });
        const { passwordHash: _, ...userSafe } = user;
        res.json({ user: userSafe, ...tokens });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        logger_1.logger.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});
// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken)
        return res.status(400).json({ error: 'Refresh token required' });
    try {
        const payload = jsonwebtoken_1.default.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const stored = await prisma_1.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
        if (!stored || stored.expiresAt < new Date()) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        // Rotate refresh token
        await prisma_1.prisma.refreshToken.delete({ where: { token: refreshToken } });
        const tokens = generateTokens({ id: payload.id, email: payload.email, role: payload.role });
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma_1.prisma.refreshToken.create({
            data: { token: tokens.refreshToken, userId: payload.id, expiresAt },
        });
        res.json(tokens);
    }
    catch {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});
// GET /api/auth/me
router.get('/me', auth_1.authenticate, async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, email: true, username: true, role: true, avatar: true, bio: true, createdAt: true },
    });
    if (!user)
        return res.status(404).json({ error: 'User not found' });
    res.json(user);
});
// POST /api/auth/logout
router.post('/logout', auth_1.authenticate, async (req, res) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
        await prisma_1.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: 'Logged out successfully' });
});
exports.default = router;
//# sourceMappingURL=auth.js.map