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

async function ensureAdvancedMode(page: Page): Promise<void> {
	const current = await page.request.get("/api/settings");
	if (!current.ok()) return;
	const settings = (await current.json()) as {
		defaultForwardCollectorConfigId?: string;
		defaultEnv?: Array<{ key: string; value: string }>;
		externalTemplateRepos?: Array<Record<string, unknown>>;
		uiExperienceMode?: "simple" | "advanced";
	};
	if (settings.uiExperienceMode === "advanced") return;
	const payload: Record<string, unknown> = {
		defaultEnv: settings.defaultEnv ?? [],
		externalTemplateRepos: settings.externalTemplateRepos ?? [],
		uiExperienceMode: "advanced",
	};
	if (settings.defaultForwardCollectorConfigId) {
		payload.defaultForwardCollectorConfigId =
			settings.defaultForwardCollectorConfigId;
	}
	await page.request.put("/api/settings", {
		data: payload,
	});
}

async function loginLocal(page: Page): Promise<void> {
	const apiLogin = await page.request.post("/api/auth/login", {
		data: {
			username: requiredEnv.username || "",
			password: requiredEnv.password || "",
		},
	});
	if (apiLogin.ok()) {
		await ensureAdvancedMode(page);
		await page.goto("/dashboard", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
		return;
	}

	await page.goto("/login/local", {
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
	await ensureAdvancedMode(page);
	await page.goto("/dashboard", {
		waitUntil: "domcontentloaded",
		timeout: smokeTimeoutMs,
	});
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
			.locator("aside nav a", { hasText: "Observability" })
			.first();
		await Promise.all([
			page.waitForURL(
				(url) =>
					url.pathname === "/dashboard/observability" ||
					url.pathname.startsWith("/dashboard/observability/"),
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

	test("@smoke-integrations embedded tool route opens without popup", async ({
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
		const iframe = page.locator("iframe").first();
		const standbyBanner = page.getByText(
			/is in standby|is starting|No launch URL is configured/i,
		);

		await expect
			.poll(async () => {
				if (await iframe.isVisible().catch(() => false)) return "iframe";
				if (await standbyBanner.first().isVisible().catch(() => false))
					return "managed-state";
				return "pending";
			}, { timeout: smokeTimeoutMs })
			.not.toBe("pending");
	});
});
