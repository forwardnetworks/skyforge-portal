import { type Locator, type Page, expect, test } from "playwright/test";
import { IMPORT_TOPOLOGY_FIXTURES } from "./fixtures/import-topologies";

const REQUIRED_ENV = [
	"SKYFORGE_SMOKE_BASE_URL",
	"SKYFORGE_SMOKE_USERNAME",
	"SKYFORGE_SMOKE_PASSWORD",
] as const;

const smokeTimeoutMs = parseTimeoutMs("SKYFORGE_SMOKE_TIMEOUT_MS", 30_000);
const allowDeployMutations =
	String(process.env.SKYFORGE_SMOKE_ALLOW_DEPLOY ?? "").trim() === "1";
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

async function getPrimaryUserScopeId(page: Page): Promise<string> {
	const resp = await page.request.get("/api/users");
	if (!resp.ok()) throw new Error("failed to load user scopes");
	const body = (await resp.json()) as { userScopes?: Array<{ id?: string }> };
	const id = String(body.userScopes?.[0]?.id ?? "").trim();
	if (!id) throw new Error("missing primary user scope id");
	return id;
}

async function listDeploymentIDs(
	page: Page,
	userID: string,
): Promise<Set<string>> {
	const resp = await page.request.get(
		`/api/users/${encodeURIComponent(userID)}/deployments`,
	);
	if (!resp.ok()) throw new Error("failed to list deployments");
	const body = (await resp.json()) as { deployments?: Array<{ id?: string }> };
	const ids = new Set<string>();
	for (const deployment of body.deployments ?? []) {
		const id = String(deployment.id ?? "").trim();
		if (id) ids.add(id);
	}
	return ids;
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
		await page.goto("/dashboard/labs/designer", {
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

	const usernameInput = page
		.getByLabel("Username")
		.or(page.getByPlaceholder("Username"))
		.or(page.getByPlaceholder("skyforge"));
	const passwordInput = page
		.getByLabel("Password")
		.or(page.getByPlaceholder("Password"))
		.or(page.getByPlaceholder("Local account password"));
	const submitButton = page
		.getByRole("button", { name: "Sign in" })
		.or(page.getByRole("button", { name: "Sign in to dashboard" }));

	await usernameInput.first().fill(requiredEnv.username || "");
	await passwordInput.first().fill(requiredEnv.password || "");
	await Promise.all([
		page.waitForURL((url) => url.pathname.startsWith("/dashboard"), {
			timeout: smokeTimeoutMs,
		}),
		submitButton.first().click(),
	]);
	await ensureAdvancedMode(page);
}

async function openImportDialog(page: Page): Promise<Locator> {
	if (new URL(page.url()).pathname !== "/dashboard/labs/designer") {
		await page.goto("/dashboard/labs/designer", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
	}
	const advancedToggle = page.getByRole("button", { name: "Advanced" }).first();
	if (await advancedToggle.isVisible().catch(() => false)) {
		const pressed = await advancedToggle.getAttribute("aria-pressed");
		if (pressed !== "true") {
			await advancedToggle.click();
			await page.goto("/dashboard/labs/designer", {
				waitUntil: "domcontentloaded",
				timeout: smokeTimeoutMs,
			});
		}
	}
	await expect(page.getByText("Lab Designer").first()).toBeVisible({
		timeout: smokeTimeoutMs,
	});
	const focusOn = page.getByRole("button", { name: "Focus: on" }).first();
	if (await focusOn.isVisible().catch(() => false)) {
		await focusOn.click();
	}
	await expect(page.getByRole("button", { name: "Import" }).first()).toBeVisible({
		timeout: smokeTimeoutMs,
	});
	await page.getByRole("button", { name: "Import" }).first().click();
	const dialog = page.getByRole("dialog", { name: "Import template" });
	await expect(dialog).toBeVisible({ timeout: smokeTimeoutMs });
	return dialog;
}

async function chooseImportSource(
	page: Page,
	dialog: Locator,
	sourceLabel: string,
): Promise<void> {
	await dialog.getByRole("combobox").nth(2).click();
	await page.getByRole("option", { name: sourceLabel }).click();
}

async function convertAndImportTopology(
	dialog: Locator,
	topologyYAML: string,
): Promise<void> {
	const yamlInput = dialog.getByPlaceholder("Paste topology YAML here...");
	await yamlInput.fill(topologyYAML);
	const convertButton = dialog.getByRole("button", { name: "Convert + Import" });
	await expect(convertButton).toBeEnabled({ timeout: smokeTimeoutMs });
	await convertButton.scrollIntoViewIfNeeded();
	await convertButton.evaluate((el) => (el as HTMLButtonElement).click());
	await expect(dialog.getByText("Last import result")).toBeVisible({
		timeout: smokeTimeoutMs,
	});
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
		const nodeR1 = page.locator(".react-flow__node").filter({ hasText: "r1" }).first();
		const nodeN2 = page.locator(".react-flow__node").filter({ hasText: "n2" }).first();
		await expect(nodeN2).toBeVisible({ timeout: smokeTimeoutMs });

		await nodeR1.click();
		await expect(page.getByRole("tab", { name: /Node \*/ })).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		const nodeTab = page.getByRole("tabpanel", { name: /Node/ });
		const nodeTextboxes = nodeTab.getByRole("textbox");
		await nodeTextboxes.first().fill("r1-renamed");
		await expect(
			page.locator(".react-flow__node").filter({ hasText: "r1-renamed" }).first(),
		).toBeVisible({ timeout: smokeTimeoutMs });

		await page.getByRole("button", { name: "Link: off" }).click();
		await expect(page.getByRole("button", { name: "Link: on" })).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await nodeR1.click();
		await nodeN2.click();
		await expect(page.locator(".react-flow__edge").first()).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		await page
			.locator(".react-flow__edge-interaction")
			.first()
			.click({ button: "right" });
		await page.getByRole("button", { name: "Edit…" }).first().click();
		await expect(page.getByRole("tab", { name: /Link \*/ })).toBeVisible({
			timeout: smokeTimeoutMs,
		});
	});

	test("@smoke-designer parity: pane toggles and palette drag-drop behave deterministically", async ({
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

		await expect(page.getByRole("button", { name: "Header: on" })).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await page.getByRole("button", { name: "Header: on" }).click();
		await expect(page.getByRole("button", { name: "Header: off" })).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await page.getByRole("button", { name: "Header: off" }).click();
		await expect(page.getByRole("button", { name: "Header: on" })).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		await page.getByRole("button", { name: "Palette: on" }).click();
		await expect(page.getByRole("button", { name: "Palette: off" })).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await page.getByRole("button", { name: "Palette: off" }).click();
		await expect(page.getByRole("button", { name: "Palette: on" })).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		await page.getByRole("button", { name: "Inspector: on" }).click();
		await expect(
			page.getByRole("button", { name: "Inspector: off" }),
		).toBeVisible({ timeout: smokeTimeoutMs });
		await page.getByRole("button", { name: "Inspector: off" }).click();
		await expect(page.getByRole("button", { name: "Inspector: on" })).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		const nodeCountBefore = await page.locator(".react-flow__node").count();
		const paletteItem = page.locator("[draggable='true'][role='button']").first();
		await expect(paletteItem).toBeVisible({ timeout: smokeTimeoutMs });
		await paletteItem.dragTo(page.locator(".react-flow").first());

		await expect
			.poll(async () => page.locator(".react-flow__node").count(), {
				timeout: smokeTimeoutMs,
			})
			.toBeGreaterThan(nodeCountBefore);
	});

	test("@smoke-designer parity: palette opens registry catalog workflow in settings", async ({
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

		await page
			.getByRole("link", { name: "Open Registry & NOS Catalog settings" })
			.click();
		await page.waitForURL(
			(url) =>
				url.pathname === "/settings" &&
				url.searchParams.get("section") === "integrations",
			{ timeout: smokeTimeoutMs },
		);
		await expect(page.getByText("Registry & NOS Catalog")).toBeVisible({
			timeout: smokeTimeoutMs,
		});
	});

	test("@smoke-designer parity: node context edit and link editor fields persist", async ({
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

		await page.getByRole("button", { name: "Add node" }).click();
		const nodeR1 = page
			.locator(".react-flow__node")
			.filter({ hasText: "r1" })
			.first();
		const nodeN2 = page
			.locator(".react-flow__node")
			.filter({ hasText: "n2" })
			.first();
		await expect(nodeN2).toBeVisible({ timeout: smokeTimeoutMs });

		await nodeN2.click({ button: "right" });
		await page.getByRole("button", { name: "Edit…" }).first().click();
		await expect(page.getByRole("tab", { name: /Node \*/ })).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		await page.getByRole("button", { name: "Link: off" }).click();
		await nodeR1.click();
		await nodeN2.click();
		await expect(page.locator(".react-flow__edge").first()).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		await page
			.locator(".react-flow__edge-interaction")
			.first()
			.click({ button: "right" });
		await page.getByRole("button", { name: "Edit…" }).first().click();
		await expect(page.getByRole("tab", { name: /Link \*/ })).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		const linkPanel = page.getByRole("tabpanel", { name: /Link/ });
		const linkInputs = linkPanel.locator("input");
		await linkInputs.nth(0).fill("eth10");
		await linkInputs.nth(1).fill("eth11");
		await linkInputs.nth(2).fill("uplink-a");
		await linkInputs.nth(3).fill("9000");
		await linkPanel
			.locator("textarea")
			.first()
			.fill("parity-link-note");

		await nodeR1.click();
		await page
			.locator(".react-flow__edge-interaction")
			.first()
			.click();
		await expect(page.getByRole("tab", { name: /Link \*/ })).toBeVisible({
			timeout: smokeTimeoutMs,
		});

		const persistedInputs = linkPanel.locator("input");
		await expect(persistedInputs.nth(0)).toHaveValue("eth10");
		await expect(persistedInputs.nth(1)).toHaveValue("eth11");
		await expect(persistedInputs.nth(2)).toHaveValue("uplink-a");
		await expect(persistedInputs.nth(3)).toHaveValue("9000");
		await expect(linkPanel.locator("textarea").first()).toHaveValue(
			"parity-link-note",
		);
	});

	test("@smoke-designer parity: quickstart generates deterministic node/link counts", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);
		await page.setViewportSize({ width: 1600, height: 1400 });

		await loginLocal(page);
		await page.goto("/dashboard/labs/designer", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
		await page.waitForURL(
			(url) => url.pathname === "/dashboard/labs/designer",
			{ timeout: smokeTimeoutMs },
		);

		await page.getByRole("button", { name: "Quickstart" }).click();
		await expect(
			page.getByRole("dialog", { name: "Quickstart: Generate CLOS" }),
		).toBeVisible({ timeout: smokeTimeoutMs });

		const dialog = page.getByRole("dialog", { name: "Quickstart: Generate CLOS" });
		await dialog.locator("input").first().fill("clos-parity");
		const numeric = dialog.locator("input[type='number']");
		await numeric.nth(0).fill("1");
		await numeric.nth(1).fill("2");
		await numeric.nth(2).fill("1");

		const imageInputs = dialog.getByPlaceholder("repo:tag");
		await imageInputs.nth(0).fill(
			"ghcr.io/forwardnetworks/kne/cisco_iol:latest",
		);
		await imageInputs.nth(1).fill("ghcr.io/forwardnetworks/kne/linux:latest");
		const generateButton = dialog.getByRole("button", { name: "Generate" });
		await generateButton.scrollIntoViewIfNeeded();
		await generateButton.evaluate((el) =>
			(el as HTMLButtonElement).click(),
		);

		await expect
			.poll(async () => page.locator(".react-flow__node").count(), {
				timeout: smokeTimeoutMs,
			})
			.toBe(5);
		await expect
			.poll(async () => page.locator(".react-flow__edge").count(), {
				timeout: smokeTimeoutMs,
			})
			.toBe(4);
	});

	test("@smoke-designer parity: YAML custom round-trip", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);
		await page.setViewportSize({ width: 1600, height: 1400 });

		await loginLocal(page);
		await page.goto("/dashboard/labs/designer", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
		await page.waitForURL(
			(url) => url.pathname === "/dashboard/labs/designer",
			{ timeout: smokeTimeoutMs },
		);

		await page.getByRole("tab", { name: "YAML" }).click();
		await expect(page.getByRole("button", { name: "Generated" })).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await page.getByRole("button", { name: "Custom" }).click();
		const yamlArea = page.locator("textarea.font-mono").first();
		const customYaml = "name: parity-custom\nkind: ceos\n";
		await yamlArea.fill(customYaml);
		await page.getByRole("button", { name: "Generated" }).click();
		await page.getByRole("button", { name: "Custom" }).click();
		await expect(yamlArea).toHaveValue(customYaml);
	});

	test("@smoke-designer parity: node context Delete removes node", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);
		await page.setViewportSize({ width: 1600, height: 1400 });

		await loginLocal(page);
		await page.goto("/dashboard/labs/designer", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
		await page.waitForURL(
			(url) => url.pathname === "/dashboard/labs/designer",
			{ timeout: smokeTimeoutMs },
		);

		await page.getByRole("button", { name: "Add node" }).click();
		const nodeN2 = page
			.locator(".react-flow__node")
			.filter({ hasText: "n2" })
			.first();
		await expect(nodeN2).toBeVisible({ timeout: smokeTimeoutMs });

		const nodeCount = await page.locator(".react-flow__node").count();
		await nodeN2.dispatchEvent("contextmenu", {
			button: 2,
			bubbles: true,
			cancelable: true,
		});
		const nodeMenu = page.locator("div.absolute.z-50").filter({
			has: page.getByRole("button", { name: "Edit…" }),
		});
		await expect(
			nodeMenu.getByRole("button", { name: "Delete" }).first(),
		).toBeVisible({ timeout: smokeTimeoutMs });
		await nodeMenu.getByRole("button", { name: "Delete" }).first().click();
		await expect
			.poll(async () => page.locator(".react-flow__node").count(), {
				timeout: smokeTimeoutMs,
			})
			.toBe(nodeCount - 1);
	});

	test("@smoke-designer parity: node context Duplicate creates node", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);
		await page.setViewportSize({ width: 1600, height: 1400 });

		await loginLocal(page);
		await page.goto("/dashboard/labs/designer", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
		await page.waitForURL(
			(url) => url.pathname === "/dashboard/labs/designer",
			{ timeout: smokeTimeoutMs },
		);

		await page.getByRole("button", { name: "Add node" }).click();
		const nodeN2 = page
			.locator(".react-flow__node")
			.filter({ hasText: "n2" })
			.first();
		await expect(nodeN2).toBeVisible({ timeout: smokeTimeoutMs });

		const nodeCount = await page.locator(".react-flow__node").count();
		await nodeN2.dispatchEvent("contextmenu", {
			button: 2,
			bubbles: true,
			cancelable: true,
		});
		const nodeMenu = page.locator("div.absolute.z-50").filter({
			has: page.getByRole("button", { name: "Edit…" }),
		});
		await expect(
			nodeMenu.getByRole("button", { name: "Duplicate" }).first(),
		).toBeVisible({ timeout: smokeTimeoutMs });
		await nodeMenu.getByRole("button", { name: "Duplicate" }).first().click();
		await expect
			.poll(async () => page.locator(".react-flow__node").count(), {
				timeout: smokeTimeoutMs,
			})
			.toBe(nodeCount + 1);
	});

	test("@smoke-designer parity: containerlab import via generic source selector", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);
		await page.setViewportSize({ width: 1600, height: 1400 });

		await loginLocal(page);
		await page.goto("/dashboard/labs/designer", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
		await page.waitForURL(
			(url) => url.pathname === "/dashboard/labs/designer",
			{ timeout: smokeTimeoutMs },
		);

		const dialog = await openImportDialog(page);
		await convertAndImportTopology(
			dialog,
			IMPORT_TOPOLOGY_FIXTURES.containerlabMinimal,
		);
		await expect(dialog.getByText("Ready")).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await expect(dialog.getByText("Source: containerlab")).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await expect(
			dialog.getByText(/Issues: \d+ errors, \d+ warnings, \d+ info/),
		).toBeVisible({ timeout: smokeTimeoutMs });
		await expect(
			page.locator(".react-flow__node").filter({ hasText: "h1" }).first(),
		).toBeVisible({ timeout: smokeTimeoutMs });
	});

	test("@smoke-designer parity: deploy launch request is accepted for imported topology", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);
		test.skip(
			!allowDeployMutations,
			"Set SKYFORGE_SMOKE_ALLOW_DEPLOY=1 to enable deployment launch coverage",
		);
		await page.setViewportSize({ width: 1600, height: 1400 });

		await loginLocal(page);
		await page.goto("/dashboard/labs/designer", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
		await page.waitForURL(
			(url) => url.pathname === "/dashboard/labs/designer",
			{ timeout: smokeTimeoutMs },
		);
		const userID = await getPrimaryUserScopeId(page);
		const beforeDeploymentIDs = await listDeploymentIDs(page, userID);

		const dialog = await openImportDialog(page);
		const uniqueName = `clab-deploy-smoke-${Date.now()}`;
		await convertAndImportTopology(
			dialog,
			IMPORT_TOPOLOGY_FIXTURES.containerlabDeploy.replace(
				"name: clab-deploy-smoke",
				`name: ${uniqueName}`,
			),
		);
		await expect(dialog.getByText("Ready")).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await expect(
			page.locator(".react-flow__node").filter({ hasText: "h1" }).first(),
		).toBeVisible({ timeout: smokeTimeoutMs });

		await page.getByRole("button", { name: "Deploy" }).click();
		await expect
			.poll(
				async () => {
					const afterDeploymentIDs = await listDeploymentIDs(page, userID);
					for (const id of afterDeploymentIDs) {
						if (!beforeDeploymentIDs.has(id)) return true;
					}
					return false;
				},
				{ timeout: smokeTimeoutMs },
			)
			.toBe(true);
	});

	test("@smoke-designer parity: eve-ng import converts a minimal topology", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);
		await page.setViewportSize({ width: 1600, height: 1400 });

		await loginLocal(page);
		await page.goto("/dashboard/labs/designer", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
		await page.waitForURL(
			(url) => url.pathname === "/dashboard/labs/designer",
			{ timeout: smokeTimeoutMs },
		);

		const dialog = await openImportDialog(page);
		await chooseImportSource(page, dialog, "EVE-NG");
		await convertAndImportTopology(dialog, IMPORT_TOPOLOGY_FIXTURES.eveMinimal);
		await expect(dialog.getByText("Ready")).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await expect(dialog.getByText("Source: eve-ng")).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await expect(
			page.locator(".react-flow__node").filter({ hasText: "h1" }).first(),
		).toBeVisible({ timeout: smokeTimeoutMs });
	});

	test("@smoke-designer parity: gns3 import converts a minimal topology", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);
		await page.setViewportSize({ width: 1600, height: 1400 });

		await loginLocal(page);
		await page.goto("/dashboard/labs/designer", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
		await page.waitForURL(
			(url) => url.pathname === "/dashboard/labs/designer",
			{ timeout: smokeTimeoutMs },
		);

		const dialog = await openImportDialog(page);
		await chooseImportSource(page, dialog, "GNS3");
		await convertAndImportTopology(dialog, IMPORT_TOPOLOGY_FIXTURES.gns3Minimal);
		await expect(dialog.getByText("Ready")).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await expect(dialog.getByText("Source: gns3")).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await expect(
			page.locator(".react-flow__node").filter({ hasText: "h1" }).first(),
		).toBeVisible({ timeout: smokeTimeoutMs });
	});

	test("@smoke-designer parity: gns3 JSON import converts a minimal topology", async ({
		page,
	}) => {
		test.skip(missingRequiredEnv.length > 0, missingEnvMessage);
		await page.setViewportSize({ width: 1600, height: 1400 });

		await loginLocal(page);
		await page.goto("/dashboard/labs/designer", {
			waitUntil: "domcontentloaded",
			timeout: smokeTimeoutMs,
		});
		await page.waitForURL(
			(url) => url.pathname === "/dashboard/labs/designer",
			{ timeout: smokeTimeoutMs },
		);

		const dialog = await openImportDialog(page);
		await chooseImportSource(page, dialog, "GNS3");
		await convertAndImportTopology(dialog, IMPORT_TOPOLOGY_FIXTURES.gns3JsonMinimal);
		await expect(dialog.getByText("Ready")).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await expect(dialog.getByText("Source: gns3")).toBeVisible({
			timeout: smokeTimeoutMs,
		});
		await expect(
			page.locator(".react-flow__node").filter({ hasText: "h1" }).first(),
		).toBeVisible({ timeout: smokeTimeoutMs });
	});
});
