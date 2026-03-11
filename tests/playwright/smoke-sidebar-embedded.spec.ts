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
	if (!raw || !raw.trim()) {
		return fallbackMs;
	}

	const parsed = Number.parseInt(raw.trim(), 10);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		return fallbackMs;
	}

	return parsed;
}

async function loginLocal(page: Page): Promise<void> {
	await page.goto("/login/local?next=/dashboard", {
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

test.describe("Playwright smoke coverage", () => {
	test.describe.configure({ mode: "serial" });

	test("@smoke-sidebar local login reaches dashboard and sidebar routes", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);

		await loginLocal(page);
		await page.waitForURL((url) => url.pathname.startsWith("/dashboard"), {
			timeout: smokeTimeoutMs,
		});
		await expect(page.locator("aside nav")).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		const signalsLink = page
			.locator("aside nav a", { hasText: "Signals" })
			.first();
		await Promise.all([
			page.waitForURL(
				(url) =>
					url.pathname === "/dashboard/signals" ||
					url.pathname.startsWith("/dashboard/signals/"),
				{ timeout: smokeTimeoutMs },
			),
			signalsLink.click(),
		]);

		const dashboardLink = page
			.locator("aside nav a", { hasText: "Dashboard" })
			.first();
		await Promise.all([
			page.waitForURL(
				(url) =>
					url.pathname === "/dashboard" ||
					url.pathname.startsWith("/dashboard/"),
				{ timeout: smokeTimeoutMs },
			),
			dashboardLink.click(),
		]);
	});

	test("@smoke-integrations embedded tool link opens in-frame and no popup", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);

		await loginLocal(page);
		await page.waitForURL((url) => url.pathname.startsWith("/dashboard"), {
			timeout: smokeTimeoutMs,
		});
		await expect(page.locator("aside nav")).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		const embeddedLinks = page.locator(
			'aside nav a[href^="/dashboard/tools/"]',
		);
		await embeddedLinks.first().waitFor({
			state: "visible",
			timeout: smokeTimeoutMs,
		});
		const embeddedCount = await embeddedLinks.count();
		expect(embeddedCount).toBeGreaterThan(0);

		const embeddedLink = embeddedLinks.first();
		await embeddedLink.scrollIntoViewIfNeeded();
		const embeddedHref = await embeddedLink.getAttribute("href");
		const embeddedTarget = await embeddedLink.getAttribute("target");
		expect(embeddedTarget).toBeNull();

		const popupOpened = page
			.waitForEvent("popup", { timeout: 2_000 })
			.then(() => true)
			.catch(() => false);

		await Promise.all([
			page.waitForURL(
				(url) =>
					embeddedHref
						? url.pathname ===
							new URL(embeddedHref, requiredEnv.baseUrl).pathname
						: url.pathname.startsWith("/dashboard/tools/"),
				{ timeout: smokeTimeoutMs },
			),
			embeddedLink.click(),
		]);

		expect(await popupOpened).toBe(false);
		await expect(page.locator("iframe").first()).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await expect(
			page.getByText("Embedded Workspace", { exact: false }).first(),
		).toBeVisible({
			timeout: smokeTimeoutMs,
		});
	});
});
