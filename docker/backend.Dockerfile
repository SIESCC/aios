# ============================================================
# Backend Dockerfile — Node.js 20 + Express.js
# ============================================================

FROM node:20-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y openssl

# Install dependencies only when needed
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Development stage
FROM base AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 4000
CMD ["npm", "run", "dev"]

# Production build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production runner
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid 1001 expressjs
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p logs && chown expressjs:nodejs logs
USER expressjs
EXPOSE 4000
CMD ["node", "dist/index.js"]
