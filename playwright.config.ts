import { defineConfig } from "playwright/test";

function parseBooleanEnv(name: string, fallback: boolean): boolean {
	const raw = process.env[name];
	if (!raw || !raw.trim()) {
		return fallback;
	}

	const normalized = raw.trim().toLowerCase();
	if (["1", "true", "yes", "on"].includes(normalized)) {
		return true;
	}
	if (["0", "false", "no", "off"].includes(normalized)) {
		return false;
	}

	return fallback;
}

function parseTimeoutMs(name: string, fallbackMs: number): number {
	const raw = process.env[name];
	if (!raw || !raw.trim()) {
		return fallbackMs;
	}

	const parsed = Number.parseInt(raw.trim(), 10);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return fallbackMs;
	}

	return parsed;
}

const smokeBaseUrl =
	process.env.SKYFORGE_SMOKE_BASE_URL?.trim() || "http://127.0.0.1:4173";
const smokeTimeoutMs = parseTimeoutMs("SKYFORGE_SMOKE_TIMEOUT_MS", 30_000);

export default defineConfig({
	testDir: "./tests/playwright",
	timeout: smokeTimeoutMs,
	expect: {
		timeout: Math.min(smokeTimeoutMs, 10_000),
	},
	use: {
		baseURL: smokeBaseUrl,
		headless: parseBooleanEnv("SKYFORGE_SMOKE_HEADLESS", true),
		ignoreHTTPSErrors: true,
	},
});
