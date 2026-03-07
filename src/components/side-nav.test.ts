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
			netboxEnabled: true,
			jiraEnabled: true,
			rapid7Enabled: true,
			infobloxEnabled: true,
			dnsEnabled: true,
		}, "local");
		const labels = items.map((i) => i.label);
		expect(labels).toContain("Quick Deploy");
		expect(labels).not.toContain("Connect");
		expect(labels).not.toContain("Tools");
		expect(labels).not.toContain("Runs");
		expect(labels).not.toContain("Policy Reports");
		expect(labels).toContain("Integrations");
		expect(labels).toContain("Platform");
		expect(labels).toContain("Settings");
		expect(labels).not.toContain("Git");
		expect(labels).not.toContain("Webhooks");

		const integrations = findGroup("Integrations", items);
		expect(integrations?.children?.map((c) => c.label)).toEqual(
			expect.arrayContaining([
				"Overview",
				"ServiceNow",
				"NetBox",
				"Nautobot",
				"Jira",
				"Rapid7",
				"Infoblox",
				"Infoblox Console",
			]),
		);

		const platform = findGroup("Platform", items);
		expect(platform?.children?.map((c) => c.label)).toEqual(
			expect.arrayContaining([
				"Git",
				"Artifacts",
				"DNS",
				"Coder",
				"API Testing",
				"Webhooks",
				"Syslog",
				"SNMP",
			]),
		);
		const coder = platform?.children?.find((c) => c.label === "Coder");
		expect(coder?.href).toBe(buildLoginUrl("/coder/", "local"));
		const nautobot = integrations?.children?.find((c) => c.label === "Nautobot");
		expect(nautobot?.href).toBe(buildLoginUrl("/nautobot/", "local"));
	});

	it("collapses admin controls into settings hub", () => {
		const items = buildSideNavItems(true, { coderEnabled: true }, "local");
		const settings = items.find((i) => i.label === "Settings");
		expect(settings).toBeDefined();
		expect(settings?.children).toBeUndefined();
		expect(settings?.href).toBe("/settings");
	});

	it("uses direct tool links once the session is authenticated", () => {
		const items = buildSideNavItems(
			{ authenticated: true, roles: ["ADMIN"] },
			{ coderEnabled: true, nautobotEnabled: true },
			"local",
		);
		const platform = findGroup("Platform", items);
		const integrations = findGroup("Integrations", items);
		const coder = platform?.children?.find((i) => i.label === "Coder");
		const nautobot = integrations?.children?.find((i) => i.label === "Nautobot");
		expect(coder?.href).toBe("/coder/");
		expect(nautobot?.href).toBe("/nautobot/");
	});
});
