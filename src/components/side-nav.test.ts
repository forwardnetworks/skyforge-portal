import { describe, expect, it } from "vitest";
import { type ToolLaunchMap, toolRouteHref } from "../lib/tool-launches";
import { buildSideNavItems } from "./side-nav";

const toolLaunches: ToolLaunchMap = {
	"forward-cluster": {
		id: "forward-cluster",
		title: "Forward Cluster",
		category: "forward",
		experience: "both",
		navigationSection: "forward",
		navigationLabel: "Cluster",
		navigationOrder: 10,
		navigationIcon: "network",
		navigationHref: "/api/forward/session",
		navigationMode: "direct",
		launchMode: "new_tab",
	},
	netbox: {
		id: "netbox",
		title: "NetBox",
		category: "integrations",
		experience: "advanced",
		navigationSection: "integrations",
		navigationOrder: 10,
		navigationIcon: "network",
		navigationHref: toolRouteHref("netbox"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	nautobot: {
		id: "nautobot",
		title: "Nautobot",
		category: "integrations",
		experience: "advanced",
		navigationSection: "integrations",
		navigationOrder: 20,
		navigationIcon: "network",
		navigationHref: toolRouteHref("nautobot"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	jira: {
		id: "jira",
		title: "Jira",
		category: "integrations",
		experience: "advanced",
		navigationSection: "integrations",
		navigationOrder: 30,
		navigationIcon: "workflow",
		navigationHref: toolRouteHref("jira"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	rapid7: {
		id: "rapid7",
		title: "Rapid7",
		category: "integrations",
		experience: "advanced",
		navigationSection: "integrations",
		navigationOrder: 40,
		navigationIcon: "workflow",
		navigationHref: toolRouteHref("rapid7"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	elk: {
		id: "elk",
		title: "ELK",
		category: "integrations",
		experience: "advanced",
		navigationSection: "integrations",
		navigationOrder: 50,
		navigationIcon: "database",
		navigationHref: toolRouteHref("elk"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	infoblox: {
		id: "infoblox",
		title: "Infoblox",
		category: "integrations",
		experience: "advanced",
		navigationSection: "integrations",
		navigationOrder: 60,
		navigationIcon: "server",
		navigationHref: toolRouteHref("infoblox"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	git: {
		id: "git",
		title: "Git",
		category: "platform",
		experience: "advanced",
		navigationSection: "platform",
		navigationOrder: 10,
		navigationIcon: "git-branch",
		navigationHref: toolRouteHref("git"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	artifacts: {
		id: "artifacts",
		title: "Artifacts",
		category: "platform",
		experience: "advanced",
		navigationSection: "platform",
		navigationOrder: 20,
		navigationIcon: "inbox",
		navigationHref: toolRouteHref("artifacts"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	dns: {
		id: "dns",
		title: "DNS",
		category: "platform",
		experience: "advanced",
		navigationSection: "platform",
		navigationOrder: 30,
		navigationIcon: "network",
		navigationHref: toolRouteHref("dns"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	coder: {
		id: "coder",
		title: "Coder",
		category: "platform",
		experience: "advanced",
		navigationSection: "platform",
		navigationOrder: 40,
		navigationIcon: "cloud",
		navigationHref: toolRouteHref("coder"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	grafana: {
		id: "grafana",
		title: "Grafana",
		category: "platform",
		experience: "advanced",
		navigationSection: "platform",
		navigationOrder: 50,
		navigationIcon: "activity",
		navigationHref: toolRouteHref("grafana"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	prometheus: {
		id: "prometheus",
		title: "Prometheus",
		category: "platform",
		experience: "advanced",
		navigationSection: "platform",
		navigationOrder: 60,
		navigationIcon: "activity",
		navigationHref: toolRouteHref("prometheus"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	"api-testing": {
		id: "api-testing",
		title: "API Testing",
		category: "platform",
		experience: "advanced",
		navigationSection: "platform",
		navigationOrder: 70,
		navigationIcon: "panel-top",
		navigationHref: toolRouteHref("api-testing"),
		navigationMode: "router",
		launchMode: "embedded",
	},
};

function findGroup(label: string, items: ReturnType<typeof buildSideNavItems>) {
	return items.find((i) => i.label === label);
}

describe("side nav model", () => {
	it("shows Forward section with expected entries when enabled", () => {
		const items = buildSideNavItems(
			false,
			{ forwardEnabled: true },
			"local",
			"advanced",
			toolLaunches,
		);
		const forward = findGroup("Forward", items);

		expect(forward).toBeDefined();
		expect(forward?.children?.map((c) => c.label)).toEqual(
			expect.arrayContaining([
				"Credentials",
				"Collector",
				"Cluster",
				"Analytics",
				"ServiceNow",
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
			"simple",
			toolLaunches,
		);
		const forward = findGroup("Forward", items);
		const labels = items.map((i) => i.label);

		expect(forward).toBeUndefined();
		expect(labels).not.toContain("Launch Lab");
	});

	it("removes Connect/Tools groupings and legacy nav items", () => {
		const items = buildSideNavItems(
			{ authenticated: true, roles: ["ADMIN"] },
			{
				forwardEnabled: true,
				giteaEnabled: true,
				coderEnabled: true,
				yaadeEnabled: true,
				nautobotEnabled: true,
				netboxEnabled: true,
				jiraEnabled: true,
				rapid7Enabled: true,
				elkEnabled: true,
				infobloxEnabled: true,
				dnsEnabled: true,
				swaggerUIEnabled: true,
			},
			"local",
			"advanced",
			toolLaunches,
		);
		const labels = items.map((i) => i.label);
		expect(labels).toContain("Launch Lab");
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
				"NetBox",
				"Nautobot",
				"Jira",
				"Rapid7",
				"ELK",
				"Infoblox",
			]),
		);
		expect(integrations?.children?.map((c) => c.label)).not.toContain(
			"Overview",
		);
		expect(integrations?.children?.map((c) => c.label)).not.toContain(
			"ServiceNow",
		);
		expect(integrations?.children?.map((c) => c.label)).not.toContain(
			"Infoblox Console",
		);

		const platform = findGroup("Platform", items);
		expect(platform?.children?.map((c) => c.label)).toEqual(
			expect.arrayContaining([
				"Git",
				"Artifacts",
				"DNS",
				"Coder",
				"Reservations",
				"Infoblox Console",
				"API Testing",
				"ReDoc",
				"Webhooks",
				"Syslog",
				"SNMP",
			]),
		);
		const coder = platform?.children?.find((c) => c.label === "Coder");
		expect(coder?.href).toBe(toolRouteHref("coder"));
		const nautobot = integrations?.children?.find(
			(c) => c.label === "Nautobot",
		);
		expect(nautobot?.href).toBe(toolRouteHref("nautobot"));
	});

	it("collapses admin controls into settings hub", () => {
		const items = buildSideNavItems(
			true,
			{ coderEnabled: true },
			"local",
			"advanced",
			toolLaunches,
		);
		const settings = items.find((i) => i.label === "Settings");
		expect(settings).toBeDefined();
		expect(settings?.children).toBeUndefined();
		expect(settings?.href).toBe("/settings");
	});

	it("hides admin-only operational tools for non-admin sessions", () => {
		const items = buildSideNavItems(
			false,
			{ infobloxEnabled: true, coderEnabled: true },
			"local",
			"advanced",
			toolLaunches,
		);
		const platform = findGroup("Platform", items);
		expect(platform?.children?.map((item) => item.label)).not.toContain(
			"Infoblox Console",
		);
	});

	it("uses direct tool links once the session is authenticated", () => {
		const items = buildSideNavItems(
			{ authenticated: true, roles: ["ADMIN"] },
			{ coderEnabled: true, nautobotEnabled: true },
			"local",
			"advanced",
			toolLaunches,
		);
		const platform = findGroup("Platform", items);
		const integrations = findGroup("Integrations", items);
		const coder = platform?.children?.find((i) => i.label === "Coder");
		const nautobot = integrations?.children?.find(
			(i) => i.label === "Nautobot",
		);
		expect(coder?.href).toBe(toolRouteHref("coder"));
		expect(nautobot?.href).toBe(toolRouteHref("nautobot"));
	});

	it("shows a guided simple nav by default", () => {
		const items = buildSideNavItems(
			{ authenticated: true, roles: ["USER"] },
			{ forwardEnabled: true, teamsEnabled: true, netboxEnabled: true },
			"local",
			"simple",
			toolLaunches,
		);
		const labels = items.map((item) => item.label);
		const forward = findGroup("Forward", items);

		expect(labels).toEqual([
			"Dashboard",
			"Deployments",
			"Launch Lab",
			"Reservations",
			"Forward",
			"Docs",
			"Settings",
		]);
		expect(forward?.children?.map((child) => child.label)).toEqual([
			"Credentials",
			"Collector",
			"Cluster",
		]);
		expect(labels).not.toContain("Observability");
		expect(labels).not.toContain("Designer");
		expect(labels).not.toContain("Integrations");
		expect(labels).not.toContain("Platform");
	});
});
