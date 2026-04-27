import { describe, expect, it } from "vitest";
import {
	type ToolLaunchMap,
	type ToolNavigationEntry,
	type ToolNavigationSection,
	toolRouteHref,
} from "../lib/tool-launches";
import { buildSideNavItems } from "./side-nav";

const toolSections: ToolNavigationSection[] = [
	{
		id: "forward",
		label: "Forward",
		icon: "network",
		order: 200,
		defaultExpanded: true,
	},
	{
		id: "integrations",
		label: "Integrations",
		icon: "workflow",
		order: 300,
		defaultExpanded: true,
	},
	{
		id: "platform",
		label: "Platform",
		icon: "cloud",
		order: 400,
		defaultExpanded: true,
	},
];

function withAllowedEntries(
	overrides?: Record<string, boolean>,
): ToolNavigationEntry[] {
	return toolEntries.map((entry) => ({
		...entry,
		allowed: overrides?.[entry.id] ?? true,
	}));
}

const toolEntries: ToolNavigationEntry[] = [
	{
		id: "top-dashboard",
		label: "Dashboard",
		navigationSection: "",
		navigationOrder: 10,
		navigationIcon: "layout-dashboard",
		navigationHref: "/dashboard",
		experience: "both",
	},
	{
		id: "top-observability",
		label: "Observability",
		navigationSection: "",
		navigationOrder: 20,
		navigationIcon: "activity",
		navigationHref: "/dashboard/observability",
		experience: "advanced",
	},
	{
		id: "top-deployments",
		label: "Deployments",
		navigationSection: "",
		navigationOrder: 30,
		navigationIcon: "folder-kanban",
		navigationHref: "/dashboard/deployments",
		experience: "both",
	},
	{
		id: "top-launch-lab",
		label: "Launch Lab",
		navigationSection: "",
		navigationOrder: 40,
		navigationIcon: "workflow",
		navigationHref: "/dashboard/deployments/quick",
		experience: "both",
		featureFlag: "forwardEnabled",
	},
	{
		id: "top-designer",
		label: "Designer",
		navigationSection: "",
		navigationOrder: 50,
		navigationIcon: "hammer",
		navigationHref: "/dashboard/labs/designer",
		experience: "advanced",
	},
	{
		id: "top-reservations-simple",
		label: "Reservations",
		navigationSection: "",
		navigationOrder: 60,
		navigationIcon: "activity",
		navigationHref: "/dashboard/reservations",
		experience: "both",
		displayMode: "simple",
	},
	{
		id: "forward-credentials",
		label: "Org Access",
		navigationSection: "forward",
		navigationOrder: 1,
		navigationIcon: "settings",
		navigationHref: "/dashboard/forward/credentials",
		experience: "both",
	},
	{
		id: "forward-collector",
		label: "Collector",
		navigationSection: "forward",
		navigationOrder: 2,
		navigationIcon: "radio",
		navigationHref: "/dashboard/forward/collectors",
		experience: "both",
	},
	{
		id: "forward-testdrives",
		label: "TestDrives",
		navigationSection: "forward",
		navigationOrder: 3,
		navigationIcon: "network",
		navigationHref: "/dashboard/forward/testdrives",
		experience: "both",
	},
	{
		id: "forward-analytics",
		label: "Analytics",
		navigationSection: "forward",
		navigationOrder: 20,
		navigationIcon: "shield-check",
		navigationHref: "/dashboard/forward-analytics",
		experience: "advanced",
	},
	{
		id: "forward-servicenow",
		label: "ServiceNow",
		navigationSection: "forward",
		navigationOrder: 30,
		navigationIcon: "workflow",
		navigationHref: "/dashboard/servicenow",
		experience: "advanced",
	},
	{
		id: "forward-teams",
		label: "Teams",
		navigationSection: "forward",
		navigationOrder: 40,
		navigationIcon: "workflow",
		navigationHref: "/dashboard/teams",
		experience: "advanced",
		featureFlag: "teamsEnabled",
	},
	{
		id: "platform-reservations",
		label: "Reservations",
		navigationSection: "platform",
		navigationOrder: 80,
		navigationIcon: "activity",
		navigationHref: "/dashboard/reservations",
		experience: "advanced",
	},
	{
		id: "platform-config-changes",
		label: "Config Changes",
		navigationSection: "platform",
		navigationOrder: 90,
		navigationIcon: "workflow",
		navigationHref: "/dashboard/config-changes",
		experience: "advanced",
	},
	{
		id: "platform-capacity",
		label: "Capacity",
		navigationSection: "platform",
		navigationOrder: 100,
		navigationIcon: "activity",
		navigationHref: "/dashboard/platform",
		experience: "advanced",
		adminOnly: true,
	},
	{
		id: "platform-infoblox-console",
		label: "Infoblox Console",
		navigationSection: "platform",
		navigationOrder: 110,
		navigationIcon: "server",
		navigationHref: "/admin/infoblox/console",
		experience: "advanced",
		featureFlag: "infobloxEnabled",
		adminOnly: true,
	},
	{
		id: "platform-api",
		label: "API",
		navigationSection: "platform",
		navigationOrder: 120,
		navigationIcon: "panel-top",
		navigationHref: "",
		experience: "advanced",
	},
	{
		id: "platform-redoc",
		label: "API Spec",
		navigationSection: "platform",
		navigationParentId: "platform-api",
		navigationOrder: 10,
		navigationIcon: "book-open",
		navigationHref: "/redoc",
		experience: "advanced",
		featureFlag: "swaggerUIEnabled",
	},
	{
		id: "platform-webhooks",
		label: "Webhooks",
		navigationSection: "platform",
		navigationOrder: 130,
		navigationIcon: "webhook",
		navigationHref: "/webhooks",
		experience: "advanced",
	},
	{
		id: "platform-syslog",
		label: "Syslog",
		navigationSection: "platform",
		navigationOrder: 140,
		navigationIcon: "inbox",
		navigationHref: "/syslog",
		experience: "advanced",
	},
	{
		id: "platform-snmp",
		label: "SNMP",
		navigationSection: "platform",
		navigationOrder: 150,
		navigationIcon: "shield-check",
		navigationHref: "/snmp",
		experience: "advanced",
	},
	{
		id: "top-docs",
		label: "Docs",
		navigationSection: "",
		navigationOrder: 1000,
		navigationIcon: "book-open",
		navigationHref: "/dashboard/docs",
		experience: "both",
	},
	{
		id: "top-settings",
		label: "Settings",
		navigationSection: "",
		navigationOrder: 1010,
		navigationIcon: "settings",
		navigationHref: "/settings",
		experience: "both",
	},
];

const toolLaunches: ToolLaunchMap = {
	"forward-cluster-demo": {
		id: "forward-cluster-demo",
		title: "Forward Demo Org",
		category: "forward",
		experience: "both",
		navigationSection: "forward",
		navigationParentId: "forward-credentials",
		navigationLabel: "Demo Org",
		navigationOrder: 10,
		navigationIcon: "network",
		navigationHref: "/api/forward/session?tenant=demo",
		navigationMode: "direct",
		launchMode: "new_tab",
	},
	"forward-cluster-deployment": {
		id: "forward-cluster-deployment",
		title: "Forward Deployment Org",
		category: "forward",
		experience: "both",
		navigationSection: "forward",
		navigationParentId: "forward-credentials",
		navigationLabel: "Deployment Org",
		navigationOrder: 20,
		navigationIcon: "network",
		navigationHref: "/api/forward/session?tenant=primary",
		navigationMode: "direct",
		launchMode: "new_tab",
	},
	"forward-cluster-customer": {
		id: "forward-cluster-customer",
		title: "Forward Customer Org",
		category: "forward",
		experience: "both",
		navigationSection: "forward",
		navigationParentId: "forward-credentials",
		navigationLabel: "Customer Org",
		navigationOrder: 20,
		navigationIcon: "network",
		navigationHref: "/api/forward/session?tenant=customer",
		navigationMode: "direct",
		launchMode: "new_tab",
	},
	netbox: {
		id: "netbox",
		title: "NetBox",
		category: "integrations",
		experience: "advanced",
		navigationSection: "integrations",
		navigationLabel: "NetBox",
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
		navigationLabel: "Nautobot",
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
		navigationLabel: "Jira",
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
		navigationLabel: "Rapid7",
		navigationOrder: 40,
		navigationIcon: "workflow",
		navigationHref: toolRouteHref("rapid7"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	infoblox: {
		id: "infoblox",
		title: "Infoblox",
		category: "integrations",
		experience: "advanced",
		navigationSection: "integrations",
		navigationLabel: "Infoblox",
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
		navigationLabel: "Git",
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
		navigationLabel: "Artifacts",
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
		navigationLabel: "DNS",
		navigationOrder: 30,
		navigationIcon: "network",
		navigationHref: toolRouteHref("dns"),
		navigationMode: "router",
		launchMode: "embedded",
	},
	coder: {
		id: "coder",
		title: "Coder",
		category: "integrations",
		experience: "advanced",
		navigationSection: "integrations",
		navigationLabel: "Coder",
		navigationOrder: 50,
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
		navigationLabel: "Grafana",
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
		navigationLabel: "Prometheus",
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
		navigationParentId: "platform-api",
		navigationLabel: "API Testing",
		navigationOrder: 70,
		navigationIcon: "panel-top",
		navigationHref: toolRouteHref("api-testing"),
		navigationMode: "router",
		launchMode: "embedded",
	},
};

function withAllowedTools(overrides?: Record<string, boolean>): ToolLaunchMap {
	return Object.fromEntries(
		Object.entries(toolLaunches).map(([id, tool]) => [
			id,
			{ ...tool, allowed: overrides?.[id] ?? true },
		]),
	);
}

function findGroup(label: string, items: ReturnType<typeof buildSideNavItems>) {
	return items.find((i) => i.label === label);
}

describe("side nav model", () => {
	it("shows Forward section with expected entries when enabled", () => {
		const items = buildSideNavItems(
			{ forwardEnabled: true },
			"advanced",
			toolSections,
			withAllowedEntries(),
			withAllowedTools(),
		);
		const forward = findGroup("Forward", items);
		const orgAccess = forward?.children?.find((c) => c.label === "Org Access");

		expect(forward).toBeDefined();
		expect(forward?.children?.map((c) => c.label)).toEqual(
			expect.arrayContaining([
				"Org Access",
				"Collector",
				"TestDrives",
				"Analytics",
				"ServiceNow",
			]),
		);
		expect(orgAccess?.children?.map((c) => c.label)).toEqual([
			"Demo Org",
			"Customer Org",
			"Deployment Org",
		]);
		const collectorItem = forward?.children?.find(
			(c) => c.label === "Collector",
		);
		expect(orgAccess?.href).toBe("/dashboard/forward/credentials");
		expect(collectorItem?.href).toBe("/dashboard/forward/collectors");
	});

	it("hides Forward section when forward feature is disabled", () => {
		const sectionsWithoutForward = toolSections.filter(
			(section) => section.id !== "forward",
		);
		const entriesWithoutForward = withAllowedEntries().filter(
			(entry) =>
				entry.id !== "top-launch-lab" && entry.navigationSection !== "forward",
		);
		const toolsWithoutForward = Object.fromEntries(
			Object.entries(withAllowedTools()).filter(
				([id, tool]) =>
					id !== "forward-cluster-demo" &&
					id !== "forward-cluster-customer" &&
					id !== "forward-cluster-deployment" &&
					tool.navigationSection !== "forward",
			),
		);
		const items = buildSideNavItems(
			{ forwardEnabled: false },
			"simple",
			sectionsWithoutForward,
			entriesWithoutForward,
			toolsWithoutForward,
		);
		const forward = findGroup("Forward", items);
		const labels = items.map((i) => i.label);

		expect(forward).toBeUndefined();
		expect(labels).not.toContain("Launch Lab");
	});

	it("removes Connect/Tools groupings and legacy nav items", () => {
		const items = buildSideNavItems(
			{
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
				swaggerUIEnabled: true,
			},
			"advanced",
			toolSections,
			withAllowedEntries({
				"platform-capacity": true,
				"platform-infoblox-console": true,
			}),
			withAllowedTools(),
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
				"Coder",
				"Jira",
				"Rapid7",
				"Infoblox",
			]),
		);
		expect(integrations?.children?.map((c) => c.label)).not.toContain(
			"Kibana",
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
				"Reservations",
				"Infoblox Console",
				"API",
				"Webhooks",
				"Syslog",
				"SNMP",
			]),
		);
		const api = platform?.children?.find((c) => c.label === "API");
		expect(api?.children?.map((c) => c.label)).toEqual([
			"API Spec",
			"API Testing",
		]);
		const coder = integrations?.children?.find((c) => c.label === "Coder");
		expect(coder?.href).toBe(toolRouteHref("coder"));
		const nautobot = integrations?.children?.find(
			(c) => c.label === "Nautobot",
		);
		expect(nautobot?.href).toBe(toolRouteHref("nautobot"));
	});

	it("collapses admin controls into settings hub", () => {
		const items = buildSideNavItems(
			{ coderEnabled: true },
			"advanced",
			toolSections,
			withAllowedEntries(),
			withAllowedTools(),
		);
		const settings = items.find((i) => i.label === "Settings");
		expect(settings).toBeDefined();
		expect(settings?.children).toBeUndefined();
		expect(settings?.href).toBe("/settings");
	});

	it("hides admin-only operational tools for non-admin sessions", () => {
		const items = buildSideNavItems(
			{ infobloxEnabled: true, coderEnabled: true },
			"advanced",
			toolSections,
			withAllowedEntries({
				"platform-capacity": false,
				"platform-infoblox-console": false,
			}),
			withAllowedTools(),
		);
		const platform = findGroup("Platform", items);
		expect(platform?.children?.map((item) => item.label)).not.toContain(
			"Infoblox Console",
		);
	});

	it("uses direct tool links once the session is authenticated", () => {
		const items = buildSideNavItems(
			{ coderEnabled: true, nautobotEnabled: true },
			"advanced",
			toolSections,
			withAllowedEntries(),
			withAllowedTools(),
		);
		const platform = findGroup("Platform", items);
		const integrations = findGroup("Integrations", items);
		const coder = integrations?.children?.find((i) => i.label === "Coder");
		const nautobot = integrations?.children?.find(
			(i) => i.label === "Nautobot",
		);
		expect(coder?.href).toBe(toolRouteHref("coder"));
		expect(nautobot?.href).toBe(toolRouteHref("nautobot"));
	});

	it("shows a guided simple nav by default", () => {
		const items = buildSideNavItems(
			{ forwardEnabled: true, teamsEnabled: true, netboxEnabled: true },
			"simple",
			toolSections,
			withAllowedEntries(),
			withAllowedTools(),
		);
		const labels = items.map((item) => item.label);
		const forward = findGroup("Forward", items);
		const orgAccess = forward?.children?.find((child) => child.label === "Org Access");

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
			"Org Access",
			"Collector",
			"TestDrives",
		]);
		expect(orgAccess?.children?.map((child) => child.label)).toEqual([
			"Demo Org",
			"Customer Org",
			"Deployment Org",
		]);
		expect(labels).not.toContain("Observability");
		expect(labels).not.toContain("Designer");
		expect(labels).not.toContain("Integrations");
		expect(labels).not.toContain("Platform");
	});
});
