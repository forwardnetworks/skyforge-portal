# UI E2E (Playwright)

This script validates that the major Skyforge UI pages render and that the
Dashboard SSE stream is live. It uses a test-only session seed API.

## Server setup

Enable the E2E admin API and configure a token:

- `E2EAdminEnabled: true` in `server/skyforge/config.cue` (or ENCORE_CFG).
- `SKYFORGE_E2E_ADMIN_TOKEN` secret set in your environment/secret store.

The API endpoint is:

- `POST /api/admin/e2e/session` (header `X-Skyforge-E2E-Token`)

## Run locally

From `skyforge-private/portal-tanstack`:

```bash
export SKYFORGE_UI_E2E_BASE_URL=http://localhost:5173
export SKYFORGE_UI_E2E_API_URL=http://localhost:8085
export SKYFORGE_UI_E2E_ADMIN_TOKEN=...   # required
export SKYFORGE_UI_E2E_USERNAME=skyforge # optional

pnpm install
pnpm e2e:ui
```

On Ubuntu 26.04 where Playwright does not yet provide a bundled Chromium,
the script automatically uses system Chromium when available (for example
`/usr/bin/chromium-browser`).

## Environment variables

- `SKYFORGE_UI_E2E_BASE_URL` (default `http://localhost:5173`)
- `SKYFORGE_UI_E2E_API_URL` (default `http://localhost:8085`)
- `SKYFORGE_UI_E2E_ADMIN_TOKEN` (required)
- `SKYFORGE_UI_E2E_USERNAME` (default `skyforge`)
- `SKYFORGE_UI_E2E_HEADLESS` (default `true`)
- `SKYFORGE_UI_E2E_TIMEOUT_MS` (default `15000`)
- `SKYFORGE_UI_E2E_SSE_TIMEOUT_MS` (default `10000`)
- `SKYFORGE_UI_E2E_CHROMIUM_PATH` (optional absolute Chromium path override)
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` (optional alternative override)
