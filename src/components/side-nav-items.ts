import {
	Activity,
	BookOpen,
	Cloud,
	Database,
	FolderKanban,
	GitBranch,
	Hammer,
	Inbox,
	LayoutDashboard,
	Network,
	PanelTop,
	Radio,
	Server,
	Settings,
	ShieldCheck,
	Webhook,
	Workflow,
} from "lucide-react";
import type { ComponentType } from "react";
import { embeddedToolHref } from "../lib/embedded-tools";
import { sessionHasRole } from "../lib/rbac";
import type { SkyforgeAuthMode } from "../lib/skyforge-config";

export type NavItem = {
	label: string;
	href: string;
	icon: ComponentType<{ className?: string }>;
	external?: boolean;
	newTab?: boolean;
	adminOnly?: boolean;
	featureFlag?: keyof Features;
	children?: NavItem[];
};

export type Features = {
	giteaEnabled?: boolean;
	coderEnabled?: boolean;
	yaadeEnabled?: boolean;
	swaggerUIEnabled?: boolean;
	forwardEnabled?: boolean;
	teamsEnabled?: boolean;
	netboxEnabled?: boolean;
	nautobotEnabled?: boolean;
	infobloxEnabled?: boolean;
	jiraEnabled?: boolean;
	rapid7Enabled?: boolean;
	elkEnabled?: boolean;
	forwardGrafanaEnabled?: boolean;
	forwardPrometheusEnabled?: boolean;
	dnsEnabled?: boolean;
};

function createNavItems(): NavItem[] {
	return [
		{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
		{ label: "Observability", href: "/dashboard/observability", icon: Activity },
		{
			label: "Deployments",
			href: "/dashboard/deployments",
			icon: FolderKanban,
		},
		{
			label: "Quick Deploy",
			href: "/dashboard/deployments/quick",
			icon: Workflow,
			featureFlag: "forwardEnabled",
		},
		{
			label: "Designer",
			href: "/dashboard/labs/designer",
			icon: Hammer,
		},
		{
			label: "Forward",
			href: "",
			icon: Network,
			featureFlag: "forwardEnabled",
			children: [
				{
					label: "Credentials",
					href: "/dashboard/forward/credentials",
					icon: Settings,
				},
				{
					label: "Collector",
					href: "/dashboard/forward/collectors",
					icon: Radio,
				},
				{
					label: "Cluster",
					href: embeddedToolHref("forward-cluster"),
					icon: Network,
				},
				{
					label: "Grafana",
					href: embeddedToolHref("forward-grafana"),
					icon: Activity,
					featureFlag: "forwardGrafanaEnabled",
				},
				{
					label: "Prometheus",
					href: embeddedToolHref("forward-prometheus"),
					icon: Activity,
					featureFlag: "forwardPrometheusEnabled",
				},
				{
					label: "Analytics",
					href: "/dashboard/forward-analytics",
					icon: ShieldCheck,
				},
				{
					label: "ServiceNow",
					href: "/dashboard/servicenow",
					icon: Workflow,
				},
				{
					label: "Teams",
					href: "/dashboard/teams",
					icon: Workflow,
					featureFlag: "teamsEnabled",
				},
			],
		},
		{
			label: "Integrations",
			href: "",
			icon: Workflow,
			children: [
				{
					label: "NetBox",
					href: embeddedToolHref("netbox"),
					icon: Network,
					featureFlag: "netboxEnabled",
				},
				{
					label: "Nautobot",
					href: embeddedToolHref("nautobot"),
					icon: Network,
					featureFlag: "nautobotEnabled",
				},
				{
					label: "Jira",
					href: embeddedToolHref("jira"),
					icon: Workflow,
					featureFlag: "jiraEnabled",
				},
				{
					label: "Rapid7",
					href: embeddedToolHref("rapid7"),
					icon: Workflow,
					featureFlag: "rapid7Enabled",
				},
				{
					label: "ELK",
					href: embeddedToolHref("elk"),
					icon: Database,
					featureFlag: "elkEnabled",
				},
				{
					label: "Infoblox",
					icon: Server,
					href: "/dashboard/infoblox",
					featureFlag: "infobloxEnabled",
				},
			],
		},
		{
			label: "Platform",
			href: "",
			icon: Cloud,
			children: [
				{
					label: "Git",
					href: embeddedToolHref("git"),
					icon: GitBranch,
					featureFlag: "giteaEnabled",
				},
				{
					label: "Artifacts",
					href: embeddedToolHref("artifacts"),
					icon: Inbox,
				},
				{
					label: "DNS",
					href: embeddedToolHref("dns"),
					icon: Network,
					featureFlag: "dnsEnabled",
				},
				{
					label: "Coder",
					href: embeddedToolHref("coder"),
					icon: Cloud,
					featureFlag: "coderEnabled",
				},
				{
					label: "Reservations",
					href: "/dashboard/reservations",
					icon: Activity,
				},
				{
					label: "Config Changes",
					href: "/dashboard/config-changes",
					icon: Workflow,
				},
				{
					label: "Capacity",
					href: "/dashboard/platform",
					icon: Activity,
					adminOnly: true,
				},
				{
					label: "Infoblox Console",
					href: "/admin/infoblox/console",
					icon: Server,
					featureFlag: "infobloxEnabled",
					adminOnly: true,
				},
				{
					label: "API Testing",
					href: embeddedToolHref("api-testing"),
					icon: PanelTop,
					featureFlag: "yaadeEnabled",
				},
				{ label: "Webhooks", href: "/webhooks", icon: Webhook },
				{ label: "Syslog", href: "/syslog", icon: Inbox },
				{ label: "SNMP", href: "/snmp", icon: ShieldCheck },
			],
		},
		{ label: "Docs", href: "/dashboard/docs", icon: BookOpen },
		{
			label: "Settings",
			href: "/settings",
			icon: Settings,
		},
	];
}

function filterNavItems(
	items: NavItem[],
	isAdmin: boolean,
	features?: Features,
): NavItem[] {
	return items.flatMap((item) => {
		if (item.adminOnly && !isAdmin) {
			return [];
		}
		if (item.featureFlag && features && !features[item.featureFlag]) {
			return [];
		}
		if (!item.children) {
			return [item];
		}

		const children = filterNavItems(item.children, isAdmin, features);
		if (children.length === 0) {
			return [];
		}

		return [{ ...item, children }];
	});
}

export function buildSideNavItems(
	sessionOrAdmin?: unknown,
	features?: Features,
	_authMode?: SkyforgeAuthMode | null,
): NavItem[] {
	const session =
		typeof sessionOrAdmin === "boolean"
			? { isAdmin: sessionOrAdmin }
			: sessionOrAdmin;
	const isAdmin = sessionHasRole(session, "ADMIN");

	return filterNavItems(createNavItems(), isAdmin, features);
}
