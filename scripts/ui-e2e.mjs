import { constants, accessSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE_URL = (
	process.env.SKYFORGE_UI_E2E_BASE_URL || "http://localhost:5173"
).replace(/\/$/, "");
const API_URL = (
	process.env.SKYFORGE_UI_E2E_API_URL || "http://localhost:8085"
).replace(/\/$/, "");
const USERNAME = (process.env.SKYFORGE_UI_E2E_USERNAME || "skyforge").trim();
const ADMIN_TOKEN = (process.env.SKYFORGE_UI_E2E_ADMIN_TOKEN || "").trim();
const HEADLESS = envBool("SKYFORGE_UI_E2E_HEADLESS", true);
const TIMEOUT_MS = envInt("SKYFORGE_UI_E2E_TIMEOUT_MS", 15000);
const SSE_TIMEOUT_MS = envInt("SKYFORGE_UI_E2E_SSE_TIMEOUT_MS", 10000);
const SCREENSHOTS = envBool("SKYFORGE_UI_E2E_SCREENSHOTS", true);
const SCREENSHOT_DIR = (
	process.env.SKYFORGE_UI_E2E_SCREENSHOT_DIR || "e2e-artifacts"
).trim();
const CHROMIUM_PATH = resolveChromiumPath();
let screenshotCounter = 0;

if (!ADMIN_TOKEN) {
	console.error("Missing SKYFORGE_UI_E2E_ADMIN_TOKEN.");
	process.exit(1);
}

const cookie = await seedSession();
const cookieHeader = `${cookie.name}=${cookie.value}`;
await assertSSE(cookieHeader);
const deploymentIds = await listDeploymentIds(cookieHeader);

const launchOptions = { headless: HEADLESS };
if (CHROMIUM_PATH) {
	launchOptions.executablePath = CHROMIUM_PATH;
}
const browser = await chromium.launch(launchOptions);
const context = await browser.newContext({
	viewport: { width: 1440, height: 900 },
});
if (SCREENSHOTS) {
	mkdirSync(SCREENSHOT_DIR, { recursive: true });
}
await context.addCookies([
	{ name: cookie.name, value: cookie.value, url: BASE_URL },
]);
const page = await context.newPage();
page.setDefaultTimeout(TIMEOUT_MS);

const errors = [];
const networkErrors = [];
page.on("pageerror", (err) =>
	errors.push(`pageerror: ${err.message || String(err)}`),
);
page.on("console", (msg) => {
	if (msg.type() === "error") {
		const text = msg.text();
		if (text.includes("Failed to load resource") && text.includes("503")) {
			return;
		}
		if (text.includes("does not recognize the") && text.includes("asChild")) {
			return;
		}
		errors.push(`console: ${text}`);
	}
});
page.on("response", (resp) => {
	if (resp.status() >= 500) {
		networkErrors.push({ url: resp.url(), status: resp.status() });
	}
});

try {
	await visit(
		page,
		"/status",
		{ role: "heading", name: /Platform Status/i },
		"status",
	);
	await assertStatusPage(page);
	await assertForwardNavigationSection(page);
	await visit(
		page,
		"/dashboard/deployments",
		{ role: "heading", name: /Deployments/i },
		"deployments",
	);
	await visit(
		page,
		"/dashboard/deployments/new",
		/Create deployment/i,
		"deployments-new",
	);
	await visit(page, "/dashboard/runs", { placeholder: /Filter runs/i }, "runs");
	await visit(
		page,
		"/dashboard/settings",
		{ role: "heading", name: /My Settings/i },
		"settings",
	);
	await visit(
		page,
		"/dashboard/integrations",
		{ role: "heading", name: /Integrations/i },
		"integrations",
	);
	await visit(
		page,
		"/dashboard/fwd/collector",
		{ role: "heading", name: /Collector/i },
		"forward",
	);
	await visit(page, "/dashboard/s3", /S3/i, "s3");
	await visit(page, "/dashboard/labs/designer", /Lab Designer/i, "designer");
	await assertDesignerWorkflow(page);
	await visit(page, "/dashboard/labs/map", /Lab map/i, "lab-map");
	await visit(page, "/dashboard/docs", /Docs/i, "docs");
	await visit(page, "/dashboard/ai", { role: "heading", name: /^AI$/i }, "ai");
	await visit(
		page,
		"/dashboard/servicenow",
		{ role: "heading", name: /ServiceNow/i },
		"servicenow",
	);
	if (deploymentIds.length > 0) {
		const deploymentId = deploymentIds[0];
		await visit(
			page,
			`/dashboard/deployments/${encodeURIComponent(deploymentId)}`,
			/Deployment/i,
			"deployment-detail",
		);
		await visit(
			page,
			`/dashboard/deployments/${encodeURIComponent(deploymentId)}/map`,
			/Topology|Map|Designer/i,
			"deployment-map",
		);
	}
} finally {
	await browser.close();
}

const filteredNetworkErrors = networkErrors.filter((err) => {
	if (err.url.endsWith("/status") || err.url.includes("/status?")) {
		return false;
	}
	if (err.status === 503) {
		if (err.url.includes("/api/registry/")) {
			return false;
		}
		if (err.url.includes("/netlab/templates")) {
			return false;
		}
	}
	return true;
});

if (errors.length > 0 || filteredNetworkErrors.length > 0) {
	console.error("UI E2E errors:");
	for (const err of errors) {
		console.error(`- ${err}`);
	}
	for (const err of filteredNetworkErrors) {
		console.error(`- http ${err.status}: ${err.url}`);
	}
	process.exit(1);
}

console.log("UI E2E checks passed.");

async function assertStatusPage(page) {
	const badWebhooksLinkCount = await page
		.locator('a[href="/dashboard/webhooks"]')
		.count();
	if (badWebhooksLinkCount > 0) {
		throw new Error(
			"Status page still links to /dashboard/webhooks (should be /webhooks).",
		);
	}
	await page.locator('a[href="/webhooks"]').first().waitFor();
	await page
		.getByText(/Tool Integrations/i)
		.first()
		.waitFor();
}

async function assertForwardNavigationSection(page) {
	const sectionButton = page
		.getByRole("button", { name: /^Forward$/i })
		.first();
	await sectionButton.waitFor();
	const assuranceHubLink = page
		.getByRole("link", { name: "Assurance Hub" })
		.first();
	let assuranceVisible = false;
	try {
		assuranceVisible = await assuranceHubLink.isVisible();
	} catch {
		assuranceVisible = false;
	}
	if (!assuranceVisible) {
		await sectionButton.click();
	}
	const expectedLinks = [
		"Assurance Hub",
		"Forward On-Prem",
		"Forward Collector",
		"Routing & Compliance",
	];
	for (const label of expectedLinks) {
		await page.getByRole("link", { name: label }).first().waitFor();
	}
}

async function assertDesignerWorkflow(page) {
	await page
		.getByText(/^Workflow$/i)
		.first()
		.waitFor();
	await page
		.getByText(/^Designer Actions$/i)
		.first()
		.waitFor();
	await page
		.getByRole("button", { name: /^1\. Build$/i })
		.first()
		.waitFor();
	await page
		.getByRole("button", { name: /^2\. Validate$/i })
		.first()
		.waitFor();
	await page
		.getByRole("button", { name: /^3\. Deploy$/i })
		.first()
		.waitFor();
}

async function visit(page, path, expected, name) {
	const url = `${BASE_URL}${path}`;
	await page.goto(url, { waitUntil: "domcontentloaded" });
	if (expected) {
		await waitForExpected(page, expected);
	}
	if (SCREENSHOTS) {
		await takeScreenshot(page, name || path);
	}
}

async function waitForExpected(page, expected) {
	if (typeof expected === "string" || expected instanceof RegExp) {
		await page.getByText(expected, { exact: false }).first().waitFor();
		return;
	}
	if (expected && typeof expected === "object") {
		if (expected.placeholder) {
			await page.getByPlaceholder(expected.placeholder).first().waitFor();
			return;
		}
		if (expected.role && expected.name) {
			await page
				.getByRole(expected.role, { name: expected.name })
				.first()
				.waitFor();
			return;
		}
		if (expected.text) {
			await page.getByText(expected.text, { exact: false }).first().waitFor();
			return;
		}
	}
	throw new Error(`Unsupported expected matcher: ${JSON.stringify(expected)}`);
}

async function takeScreenshot(page, name) {
	const safeName =
		String(name || "page")
			.replace(/[^a-zA-Z0-9_-]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.toLowerCase() || "page";
	screenshotCounter += 1;
	const filename = `${String(screenshotCounter).padStart(2, "0")}-${safeName}.png`;
	await page.screenshot({
		path: `${SCREENSHOT_DIR}/${filename}`,
		fullPage: true,
	});
}

async function seedSession() {
	const resp = await fetch(`${API_URL}/api/admin/e2e/session`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Skyforge-E2E-Token": ADMIN_TOKEN,
		},
		body: JSON.stringify({ username: USERNAME }),
	});

	const setCookieHeader = resp.headers.get("set-cookie") || "";
	const bodyText = await resp.text();
	let body = null;
	if (bodyText) {
		try {
			body = JSON.parse(bodyText);
		} catch {
			body = null;
		}
	}

	if (!resp.ok) {
		const detail = body?.message || body?.error || bodyText || resp.statusText;
		throw new Error(`E2E session seed failed (${resp.status}): ${detail}`);
	}

	const cookieStr = setCookieHeader || body?.cookie || "";
	if (!cookieStr) {
		throw new Error("E2E session seed did not return a cookie");
	}
	return parseCookie(cookieStr);
}

async function assertSSE(cookieHeader) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), SSE_TIMEOUT_MS);
	try {
		const resp = await fetch(`${API_URL}/api/dashboard/events`, {
			headers: { Cookie: cookieHeader },
			signal: controller.signal,
		});
		if (!resp.ok || !resp.body) {
			throw new Error(`SSE failed (${resp.status})`);
		}
		const decoder = new TextDecoder();
		const reader = resp.body.getReader();
		let buffer = "";
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			if (buffer.includes("data:") || buffer.includes("\n:")) {
				await reader.cancel();
				return;
			}
		}
		throw new Error("SSE stream ended without data");
	} finally {
		clearTimeout(timeout);
	}
}

async function listDeploymentIds(cookieHeader) {
	const resp = await fetch(`${API_URL}/api/dashboard/snapshot`, {
		headers: { Cookie: cookieHeader },
	});
	if (!resp.ok) {
		return [];
	}
	const body = await resp.json();
	const deployments = Array.isArray(body?.deployments) ? body.deployments : [];
	return deployments.map((d) => String(d?.id || "")).filter(Boolean);
}

function parseCookie(cookieStr) {
	const parts = cookieStr.split(";");
	if (parts.length === 0) {
		throw new Error("Invalid cookie string");
	}
	const pair = parts[0].trim();
	const idx = pair.indexOf("=");
	if (idx <= 0) {
		throw new Error("Invalid cookie pair");
	}
	return {
		name: pair.slice(0, idx).trim(),
		value: pair.slice(idx + 1).trim(),
	};
}

function envBool(key, fallback) {
	const raw = (process.env[key] || "").trim().toLowerCase();
	if (!raw) return fallback;
	return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function envInt(key, fallback) {
	const raw = (process.env[key] || "").trim();
	if (!raw) return fallback;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveChromiumPath() {
	const fromEnv = [
		process.env.SKYFORGE_UI_E2E_CHROMIUM_PATH,
		process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
	]
		.map((v) => String(v || "").trim())
		.find(Boolean);
	if (fromEnv && isExecutablePath(fromEnv)) {
		console.log(`UI E2E: using Chromium from env path ${fromEnv}`);
		return fromEnv;
	}

	const candidates = [
		"/usr/bin/chromium-browser",
		"/snap/bin/chromium",
		"/usr/bin/chromium",
	];
	const match = candidates.find((p) => isExecutablePath(p));
	if (match) {
		console.log(`UI E2E: using system Chromium at ${match}`);
		return match;
	}
	return "";
}

function isExecutablePath(path) {
	try {
		accessSync(path, constants.X_OK);
		return true;
	} catch {
		return false;
	}
}
