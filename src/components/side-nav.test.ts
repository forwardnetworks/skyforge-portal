import { describe, expect, it } from "vitest";
import { buildSideNavItems } from "./side-nav";

function findGroup(label: string, items: ReturnType<typeof buildSideNavItems>) {
	return items.find((i) => i.label === label);
}

describe("side nav model", () => {
	it("shows Forward section with expected entries when enabled", () => {
		const items = buildSideNavItems(false, { forwardEnabled: true });
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
		const items = buildSideNavItems(false, { forwardEnabled: false });
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
		});
		const labels = items.map((i) => i.label);
		expect(labels).toContain("Quick Deploy");
		expect(labels).not.toContain("Connect");
		expect(labels).not.toContain("Tools");
		expect(labels).not.toContain("Runs");
		expect(labels).not.toContain("Policy Reports");
		expect(labels).toContain("Integrations");
		expect(labels).toContain("Git");
		expect(labels).toContain("Webhooks");
	});

	it("moves Coder Admin under Settings", () => {
		const items = buildSideNavItems(true, { coderEnabled: true });
		const topLevelLabels = items.map((i) => i.label);
		expect(topLevelLabels).not.toContain("Coder Admin");

		const settings = findGroup("Settings", items);
		expect(settings?.children?.map((c) => c.label)).toContain("Coder Admin");
	});
});
