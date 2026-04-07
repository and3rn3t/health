# syntax=docker/dockerfile:1.7

# --- Base build stage --------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
ENV CI=true

# Install OS deps for node-gyp if needed (kept minimal)
RUN apk add --no-cache \
  bash \
  g++ \
  libc6-compat \
  make \
  python3

# Only install root package deps (workspaces used, but we build from root)
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
COPY eslint.config.js postcss.config.* tailwind.config.* ./
COPY vite*.ts ./
COPY tsconfig*.json ./

# Prefer pnpm if lock exists, else npm ci
RUN if [ -f pnpm-lock.yaml ]; then \
  npm -g i pnpm@9 && pnpm i --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
  npm ci; \
  else \
  npm i; \
  fi

# Copy source (mounted in dev via volumes, but include for completeness)
COPY src ./src
COPY public ./public
COPY app-config.js ./
COPY wrangler.toml ./
COPY scripts ./scripts

# Optionally build app + worker; default skip in dev images to speed up compose
ARG SKIP_BUILD=true
RUN if [ "$SKIP_BUILD" != "true" ]; then npm run build; else echo "Skipping build (SKIP_BUILD=$SKIP_BUILD)"; fi

# --- Runtime stage -----------------------------------------------------------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=development \
  PORT=8789

# Install runtime deps for workerd used by wrangler dev, and wrangler itself
RUN apt-get update && \
  apt-get install -y --no-install-recommends libc++1 ca-certificates && \
  rm -rf /var/lib/apt/lists/* && \
  npm i -g wrangler@4.33.1

# Copy built worker and minimal files
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
# Dev image runs wrangler directly; built outputs not required here
COPY --from=base /app/wrangler.toml ./wrangler.toml
COPY --from=base /app/app-config.js ./app-config.js
COPY --from=base /app/scripts ./scripts

# Run as non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser \
  && chown -R appuser:appuser /app
USER appuser

# Port used by wrangler dev in docker-compose
EXPOSE 8789

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:8789/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Default command runs worker in dev mode locally, binding to 0.0.0.0 for external access
CMD ["wrangler", "dev", "--local", "--env", "development", "--port", "8789", "--host", "0.0.0.0"]
