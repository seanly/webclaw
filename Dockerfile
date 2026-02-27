# WebClaw — TanStack Start (React + SSR) app
# Build and run: docker build -t webclaw . && docker run -p 3000:3000 webclaw

FROM hub.rat.dev/node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build the app
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm -C apps/webclaw build

# Production image
FROM hub.rat.dev/node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_PATH=/app/node_modules

# Copy workspace layout and built app (app node_modules needed for ESM resolve from dist/server/)
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/webclaw/package.json ./apps/webclaw/
COPY --from=builder /app/apps/webclaw/node_modules ./apps/webclaw/node_modules
COPY --from=builder /app/apps/webclaw/dist ./apps/webclaw/dist
COPY --from=builder /app/apps/webclaw/server-runner.mjs ./apps/webclaw/

EXPOSE 3000
CMD ["node", "apps/webclaw/server-runner.mjs"]
