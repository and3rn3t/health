# Docker Build & Deploy Setup

This document describes the Docker setup for faster builds and deployments.

## Overview

We use multi-stage Docker builds to:
- **Speed up CI/CD**: Cache dependencies and build layers
- **Consistent builds**: Same environment across dev/staging/prod
- **Faster deployments**: Pre-built images ready to deploy
- **Smaller images**: Production images only contain runtime dependencies

## Docker Images

### 1. `Dockerfile.production`
Multi-stage production build:
- **base**: Installs dependencies
- **builder**: Builds the app and worker
- **production**: Minimal runtime image with built artifacts

### 2. `Dockerfile.build`
CI/CD optimized build image:
- Contains all build tools
- Outputs artifacts to `/build-output`
- Designed for artifact extraction

### 3. `Dockerfile` (existing)
Development image for local testing with wrangler.

## Quick Start

### Build Production Image
```bash
# Build production image
docker build -f Dockerfile.production -t vitalsense:production .

# Or use the build script
./scripts/docker/build.sh production
```

### Build for CI/CD
```bash
# Build CI image
docker build -f Dockerfile.build -t vitalsense:build .

# Extract artifacts
./scripts/docker/extract-artifacts.sh vitalsense:build
```

### Development
```bash
# Use existing docker-compose.yml
docker-compose up

# Or build dev image
docker build -f Dockerfile -t vitalsense:dev --build-arg SKIP_BUILD=true .
```

## CI/CD Integration

### Option 1: Use Docker Build (Recommended)
The `docker-build.yml` workflow:
1. Builds Docker image with layer caching
2. Pushes to GitHub Container Registry
3. Extracts build artifacts
4. Uploads artifacts for deployment

**Benefits:**
- Faster builds (cached layers)
- Consistent environment
- Can reuse images across workflows

### Option 2: Use Docker in Existing Workflows
Update `deploy-production.yml` to use Docker:

```yaml
- name: Build with Docker
  run: |
    docker build -f Dockerfile.build -t vitalsense:build .
    docker create --name artifacts vitalsense:build
    docker cp artifacts:/build-output/dist ./dist
    docker cp artifacts:/build-output/dist-worker ./dist-worker
    docker rm artifacts
```

## Build Optimization

### Layer Caching Strategy
1. **Dependencies layer** (changes rarely):
   - `package.json` and `pnpm-lock.yaml`
   - Installed dependencies

2. **Source layer** (changes frequently):
   - Source code
   - Build configuration

3. **Build output** (changes every build):
   - `dist/` and `dist-worker/`

### Cache in CI
GitHub Actions automatically caches Docker layers when using:
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

## Deployment

### Extract Artifacts for Cloudflare
```bash
# Build image
docker build -f Dockerfile.build -t vitalsense:build .

# Extract artifacts
./scripts/docker/extract-artifacts.sh

# Deploy to Cloudflare (artifacts in ./dist and ./dist-worker)
wrangler deploy --env production
```

### Use Pre-built Image
```bash
# Pull from registry
docker pull ghcr.io/and3rn3t/health:latest

# Extract artifacts
docker create --name artifacts ghcr.io/and3rn3t/health:latest
docker cp artifacts:/build-output/dist ./dist
docker cp artifacts:/build-output/dist-worker ./dist-worker
docker rm artifacts
```

## Performance Benefits

### Before Docker
- Install dependencies: ~2-3 minutes
- Build app: ~1-2 minutes
- Build worker: ~30 seconds
- **Total: ~4-6 minutes**

### With Docker (cached)
- Pull cached layers: ~30 seconds
- Build app: ~1-2 minutes (if source changed)
- Build worker: ~30 seconds
- **Total: ~2-3 minutes** (50% faster)

### With Docker (fully cached)
- Pull image: ~30 seconds
- Extract artifacts: ~10 seconds
- **Total: ~40 seconds** (85% faster)

## Troubleshooting

### Build fails with "Cannot find module"
- Ensure `package.json` and `pnpm-lock.yaml` are copied before installing
- Check that all source files are included in Docker context

### Artifacts missing
- Verify build completed successfully
- Check `/build-output` directory in container
- Use `docker run --rm vitalsense:build ls -la /build-output`

### Cache not working
- Ensure Docker Buildx is set up
- Check that cache is enabled in workflow
- Verify layer order (dependencies before source)

## Next Steps

1. **Enable Docker builds in CI**: Update workflows to use Docker
2. **Set up image registry**: Configure GitHub Container Registry
3. **Optimize further**: Add build cache mounts for node_modules
4. **Multi-platform**: Build for ARM64 if needed

