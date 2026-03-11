"use strict";
// ============================================================
// Search Routes — Global full-text search across all entities
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// GET /api/search?q=...&type=...
router.get('/', async (req, res) => {
    try {
        const { q, type, limit = '10' } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ error: 'Query must be at least 2 characters' });
        }
        const searchTerm = q.trim();
        const limitNum = Math.min(20, parseInt(limit));
        const searchMode = 'insensitive';
        const results = {};
        const searchAll = !type || type === 'all';
        if (searchAll || type === 'tools') {
            results.tools = await prisma_1.prisma.aiTool.findMany({
                where: {
                    status: 'APPROVED',
                    OR: [
                        { name: { contains: searchTerm, mode: searchMode } },
                        { description: { contains: searchTerm, mode: searchMode } },
                        { tags: { hasSome: [searchTerm] } },
                    ],
                },
                select: { id: true, slug: true, name: true, tagline: true, category: true, logoUrl: true },
                take: limitNum,
            });
        }
        if (searchAll || type === 'models') {
            results.models = await prisma_1.prisma.aiModel.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: searchMode } },
                        { organization: { contains: searchTerm, mode: searchMode } },
                        { description: { contains: searchTerm, mode: searchMode } },
                    ],
                },
                select: { id: true, slug: true, name: true, organization: true, modelType: true },
                take: limitNum,
            });
        }
        if (searchAll || type === 'research') {
            results.research = await prisma_1.prisma.researchPaper.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm, mode: searchMode } },
                        { abstract: { contains: searchTerm, mode: searchMode } },
                    ],
                },
                select: { id: true, title: true, authors: true, publicationDate: true, link: true },
                take: limitNum,
            });
        }
        if (searchAll || type === 'repos') {
            results.repos = await prisma_1.prisma.gitHubRepo.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: searchMode } },
                        { description: { contains: searchTerm, mode: searchMode } },
                    ],
                },
                select: { id: true, fullName: true, description: true, stars: true, repoUrl: true },
                take: limitNum,
            });
        }
        if (searchAll || type === 'prompts') {
            results.prompts = await prisma_1.prisma.prompt.findMany({
                where: {
                    status: 'APPROVED',
                    OR: [
                        { title: { contains: searchTerm, mode: searchMode } },
                        { description: { contains: searchTerm, mode: searchMode } },
                    ],
                },
                select: { id: true, slug: true, title: true, category: true, rating: true },
                take: limitNum,
            });
        }
        res.json({ query: searchTerm, results });
    }
    catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Search failed' });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map