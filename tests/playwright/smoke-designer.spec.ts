import { type Page, expect, test } from "playwright/test";

const REQUIRED_ENV = [
	"SKYFORGE_SMOKE_BASE_URL",
	"SKYFORGE_SMOKE_USERNAME",
	"SKYFORGE_SMOKE_PASSWORD",
] as const;

const smokeTimeoutMs = parseTimeoutMs("SKYFORGE_SMOKE_TIMEOUT_MS", 30_000);
const requiredEnv = {
	baseUrl: process.env.SKYFORGE_SMOKE_BASE_URL?.trim(),
	username: process.env.SKYFORGE_SMOKE_USERNAME?.trim(),
	password: process.env.SKYFORGE_SMOKE_PASSWORD?.trim(),
};
const missingRequiredEnv = REQUIRED_ENV.filter((name) => {
	switch (name) {
		case "SKYFORGE_SMOKE_BASE_URL":
			return !requiredEnv.baseUrl;
		case "SKYFORGE_SMOKE_USERNAME":
			return !requiredEnv.username;
		case "SKYFORGE_SMOKE_PASSWORD":
			return !requiredEnv.password;
		default:
			return true;
	}
});
const missingEnvMessage = `Missing required environment variable(s): ${missingRequiredEnv.join(", ")}`;

function parseTimeoutMs(name: string, fallbackMs: number): number {
	const raw = process.env[name];
	if (!raw || !raw.trim()) return fallbackMs;
	const parsed = Number.parseInt(raw.trim(), 10);
	if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMs;
	return parsed;
}

async function loginLocal(page: Page): Promise<void> {
	await page.goto("/login/local?next=/dashboard/labs/designer", {
		waitUntil: "domcontentloaded",
		timeout: smokeTimeoutMs,
	});

	if (!new URL(page.url()).pathname.startsWith("/login/local")) {
		return;
	}

	await page.getByPlaceholder("Username").fill(requiredEnv.username || "");
	await page.getByPlaceholder("Password").fill(requiredEnv.password || "");
	await Promise.all([
		page.waitForURL((url) => url.pathname.startsWith("/dashboard"), {
			timeout: smokeTimeoutMs,
		}),
		page.getByRole("button", { name: "Sign in" }).click(),
	]);
}

test.describe("Designer smoke coverage", () => {
	test("@smoke-designer local login reaches designer and core interactions work", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);

		await loginLocal(page);
		await page.goto("/dashboard/labs/designer", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
		await page.waitForURL(
			(url) => url.pathname === "/dashboard/labs/designer",
			{ timeout: smokeTimeoutMs },
		);

		await expect(page.getByText("Lab Designer").first()).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		const focusOff = page.getByRole("button", { name: "Focus: off" });
		await expect(focusOff).toBeVisible({ timeout: smokeTimeoutMs });
		await focusOff.click();
		await expect(page.getByRole("button", { name: "Focus: on" })).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await expect(
			page.getByRole("button", { name: "Quickstart" }),
		).not.toBeVisible({ timeout: smokeTimeoutMs });

		await page.getByRole("button", { name: "Focus: on" }).click();
		await expect(page.getByRole("button", { name: "Quickstart" })).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		await page.getByRole("button", { name: "Add node" }).click();
		await expect(
			page.locator(".react-flow__node").filter({ hasText: "n2" }).first(),
		).toBeVisible({ timeout: smokeTimeoutMs });

		await page
			.locator(".react-flow__node")
			.filter({ hasText: "r1" })
			.first()
			.click();
		await expect(page.getByRole("tab", { name: /Node \*/ })).toBeVisible({
			timeout: smokeTimeoutMs,
		});
	});
});
