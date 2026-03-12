#!/usr/bin/env node

import assert from "node:assert/strict";
import { chromium } from "playwright";

const REQUIRED_ENV = [
	"SKYFORGE_SMOKE_BASE_URL",
	"SKYFORGE_SMOKE_USERNAME",
	"SKYFORGE_SMOKE_PASSWORD",
];

function getRequiredEnv(name) {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}
	return value;
}

function parseBooleanEnv(name, fallback) {
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

	throw new Error(
		`Invalid boolean value for ${name}: "${raw}". Use true/false, 1/0, yes/no, or on/off.`,
	);
}

function parseTimeoutMs(name, fallbackMs) {
	const raw = process.env[name];
	if (!raw || !raw.trim()) {
		return fallbackMs;
	}
	const parsed = Number.parseInt(raw.trim(), 10);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new Error(`Invalid timeout value for ${name}: "${raw}"`);
	}
	return parsed;
}

async function loginLocal(page, baseUrl, username, password, timeoutMs) {
	const loginUrl = new URL("/login/local?next=/dashboard", baseUrl).toString();
	await page.goto(loginUrl, {
		waitUntil: "domcontentloaded",
		timeout: timeoutMs,
	});

	if (!new URL(page.url()).pathname.startsWith("/login/local")) {
		console.log("[smoke] Session already authenticated; skipping login form.");
		return;
	}

	await page.getByPlaceholder("Username").fill(username);
	await page.getByPlaceholder("Password").fill(password);
	await Promise.all([
		page.waitForURL((url) => url.pathname.startsWith("/dashboard"), {
			timeout: timeoutMs,
		}),
		page.getByRole("button", { name: "Sign in" }).click(),
	]);
}

async function clickSidebarLink(page, label, expectedPath, timeoutMs) {
	const link = page.locator("aside nav a", { hasText: label }).first();
	await link.waitFor({ state: "visible", timeout: timeoutMs });
	await Promise.all([
		page.waitForURL(
			(url) =>
				url.pathname === expectedPath ||
				url.pathname.startsWith(`${expectedPath}/`),
			{ timeout: timeoutMs },
		),
		link.click(),
	]);
	console.log(`[smoke] Sidebar route OK: ${label} -> ${expectedPath}`);
}

async function run() {
	for (const variable of REQUIRED_ENV) {
		getRequiredEnv(variable);
	}

	const baseUrl = getRequiredEnv("SKYFORGE_SMOKE_BASE_URL");
	const username = getRequiredEnv("SKYFORGE_SMOKE_USERNAME");
	const password = getRequiredEnv("SKYFORGE_SMOKE_PASSWORD");
	const headless = parseBooleanEnv("SKYFORGE_SMOKE_HEADLESS", true);
	const timeoutMs = parseTimeoutMs("SKYFORGE_SMOKE_TIMEOUT_MS", 30_000);

	const browser = await chromium.launch({ headless });
	const context = await browser.newContext({ ignoreHTTPSErrors: true });
	const page = await context.newPage();

	try {
		await loginLocal(page, baseUrl, username, password, timeoutMs);
		await page.waitForURL((url) => url.pathname.startsWith("/dashboard"), {
			timeout: timeoutMs,
		});
		await page
			.locator("aside nav")
			.waitFor({ state: "visible", timeout: timeoutMs });
		console.log("[smoke] Left sidebar is visible.");

		await clickSidebarLink(page, "Observability", "/dashboard/observability", timeoutMs);
		await clickSidebarLink(page, "Dashboard", "/dashboard", timeoutMs);

		const embeddedLinks = page.locator(
			'aside nav a[href^="/dashboard/tools/"]',
		);
		const embeddedCount = await embeddedLinks.count();
		assert.ok(
			embeddedCount > 0,
			"No embedded tool links are visible in the left sidebar.",
		);

		const embeddedLink = embeddedLinks.first();
		await embeddedLink.scrollIntoViewIfNeeded();
		const embeddedHref = await embeddedLink.getAttribute("href");
		const embeddedTarget = await embeddedLink.getAttribute("target");
		const embeddedLabel =
			(await embeddedLink.innerText()).trim() || "embedded tool";
		assert.equal(
			embeddedTarget,
			null,
			`Expected "${embeddedLabel}" to open in-frame without target=_blank.`,
		);

		const popupOpened = page
			.waitForEvent("popup", { timeout: 2_000 })
			.then(() => true)
			.catch(() => false);

		await Promise.all([
			page.waitForURL(
				(url) =>
					embeddedHref
						? url.pathname === new URL(embeddedHref, baseUrl).pathname
						: url.pathname.startsWith("/dashboard/tools/"),
				{ timeout: timeoutMs },
			),
			embeddedLink.click(),
		]);

		assert.equal(
			await popupOpened,
			false,
			`Clicking "${embeddedLabel}" opened a popup/new tab.`,
		);

		await page
			.locator("iframe")
			.first()
			.waitFor({ state: "attached", timeout: timeoutMs });
		await page
			.getByText("Embedded Workspace", { exact: false })
			.first()
			.waitFor({ state: "visible", timeout: timeoutMs });

		console.log(
			`[smoke] Embedded tool link "${embeddedLabel}" opens in-frame at ${new URL(page.url()).pathname}.`,
		);
		console.log("[smoke] PASS");
	} finally {
		await context.close();
		await browser.close();
	}
}

run().catch((error) => {
	console.error(
		`[smoke] FAIL: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exitCode = 1;
});
