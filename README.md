# AIOS — AI Ecosystem Operating System

> **The central intelligence hub for the global AI ecosystem.**  
> Discover, analyze, compare, and track AI tools, models, research papers, startups, GitHub repositories, and prompts.

![AIOS Dashboard](https://via.placeholder.com/1200x600/0a0e1a/4f55ff?text=AIOS+Dashboard)

---

## 🚀 What is AIOS?

AIOS functions as a combination of:
- **Product Hunt** — for AI tool discovery
- **Bloomberg Terminal** — for intelligence dashboards
- **GitHub Trending** — for AI repo tracking
- **App Store** — for structured AI ecosystem data

It automatically collects, analyzes, and presents insights through data pipelines and AI processing.

---

## 🏗️ Architecture

```
External Sources (GitHub, arXiv, HN, RSS Feeds)
         ↓
   Python Scrapers (workers/)
         ↓
   Redis Queue (BullMQ)
         ↓
   AI Summarization (OpenAI)
         ↓
   PostgreSQL (Prisma ORM)
         ↓
   Express REST API (backend/)
         ↓
   Next.js 14 Frontend (frontend/)
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, ShadCN |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis + BullMQ |
| Workers | Python 3.11 |
| Auth | JWT + Refresh Tokens |
| Infrastructure | Docker + Docker Compose |

---

## 🧩 Platform Modules

| Module | Description |
|--------|-------------|
| 🔧 AI Tool Discovery | Browse + filter 8 categories of AI tools |
| ⚖️ Comparison Engine | Side-by-side feature comparison (up to 5 tools) |
| 📈 Trend Intelligence | Live trending scores + analytics charts |
| 🧠 Model Leaderboard | LLM/Code/Image/Audio rankings with benchmarks |
| 📄 Research Intelligence | arXiv papers with AI-generated summaries |
| 🐙 GitHub Intelligence | Trending AI repos with star growth tracking |
| 💼 Startup Tracker | Funding rounds, investors, industries |
| 💬 Prompt Library | Searchable community prompt database |
| 🛡️ Admin Panel | Content moderation + system monitoring |

---

## 🛠️ Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional) OpenAI API key for AI summaries
- (Optional) GitHub token for higher API limits

### 1. Clone & Configure

```bash
git clone <repo-url>
cd aios
cp .env.example .env
# Edit .env with your secrets
```

### 2. Start Everything

```bash
docker-compose up -d
```

This starts:
- ✅ PostgreSQL (port 5432)
- ✅ Redis (port 6379)
- ✅ Elasticsearch (port 9200)
- ✅ Express API (port 4000)
- ✅ Next.js Frontend (port 3000)
- ✅ Python Workers
- ✅ Bull Board queue monitor (port 3001)

### 3. Initialize Database

```bash
# Run migrations
docker-compose exec backend npx prisma migrate dev

# Seed with demo data
docker-compose exec backend npm run db:seed
```

### 4. Access the Platform

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| API Health | http://localhost:4000/health |
| Queue Monitor | http://localhost:3001 |
| Database Studio | Run `npm run db:studio` in backend/ |

**Demo Admin:** `admin@aios.dev` / `Admin@123!`

---

## 🔧 Local Development (without Docker)

### Backend

```bash
cd backend
npm install
cp ../.env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Python Workers

```bash
cd workers
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python -m pipeline.orchestrator
```

---

## 📡 API Reference

### Authentication
```
POST /api/auth/register   — Create account
POST /api/auth/login      — Login
POST /api/auth/refresh    — Refresh tokens
GET  /api/auth/me         — Current user
POST /api/auth/logout     — Logout
```

### AI Tools
```
GET  /api/tools                   — List tools (search, filter, paginate)
GET  /api/tools/trending          — Top trending tools
GET  /api/tools/categories        — All categories with counts
GET  /api/tools/:slug             — Tool detail
POST /api/tools                   — Submit tool (auth required)
GET  /api/tools/compare/tools     — Compare multiple tools
POST /api/tools/:id/rate          — Rate a tool
```

### Models
```
GET /api/models                   — List models
GET /api/models/leaderboard/:type — Type leaderboard (LLM/CODE/IMAGE/AUDIO)
GET /api/models/:slug             — Model detail
```

### Research
```
GET /api/research                 — List papers (search, filter)
GET /api/research/latest          — Latest 6 papers
GET /api/research/:id             — Paper detail
```

### Repos
```
GET /api/repos                    — List repos (filter by language)
GET /api/repos/trending           — Top repos by weekly growth
```

### Startups
```
GET /api/startups                 — List startups (filter by round)
GET /api/startups/latest-funding  — Latest 8 funding rounds
GET /api/startups/:slug           — Startup detail
```

### Prompts
```
GET  /api/prompts                 — List approved prompts
GET  /api/prompts/categories      — Prompt categories
GET  /api/prompts/:slug           — Prompt detail
POST /api/prompts                 — Submit prompt (auth required)
POST /api/prompts/:id/copy        — Track copy event
```

### Trends
```
GET /api/trends/overview          — Dashboard stats
GET /api/trends/categories        — Category distribution
GET /api/trends/history           — Time series data
GET /api/trends/news              — AI news feed
```

### Search
```
GET /api/search?q=...&type=...    — Global search
```

### Admin (requires admin role)
```
GET    /api/admin/tools/pending         — Pending tools
PATCH  /api/admin/tools/:id/approve    — Approve tool
PATCH  /api/admin/tools/:id/reject     — Reject tool
PUT    /api/admin/tools/:id            — Edit tool
DELETE /api/admin/tools/:id            — Delete tool
GET    /api/admin/stats                — System stats
GET    /api/admin/jobs                 — Job history
GET    /api/admin/users                — User list
PATCH  /api/admin/users/:id/role       — Change user role
```

---

## 🤖 Automation Workers

Workers run on schedule via Python `schedule`:

| Worker | Frequency | Data Source |
|--------|-----------|-------------|
| GitHub Scraper | Every 6 hours | GitHub API |
| arXiv Scraper | Every 12 hours | arXiv RSS |
| News Scraper | Every 3 hours | RSS Feeds |
| AI Summarizer | Every 2 hours | OpenAI GPT-3.5 |

---

## 🔑 Environment Variables

See `.env.example` for a full list. Key variables:

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
OPENAI_API_KEY=sk-...    # For AI summaries
GITHUB_TOKEN=ghp_...     # For higher GitHub API limits
```

---

## 📁 Project Structure

```
aios/
├── frontend/                 # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx          # Dashboard homepage
│   │   ├── tools/            # AI Tool Discovery
│   │   ├── models/           # Model Leaderboard
│   │   ├── research/         # Research Intelligence
│   │   ├── repos/            # GitHub Intelligence
│   │   ├── startups/         # Startup Tracker
│   │   ├── prompts/          # Prompt Library
│   │   ├── trends/           # Trend Dashboard
│   │   ├── compare/          # Tool Comparison
│   │   ├── admin/            # Admin Panel
│   │   └── auth/             # Auth pages
│   ├── components/
│   │   ├── dashboard/        # Dashboard widgets
│   │   └── layout/           # Navbar + Sidebar
│   └── lib/                  # API client + utils
│
├── backend/                  # Express.js API
│   ├── prisma/
│   │   └── schema.prisma     # Full DB schema
│   └── src/
│       ├── routes/           # All API routes
│       ├── middleware/       # Auth middleware
│       ├── lib/              # Prisma, Redis, Logger
│       ├── jobs/             # BullMQ queue setup
│       └── seed.ts           # Demo data seeder
│
├── workers/                  # Python automation
│   ├── scrapers/             # GitHub, arXiv, News scrapers
│   ├── ai_processor/         # AI summarizer
│   └── pipeline/             # Orchestrator scheduler
│
├── docker/                   # Dockerfiles
└── docker-compose.yml        # Full stack orchestration
```

---

## 🧩 Extending AIOS

### Add a new data source
1. Create a scraper in `workers/scrapers/`
2. Add a Prisma model in `backend/prisma/schema.prisma`
3. Create an API route in `backend/src/routes/`
4. Add a frontend page in `frontend/app/`
5. Schedule the scraper in `workers/pipeline/orchestrator.py`

### Add a new module
Follow the same pattern — schema → API → frontend page → worker (if needed).

---

## 📄 License

MIT © AIOS Team
