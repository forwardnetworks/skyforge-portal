# Skyforge Portal (TanStack)

This is the new portal scaffold intended to replace the existing `portal/` (Next.js) UI over time.

## Local dev

```bash
cd portal-tanstack
pnpm install
pnpm dev
```

By default, the dev server proxies `/api`, `/status`, and `/auth` to `http://localhost:8085` (Skyforge server).

## Build

```bash
cd portal-tanstack
pnpm install
pnpm build
```

## Docker image

The included `Dockerfile` builds static assets and serves them with Nginx on port `3000` to match the existing Helm service expectations.

