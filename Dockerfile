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

# Prefer pnpm if lock exists, else npm ci
RUN if [ -f pnpm-lock.yaml ]; then \
      npm -g i pnpm@9 && pnpm i --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm i; \
    fi

# Copy source needed for build
COPY src ./src
# Static assets (optional)
COPY public ./public
COPY app-config.js ./
COPY wrangler.toml ./
COPY scripts ./scripts

# Build app (dist) and worker (dist-worker)
RUN npm run build

# --- Runtime stage -----------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=development \
    PORT=8789

# Install wrangler for local dev
RUN npm i -g wrangler@4.33.1

# Copy built worker and minimal files
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist-worker ./dist-worker
COPY --from=base /app/dist ./dist
COPY --from=base /app/wrangler.toml ./wrangler.toml
COPY --from=base /app/app-config.js ./app-config.js
COPY --from=base /app/scripts ./scripts

# Port used by wrangler dev in docker-compose
EXPOSE 8789

# Default command runs worker in dev mode locally, binding to 0.0.0.0 for external access
CMD ["wrangler", "dev", "--local", "--env", "development", "--port", "8789", "--host", "0.0.0.0"]
