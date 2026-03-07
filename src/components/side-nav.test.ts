import { describe, expect, it } from "vitest";
import { buildSideNavItems } from "./side-nav";
import { buildLoginUrl } from "../lib/skyforge-config";

function findGroup(label: string, items: ReturnType<typeof buildSideNavItems>) {
	return items.find((i) => i.label === label);
}

describe("side nav model", () => {
	it("shows Forward section with expected entries when enabled", () => {
			const items = buildSideNavItems(
				false,
				{ forwardEnabled: true },
				"local",
			);
		const forward = findGroup("Forward", items);

		expect(forward).toBeDefined();
		expect(forward?.children?.map((c) => c.label)).toEqual(
			expect.arrayContaining([
				"Credentials",
				"Collector",
				"Cluster",
				"Analytics",
			]),
		);
		const credentialItem = forward?.children?.find(
			(c) => c.label === "Credentials",
		);
		const collectorItem = forward?.children?.find(
			(c) => c.label === "Collector",
		);
		expect(credentialItem?.href).toBe("/dashboard/forward/credentials");
		expect(collectorItem?.href).toBe("/dashboard/forward/collectors");
	});

	it("hides Forward section when forward feature is disabled", () => {
			const items = buildSideNavItems(
				false,
				{ forwardEnabled: false },
				"local",
			);
		const forward = findGroup("Forward", items);
		const labels = items.map((i) => i.label);

		expect(forward).toBeUndefined();
		expect(labels).not.toContain("Quick Deploy");
	});

	it("removes Connect/Tools groupings and legacy nav items", () => {
		const items = buildSideNavItems(false, {
			forwardEnabled: true,
			giteaEnabled: true,
			coderEnabled: true,
			yaadeEnabled: true,
			nautobotEnabled: true,
		}, "local");
		const labels = items.map((i) => i.label);
		expect(labels).toContain("Quick Deploy");
		expect(labels).not.toContain("Connect");
		expect(labels).not.toContain("Tools");
		expect(labels).not.toContain("Runs");
		expect(labels).not.toContain("Policy Reports");
		expect(labels).toContain("Integrations");
		expect(labels).toContain("Git");
		expect(labels).toContain("Webhooks");
		const coder = items.find((i) => i.label === "Coder");
			expect(coder?.href).toBe(buildLoginUrl("/coder/", "local"));
		const nautobot = items.find((i) => i.label === "Nautobot");
			expect(nautobot?.href).toBe(buildLoginUrl("/nautobot/", "local"));
	});

	it("moves Coder Admin under Settings", () => {
		const items = buildSideNavItems(true, { coderEnabled: true }, "local");
		const topLevelLabels = items.map((i) => i.label);
		expect(topLevelLabels).not.toContain("Coder Admin");

		const settings = findGroup("Settings", items);
		expect(settings?.children?.map((c) => c.label)).toContain("Coder Admin");
		const coderAdmin = settings?.children?.find((c) => c.label === "Coder Admin");
		expect(coderAdmin?.href).toBe(buildLoginUrl("/coder/", "local"));
	});

	it("uses direct tool links once the session is authenticated", () => {
		const items = buildSideNavItems(
			{ authenticated: true, roles: ["ADMIN"] },
			{ coderEnabled: true, nautobotEnabled: true },
			"local",
		);
		const coder = items.find((i) => i.label === "Coder");
		const nautobot = items.find((i) => i.label === "Nautobot");
		expect(coder?.href).toBe("/coder/");
		expect(nautobot?.href).toBe("/nautobot/");
	});
});
