# syntax=docker/dockerfile:1

FROM node:24.14.1-slim AS base

WORKDIR /app

FROM base AS deps

RUN npm install -g pnpm@9.15.3
COPY package.json pnpm-lock.yaml ./
RUN pnpm i

FROM base AS builder

RUN npm install -g pnpm@9.15.3
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build:server

FROM base AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
