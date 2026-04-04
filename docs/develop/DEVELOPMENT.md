# Development Setup Guide

This guide covers the complete development and deployment setup for the Health App using Cloudflare Workers.

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

3. **Start Cloudflare Workers development:**
   ```bash
   npm run cf:dev
   ```

## Environment Configuration

### Development Environment

- Copy `.env.development` to `.env.local` and update values
- Set your Cloudflare Account ID and API Token
- Configure database URLs for local development

### Production Environment

- Set environment variables in GitHub Secrets:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`
  - Database and storage credentials

## Build Commands

- `npm run build` - Build both React app and Cloudflare Worker
- `npm run build:app` - Build only the React application
- `npm run build:worker` - Build only the Cloudflare Worker
- `npm run format` - Format code with Prettier
- `npm run lint` - Run ESLint

## Deployment

### Development Deployment

```bash
npm run deploy:dev
```

### Production Deployment

```bash
npm run deploy:prod
```

### Automatic Deployment

- Push to `develop` branch → deploys to development environment
- Push to `main` branch → deploys to production environment

## Cloudflare Workers Setup

1. **Install Wrangler CLI:**

   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**

   ```bash
   wrangler login
   ```

3. **Configure KV and R2:**
   - Create KV namespace: `wrangler kv:namespace create "HEALTH_KV"`
   - Create R2 bucket: `wrangler r2 bucket create health-storage`
   - Update the IDs in `wrangler.toml`

## IDE Setup

The project includes optimized VS Code settings:

- Auto-formatting on save
- ESLint integration
- Tailwind CSS IntelliSense
- TypeScript support
- Debugging configurations

## File Structure

```
├── .env.development          # Development environment variables
├── .env.production          # Production environment variables
├── .github/workflows/       # GitHub Actions for CI/CD
├── .vscode/                # VS Code configuration
├── dist/                   # React app build output
├── dist-worker/            # Cloudflare Worker build output
├── src/
│   ├── worker.ts           # Cloudflare Worker entry point
│   └── ...                 # React app source
├── wrangler.toml           # Cloudflare Workers configuration
└── vite.worker.config.ts   # Vite config for worker build
```

## Troubleshooting

- Ensure all environment variables are set correctly
- Check Cloudflare dashboard for KV/R2 resource IDs
- Verify GitHub repository secrets are configured
- Use `wrangler tail` to debug worker issues
