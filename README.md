# Skyforge Portal (TanStack)

This is the Skyforge portal (TanStack Router + Vite). The legacy Next.js portal has been retired.

## Local dev

```bash
cd components/portal
pnpm install
pnpm dev
```

By default, the dev server proxies `/api`, `/status`, and `/auth` to `http://localhost:8085` (Skyforge server).

## Build

```bash
cd components/portal
pnpm install
pnpm build
```

## Deployment

The portal is built with `pnpm build` and embedded into the `skyforge-server` image; there is no separate Nginx/portal container.
