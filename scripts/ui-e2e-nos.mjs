import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE_URL = (
	process.env.SKYFORGE_UI_E2E_BASE_URL ||
	"https://skyforge.local.forwardnetworks.com"
).replace(/\/$/, "");
const API_URL = (process.env.SKYFORGE_UI_E2E_API_URL || BASE_URL).replace(
	/\/$/,
	"",
);
const ADMIN_TOKEN = (process.env.SKYFORGE_UI_E2E_ADMIN_TOKEN || "").trim();
const USERNAME = (
	process.env.SKYFORGE_UI_E2E_USERNAME || "craigjohnson"
).trim();
const REQUIRE_INAPP = envBool("SKYFORGE_UI_E2E_REQUIRE_INAPP", true);
const INAPP_FORWARD_URL = (
	process.env.SKYFORGE_UI_E2E_INAPP_FORWARD_URL ||
	"http://fwd-appserver.forward.svc.cluster.local:8080"
).trim();
const INAPP_FORWARD_USERNAME = (
	process.env.SKYFORGE_UI_E2E_INAPP_FORWARD_USERNAME || ""
).trim();
const INAPP_FORWARD_PASSWORD = (
	process.env.SKYFORGE_UI_E2E_INAPP_FORWARD_PASSWORD || ""
).trim();
const FORWARD_BASE_URL = (
	process.env.SKYFORGE_E2E_FORWARD_BASE_URL || ""
).trim();
const FORWARD_USERNAME = (
	process.env.SKYFORGE_E2E_FORWARD_USERNAME || ""
).trim();
const FORWARD_PASSWORD = (
	process.env.SKYFORGE_E2E_FORWARD_PASSWORD || ""
).trim();
const SCREENSHOT_DIR = (
	process.env.SKYFORGE_UI_E2E_SCREENSHOT_DIR || "e2e-artifacts/ui-nos"
).trim();
const HEADLESS = envBool("SKYFORGE_UI_E2E_HEADLESS", true);
const TIMEOUT_MS = envInt("SKYFORGE_UI_E2E_TIMEOUT_MS", 30_000);
const DEPLOY_TIMEOUT_MS = envInt(
	"SKYFORGE_UI_E2E_DEPLOY_TIMEOUT_MS",
	35 * 60_000,
);
const CLEANUP_PASS = envBool("SKYFORGE_UI_E2E_CLEANUP_PASS", true);

const DEVICE_CSV = (
	process.env.SKYFORGE_UI_E2E_NOS ||
	"eos,iol,iosxr,nxos,cumulus,sros,asav,fortios,vmx,vjunos-router,vjunos-switch,arubacx,dellos10,vptx,linux"
).trim();
const DEVICES = DEVICE_CSV.split(",")
	.map((v) => v.trim())
	.filter(Boolean);

if (!ADMIN_TOKEN) {
	console.error("Missing SKYFORGE_UI_E2E_ADMIN_TOKEN.");
	process.exit(1);
}
if (DEVICES.length === 0) {
	console.error("No devices configured. Set SKYFORGE_UI_E2E_NOS.");
	process.exit(1);
}

mkdirSync(SCREENSHOT_DIR, { recursive: true });

const cookie = await seedSession();
const cookieHeader = `${cookie.name}=${cookie.value}`;
const userScope = await ensureUserScope(cookieHeader);
const collector = await resolveCollector(cookieHeader);

const browser = await chromium.launch({ headless: HEADLESS });
const context = await browser.newContext({
	viewport: { width: 1440, height: 900 },
});
await context.addCookies([
	{ name: cookie.name, value: cookie.value, url: BASE_URL },
]);
const page = await context.newPage();
page.setDefaultTimeout(TIMEOUT_MS);

const summary = [];
let screenshotCounter = 0;
const runStartedAt = Date.now();

try {
	for (const device of DEVICES) {
		const name = `e2e-${device}-${Date.now().toString().slice(-6)}`;
		log(`[${device}] start deployment flow (${name})`);
		const row = {
			device,
			deploymentId: "",
			runId: "",
			status: "unknown",
			forwardNetworkId: "",
			error: "",
		};
		try {
			log(`[${device}] create deployment API`);
			const deployment = await createDeployment(
				cookieHeader,
				userScope.id,
				name,
				device,
				collector?.id || "",
			);
			row.deploymentId = deployment.id;
			log(`[${device}] deployment created id=${row.deploymentId}`);

			log(`[${device}] open deployment detail page`);
			await gotoAndShot(
				page,
				`/dashboard/deployments/${encodeURIComponent(deployment.id)}`,
				`${device}-detail-created`,
			);

			log(`[${device}] trigger create action`);
			const run = await runDeploymentAction(
				cookieHeader,
				userScope.id,
				deployment.id,
				"create",
			);
			row.runId = String(run?.id ?? run?.task_id ?? "");
			log(`[${device}] run started id=${row.runId || "unknown"}`);

			log(`[${device}] wait for ready`);
			await waitForDeploymentReady(cookieHeader, deployment.id);
			log(`[${device}] deployment ready`);

			if (collector?.id) {
				log(`[${device}] enable forward and trigger sync`);
				await configureAndSyncForward(
					cookieHeader,
					userScope.id,
					deployment.id,
					String(collector.id),
				);
				log(`[${device}] wait for forward network id`);
				row.forwardNetworkId = await waitForForwardNetworkID(
					cookieHeader,
					userScope.id,
					deployment.id,
					3 * 60_000,
				);
				log(
					`[${device}] forward network id resolved: ${row.forwardNetworkId || "none"}`,
				);
			}

			log(`[${device}] open map page`);
			await gotoAndShot(
				page,
				`/dashboard/deployments/${encodeURIComponent(deployment.id)}/map`,
				`${device}-map-ready`,
			);

			const info = await getDeploymentInfo(
				cookieHeader,
				userScope.id,
				deployment.id,
			);
			row.forwardNetworkId =
				row.forwardNetworkId || info.forwardNetworkId || "";
			log(
				`[${device}] deployment info forwardNetworkId=${row.forwardNetworkId || "none"}`,
			);

			if (
				row.forwardNetworkId &&
				FORWARD_BASE_URL &&
				FORWARD_USERNAME &&
				FORWARD_PASSWORD
			) {
				log(`[${device}] verify forward SNMPv2 deep check`);
				await verifyForwardSNMPv2(row.forwardNetworkId, device);
				log(`[${device}] forward verify passed`);
			}

			row.status = "pass";
			if (CLEANUP_PASS) {
				log(`[${device}] cleanup delete deployment`);
				await deleteDeployment(cookieHeader, userScope.id, deployment.id);
				log(`[${device}] cleanup done`);
			}
			log(`[${device}] PASS`);
		} catch (err) {
			row.status = "fail";
			row.error = String(err?.message || err);
			log(`[${device}] FAIL: ${row.error}`);
			await gotoAndShot(page, "/dashboard/deployments", `${device}-failed`);
		}
		summary.push(row);
	}
} finally {
	await browser.close();
}

const failed = summary.filter((r) => r.status !== "pass");
for (const row of summary) {
	console.log(
		JSON.stringify({
			device: row.device,
			status: row.status,
			deploymentId: row.deploymentId,
			runId: row.runId,
			forwardNetworkId: row.forwardNetworkId,
			error: row.error,
		}),
	);
}

if (failed.length > 0) {
	console.error(
		`ui-nos e2e failed for ${failed.length}/${summary.length} device(s).`,
	);
	process.exit(1);
}
console.log(`ui-nos e2e passed for ${summary.length} device(s).`);
log(`run completed in ${Math.round((Date.now() - runStartedAt) / 1000)}s`);

async function gotoAndShot(page, path, name) {
	await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
	screenshotCounter += 1;
	const file = `${String(screenshotCounter).padStart(2, "0")}-${sanitize(name)}.png`;
	await page.screenshot({
		path: `${SCREENSHOT_DIR}/${file}`,
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
	if (!resp.ok) {
		throw new Error(`E2E session seed failed (${resp.status}): ${bodyText}`);
	}
	if (!setCookieHeader) {
		throw new Error("E2E session seed did not return a cookie");
	}
	return parseCookie(setCookieHeader);
}

async function ensureUserScope(cookieHeader) {
	const body = await apiJSON("GET", "/api/users", cookieHeader);
	const userScopes = Array.isArray(body?.userScopes) ? body.userScopes : [];
	if (userScopes.length > 0) {
		const first = userScopes[0];
		return { id: String(first.id || ""), slug: String(first.slug || "") };
	}
	const create = await apiJSON("POST", "/api/users", cookieHeader, {
		name: "E2E User Scope",
		slug: `e2e-${Date.now()}`,
		description: "ui-nos e2e seed user scope",
		isPublic: false,
	});
	return { id: String(create?.id || ""), slug: String(create?.slug || "") };
}

async function resolveCollector(cookieHeader) {
	const listCollectors = async () => {
		const body = await apiJSON(
			"GET",
			"/api/forward/collector-configs",
			cookieHeader,
		);
		return Array.isArray(body?.collectors) ? body.collectors : [];
	};

	let collectors = await listCollectors();
	if (collectors.length === 0) return null;

	const inAppHost = hostFromURL(INAPP_FORWARD_URL);
	const inAppCollectors = collectors.filter((c) =>
		isInAppCollector(c, inAppHost),
	);

	const preferredID = (process.env.SKYFORGE_UI_E2E_COLLECTOR_ID || "").trim();
	if (preferredID) {
		const hit = collectors.find((c) => String(c?.id || "") === preferredID);
		if (hit) {
			if (REQUIRE_INAPP && !isInAppCollector(hit, inAppHost)) {
				throw new Error(
					`collector ${preferredID} is not in-app (${String(hit?.baseUrl || "")})`,
				);
			}
			return hit;
		}
	}

	if (inAppCollectors.length > 0) {
		return inAppCollectors[0];
	}

	if (REQUIRE_INAPP) {
		if (INAPP_FORWARD_USERNAME && INAPP_FORWARD_PASSWORD) {
			log(
				`[collector] creating in-app collector profile for ${INAPP_FORWARD_URL}`,
			);
			await apiJSON("POST", "/api/forward/collector-configs", cookieHeader, {
				name: `__profile__:${INAPP_FORWARD_USERNAME}@${inAppHost}`,
				baseUrl: INAPP_FORWARD_URL,
				skipTlsVerify: true,
				username: INAPP_FORWARD_USERNAME,
				password: INAPP_FORWARD_PASSWORD,
				setDefault: false,
			});
			collectors = await listCollectors();
			const retryInApp = collectors.find((c) => isInAppCollector(c, inAppHost));
			if (retryInApp) return retryInApp;
		}
		throw new Error(
			`no in-app collector configured (host=${inAppHost}); refusing to use non in-app collectors`,
		);
	}

	return collectors[0];
}

async function createDeployment(
	cookieHeader,
	userId,
	name,
	device,
	_collectorID,
) {
	const body = {
		name,
		type: "netlab-c9s",
		config: {
			templateSource: "blueprints",
			templatesDir: "netlab/_e2e/minimal",
			template: "topology.yml",
			environment: { NETLAB_DEVICE: device },
		},
	};
	return apiJSON(
		"POST",
		`/api/users/${encodeURIComponent(userId)}/deployments`,
		cookieHeader,
		body,
	);
}

async function runDeploymentAction(cookieHeader, userId, deploymentId, action) {
	const body = await apiJSON(
		"POST",
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/action`,
		cookieHeader,
		{ action },
	);
	return body?.run || {};
}

async function waitForDeploymentReady(cookieHeader, deploymentId) {
	const deadline = Date.now() + DEPLOY_TIMEOUT_MS;
	let poll = 0;
	let lastStatus = "";
	let lastActive = "";
	while (Date.now() < deadline) {
		poll += 1;
		const snap = await apiJSON("GET", "/api/dashboard/snapshot", cookieHeader);
		const deployments = Array.isArray(snap?.deployments)
			? snap.deployments
			: [];
		const hit = deployments.find((d) => String(d?.id || "") === deploymentId);
		if (hit) {
			const status = String(hit?.lastStatus || "").toLowerCase();
			const active = String(hit?.activeTaskStatus || "").toLowerCase();
			if (status !== lastStatus || active !== lastActive || poll % 6 === 0) {
				log(
					`[wait] deployment=${deploymentId} poll=${poll} status=${status || "-"} active=${active || "-"} queueDepth=${String(hit?.queueDepth ?? "-")}`,
				);
				lastStatus = status;
				lastActive = active;
			}
			if (
				["ready", "running", "started", "success", "succeeded"].includes(
					status,
				) &&
				active === ""
			)
				return;
			if (["failed", "error", "canceled", "cancelled"].includes(status)) {
				throw new Error(`deployment failed with status=${status}`);
			}
		} else if (poll % 6 === 0) {
			log(`[wait] deployment=${deploymentId} poll=${poll} not yet in snapshot`);
		}
		await sleep(5000);
	}
	throw new Error("deployment readiness timeout");
}

async function getDeploymentInfo(cookieHeader, userId, deploymentId) {
	const body = await apiJSON(
		"GET",
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/info`,
		cookieHeader,
	);
	return {
		forwardNetworkId: String(body?.forwardNetworkId || "").trim(),
	};
}

async function deleteDeployment(cookieHeader, userId, deploymentId) {
	await apiJSON(
		"DELETE",
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}?forward_delete=true`,
		cookieHeader,
	);
}

async function configureAndSyncForward(
	cookieHeader,
	userId,
	deploymentId,
	collectorConfigID,
) {
	await apiJSON(
		"PUT",
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/forward`,
		cookieHeader,
		{
			enabled: true,
			collectorConfigId: collectorConfigID,
		},
	);
	await apiJSON(
		"POST",
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/forward/sync`,
		cookieHeader,
		{},
	);
}

async function waitForForwardNetworkID(
	cookieHeader,
	userId,
	deploymentId,
	timeoutMs,
) {
	const deadline = Date.now() + timeoutMs;
	let poll = 0;
	while (Date.now() < deadline) {
		poll += 1;
		const info = await getDeploymentInfo(cookieHeader, userId, deploymentId);
		const id = String(info.forwardNetworkId || "").trim();
		if (id) return id;
		if (poll % 3 === 0) {
			log(
				`[wait] deployment=${deploymentId} forwardNetworkId pending (poll=${poll})`,
			);
		}
		await sleep(5000);
	}
	throw new Error("forward network id timeout after sync");
}

async function verifyForwardSNMPv2(networkId, device) {
	const auth = `Basic ${Buffer.from(`${FORWARD_USERNAME}:${FORWARD_PASSWORD}`).toString("base64")}`;
	const base = FORWARD_BASE_URL.replace(/\/$/, "");
	const classic = await rawJSON(
		`${base}/api/networks/${encodeURIComponent(networkId)}/classic-devices`,
		{ Authorization: auth },
	);
	const classicRows = parseArray(classic);
	if (classicRows.length === 0) {
		throw new Error(`forward network ${networkId} has no classic devices`);
	}
	if (device !== "linux") {
		const first = classicRows[0] || {};
		const snmpID = String(first?.snmpCredentialId || "").trim();
		const enabled = Boolean(first?.enableSnmpCollection);
		if (!snmpID || !enabled) {
			throw new Error(
				`forward SNMP check failed for ${device}: missing snmpCredentialId/enableSnmpCollection`,
			);
		}
	}
	const credsBody = await rawJSON(
		`${base}/api/networks/${encodeURIComponent(networkId)}/snmpCredentials`,
		{ Authorization: auth },
	);
	const creds = parseArray(credsBody);
	const hasV2 = creds.some((c) => {
		const version = String(c?.version || "").toLowerCase();
		return version === "v2" || version === "v2c";
	});
	if (device !== "linux" && !hasV2) {
		throw new Error(
			`no SNMPv2 credential found in Forward network ${networkId}`,
		);
	}
}

async function apiJSON(method, path, cookieHeader, body) {
	const resp = await fetch(`${API_URL}${path}`, {
		method,
		headers: {
			...(body ? { "Content-Type": "application/json" } : {}),
			Cookie: cookieHeader,
		},
		body: body ? JSON.stringify(body) : undefined,
	});
	const text = await resp.text();
	const parsed = text ? safeJSON(text) : {};
	if (!resp.ok) {
		throw new Error(`${method} ${path} failed (${resp.status}): ${text}`);
	}
	return parsed;
}

async function rawJSON(url, headers = {}) {
	const resp = await fetch(url, { headers });
	const text = await resp.text();
	const parsed = text ? safeJSON(text) : {};
	if (!resp.ok) {
		throw new Error(`GET ${url} failed (${resp.status}): ${text}`);
	}
	return parsed;
}

function parseArray(payload) {
	if (Array.isArray(payload)) return payload;
	for (const key of [
		"items",
		"data",
		"results",
		"devices",
		"classicDevices",
		"snmpCredentials",
	]) {
		if (Array.isArray(payload?.[key])) return payload[key];
	}
	return [];
}

function parseCookie(cookieStr) {
	const parts = cookieStr.split(";");
	const pair = (parts[0] || "").trim();
	const idx = pair.indexOf("=");
	if (idx <= 0) throw new Error("Invalid cookie pair");
	return { name: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() };
}

function safeJSON(text) {
	try {
		return JSON.parse(text);
	} catch {
		return { raw: text };
	}
}

function sanitize(name) {
	return String(name)
		.replace(/[^a-zA-Z0-9_-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.toLowerCase();
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

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg) {
	const ts = new Date().toISOString();
	console.log(`[ui-nos ${ts}] ${msg}`);
}

function hostFromURL(raw) {
	const s = String(raw || "").trim();
	try {
		return new URL(s).hostname.toLowerCase();
	} catch {
		return s.toLowerCase();
	}
}

function isInAppCollector(collector, inAppHost) {
	const base = String(collector?.baseUrl || "").trim();
	const host = hostFromURL(base);
	return host === inAppHost;
}
