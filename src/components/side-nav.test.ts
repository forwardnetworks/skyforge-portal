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
		expect(credentialItem?.href).toBe("/dashboard/forward/credentials");
	});

	it("hides Forward section when forward feature is disabled", () => {
		const items = buildSideNavItems(false, { forwardEnabled: false });
		const forward = findGroup("Forward", items);

		expect(forward).toBeUndefined();
	});

	it("removes Connect/Tools groupings and legacy nav items", () => {
		const items = buildSideNavItems(false, {
			forwardEnabled: true,
			giteaEnabled: true,
			coderEnabled: true,
			yaadeEnabled: true,
		});
		const labels = items.map((i) => i.label);
		expect(labels).not.toContain("Connect");
		expect(labels).not.toContain("Tools");
		expect(labels).not.toContain("Runs");
		expect(labels).not.toContain("Policy Reports");
		expect(labels).toContain("Integrations");
		expect(labels).toContain("Git");
		expect(labels).toContain("Webhooks");
	});
});
