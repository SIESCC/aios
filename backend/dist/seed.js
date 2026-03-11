"use strict";
// ============================================================
// Database Seeder
// Populates the database with initial demo data
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding AIOS database...');
    // ── Admin User ─────────────────────────────────────────
    const adminPassword = await bcryptjs_1.default.hash('Admin@123!', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@aios.dev' },
        update: {},
        create: {
            email: 'admin@aios.dev',
            username: 'aios_admin',
            passwordHash: adminPassword,
            role: 'ADMIN',
        },
    });
    console.log('✅ Admin user created:', admin.email);
    // ── AI Tools ───────────────────────────────────────────
    const tools = [
        {
            slug: 'chatgpt', name: 'ChatGPT', tagline: 'The world\'s leading AI chatbot',
            description: 'ChatGPT is an AI chatbot developed by OpenAI, capable of natural conversation, code generation, writing, and analysis.',
            website: 'https://chat.openai.com', category: 'Chatbots', pricing: 'Freemium',
            tags: ['nlp', 'chatbot', 'openai', 'gpt-4'], trendingScore: 98,
            contextWindow: '128K tokens', apiAvailable: true,
            supportedTasks: ['chat', 'code', 'writing', 'analysis'],
            status: 'APPROVED', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
        },
        {
            slug: 'claude', name: 'Claude', tagline: 'Anthropic\'s safe and helpful AI assistant',
            description: 'Claude is an AI assistant by Anthropic, designed with safety in mind. It excels at analysis, writing, coding, and nuanced reasoning.',
            website: 'https://claude.ai', category: 'Chatbots', pricing: 'Freemium',
            tags: ['nlp', 'chatbot', 'anthropic', 'safe-ai'], trendingScore: 92,
            contextWindow: '200K tokens', apiAvailable: true,
            supportedTasks: ['chat', 'code', 'writing', 'analysis', 'research'],
            status: 'APPROVED',
        },
        {
            slug: 'midjourney', name: 'Midjourney', tagline: 'AI image generation at its finest',
            description: 'Midjourney is a leading AI art generator that creates stunning images from text prompts via Discord or web interface.',
            website: 'https://midjourney.com', category: 'Image Generation', pricing: 'Paid',
            tags: ['image', 'art', 'generation', 'creative'], trendingScore: 89,
            apiAvailable: false,
            supportedTasks: ['image-generation', 'art-creation'],
            status: 'APPROVED',
        },
        {
            slug: 'cursor', name: 'Cursor', tagline: 'The AI-first code editor',
            description: 'Cursor is an AI-powered code editor that helps developers write, edit, and debug code faster with intelligent suggestions.',
            website: 'https://cursor.sh', category: 'Code Assistants', pricing: 'Freemium',
            tags: ['code', 'editor', 'developer', 'productivity'], trendingScore: 95,
            apiAvailable: false,
            supportedTasks: ['code', 'debugging', 'refactoring'],
            status: 'APPROVED',
        },
        {
            slug: 'perplexity', name: 'Perplexity AI', tagline: 'AI-powered search engine',
            description: 'Perplexity is an AI-powered search engine that provides accurate, real-time answers with citations.',
            website: 'https://perplexity.ai', category: 'Search', pricing: 'Freemium',
            tags: ['search', 'research', 'web', 'citations'], trendingScore: 88,
            apiAvailable: true,
            supportedTasks: ['search', 'research', 'analysis'],
            status: 'APPROVED',
        },
        {
            slug: 'github-copilot', name: 'GitHub Copilot', tagline: 'AI pair programmer',
            description: 'GitHub Copilot uses AI to suggest code completions in real-time, acting as your AI pair programmer.',
            website: 'https://github.com/features/copilot', category: 'Code Assistants', pricing: 'Paid',
            tags: ['code', 'github', 'developer', 'autocomplete'], trendingScore: 90,
            apiAvailable: false,
            supportedTasks: ['code', 'autocomplete', 'documentation'],
            status: 'APPROVED',
        },
    ];
    for (const tool of tools) {
        await prisma.aiTool.upsert({
            where: { slug: tool.slug },
            update: {},
            create: tool,
        });
    }
    console.log(`✅ ${tools.length} AI tools seeded`);
    // ── AI Models ──────────────────────────────────────────
    const models = [
        {
            slug: 'gpt-4o', name: 'GPT-4o', organization: 'OpenAI',
            modelType: 'LLM', releaseDate: new Date('2024-05-13'),
            description: 'OpenAI\'s most capable multimodal model combining text, vision, and audio.',
            apiAvailable: true, contextWindow: 128000, parameterCount: 'Unknown',
            capabilities: ['text', 'vision', 'audio', 'code'],
            benchmarks: { mmlu: 88.7, hellaswag: 98.4, humaneval: 90.2 },
            trendingScore: 97.5,
        },
        {
            slug: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', organization: 'Anthropic',
            modelType: 'LLM', releaseDate: new Date('2024-06-20'),
            description: 'Anthropic\'s most intelligent model, leading on coding and reasoning.',
            apiAvailable: true, contextWindow: 200000, parameterCount: 'Unknown',
            capabilities: ['text', 'vision', 'code', 'analysis'],
            benchmarks: { mmlu: 88.3, humaneval: 92.0 },
            trendingScore: 95.2,
        },
        {
            slug: 'gemini-1-5-pro', name: 'Gemini 1.5 Pro', organization: 'Google DeepMind',
            modelType: 'MULTIMODAL', releaseDate: new Date('2024-02-15'),
            description: 'Google\'s multimodal model with 1M token context window.',
            apiAvailable: true, contextWindow: 1000000, parameterCount: 'Unknown',
            capabilities: ['text', 'vision', 'audio', 'video', 'code'],
            benchmarks: { mmlu: 85.9, humaneval: 84.1 },
            trendingScore: 92.1,
        },
        {
            slug: 'llama-3-70b', name: 'Llama 3 70B', organization: 'Meta',
            modelType: 'LLM', releaseDate: new Date('2024-04-18'),
            description: 'Meta\'s open-source large language model with 70B parameters.',
            apiAvailable: true, openSource: true, contextWindow: 8192, parameterCount: '70B',
            capabilities: ['text', 'code', 'reasoning'],
            benchmarks: { mmlu: 82.0, humaneval: 81.7 },
            trendingScore: 88.4,
        },
    ];
    for (const model of models) {
        await prisma.aiModel.upsert({
            where: { slug: model.slug },
            update: {},
            create: model,
        });
    }
    console.log(`✅ ${models.length} AI models seeded`);
    // ── Research Papers ────────────────────────────────────
    const papers = [
        {
            title: 'Attention Is All You Need',
            authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.'],
            abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...',
            aiSummary: 'This paper introduced the Transformer architecture which revolutionized NLP by replacing RNNs with self-attention mechanisms, enabling better parallelization and state-of-the-art results.',
            source: 'arxiv', arxivId: '1706.03762',
            link: 'https://arxiv.org/abs/1706.03762',
            publicationDate: new Date('2017-06-12'),
            category: 'NLP', trendingScore: 98,
        },
        {
            title: 'GPT-4 Technical Report',
            authors: ['OpenAI'],
            abstract: 'We report the development of GPT-4, a large multimodal model...',
            aiSummary: 'OpenAI introduces GPT-4, their largest multimodal model capable of processing both image and text inputs. It achieves human-level performance on many professional benchmarks.',
            source: 'arxiv', arxivId: '2303.08774',
            link: 'https://arxiv.org/abs/2303.08774',
            publicationDate: new Date('2023-03-15'),
            category: 'LLM', trendingScore: 95,
        },
    ];
    for (const paper of papers) {
        try {
            await prisma.researchPaper.upsert({
                where: { arxivId: paper.arxivId },
                update: {},
                create: paper,
            });
        }
        catch { }
    }
    console.log(`✅ ${papers.length} research papers seeded`);
    // ── AI Startups ────────────────────────────────────────
    const startups = [
        {
            name: 'Anthropic', slug: 'anthropic',
            description: 'AI safety company building Claude AI assistants.',
            website: 'https://anthropic.com', country: 'USA', industry: 'AI Safety',
            fundingRound: 'SERIES_C', fundingAmount: BigInt(7300000000),
            investors: ['Google', 'Spark Capital', 'Salesforce'], founded: 2021, trendingScore: 96,
        },
        {
            name: 'Mistral AI', slug: 'mistral-ai',
            description: 'European AI startup building open and efficient language models.',
            website: 'https://mistral.ai', country: 'France', industry: 'Foundation Models',
            fundingRound: 'SERIES_B', fundingAmount: BigInt(1000000000),
            investors: ['Andreessen Horowitz', 'General Catalyst'], founded: 2023, trendingScore: 88,
        },
        {
            name: 'Perplexity AI', slug: 'perplexity-ai',
            description: 'AI-powered answer engine that provides real-time web search with citations.',
            website: 'https://perplexity.ai', country: 'USA', industry: 'Search',
            fundingRound: 'SERIES_B', fundingAmount: BigInt(250000000),
            investors: ['IVP', 'NEA', 'NVIDIA'], founded: 2022, trendingScore: 85,
        },
    ];
    for (const startup of startups) {
        await prisma.aiStartup.upsert({
            where: { slug: startup.slug },
            update: {},
            create: startup,
        });
    }
    console.log(`✅ ${startups.length} startups seeded`);
    // ── Prompts ────────────────────────────────────────────
    const prompts = [
        {
            title: 'Expert Code Reviewer', slug: 'expert-code-reviewer',
            description: 'Get thorough code reviews from an expert engineer',
            promptText: 'You are an expert software engineer with 20 years of experience. Review the following code for: 1) Bugs and logical errors 2) Performance issues 3) Security vulnerabilities 4) Code style and best practices 5) Suggest specific improvements with examples.\n\nCode to review:\n```\n{CODE}\n```',
            usageExample: 'Replace {CODE} with your code snippet',
            category: 'Development', tags: ['code', 'review', 'engineering'], model: 'GPT-4', status: 'APPROVED',
            rating: 4.8, ratingCount: 245, copyCount: 1893, authorId: admin.id,
        },
        {
            title: 'Research Paper Summarizer', slug: 'research-paper-summarizer',
            description: 'Summarize complex papers into 5 key points',
            promptText: 'You are an expert researcher. Read the following paper and provide: 1) One-line summary 2) Problem being solved 3) Key methodology 4) Main results 5) Real-world implications. Keep each point concise (2-3 sentences max).\n\nPaper:\n{PAPER_TEXT}',
            usageExample: 'Paste an arXiv abstract or full paper text',
            category: 'Research', tags: ['paper', 'summary', 'research'], model: 'Claude', status: 'APPROVED',
            rating: 4.7, ratingCount: 189, copyCount: 1456, authorId: admin.id,
        },
        {
            title: 'Startup Pitch Generator', slug: 'startup-pitch-generator',
            description: 'Create a compelling elevator pitch for your startup',
            promptText: 'Create a compelling 60-second elevator pitch for a startup with the following details:\n- Company name: {NAME}\n- Problem solved: {PROBLEM}\n- Target customer: {CUSTOMER}\n- Solution: {SOLUTION}\n- Business model: {MODEL}\n\nFormat: Hook → Problem → Solution → Traction → Ask',
            category: 'Business', tags: ['startup', 'pitch', 'business'], model: 'ChatGPT', status: 'APPROVED',
            rating: 4.6, ratingCount: 134, copyCount: 987, authorId: admin.id,
        },
    ];
    for (const prompt of prompts) {
        await prisma.prompt.upsert({
            where: { slug: prompt.slug },
            update: {},
            create: prompt,
        });
    }
    console.log(`✅ ${prompts.length} prompts seeded`);
    console.log('\n🎉 Database seeding complete!');
    console.log('Admin login: admin@aios.dev / Admin@123!');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map