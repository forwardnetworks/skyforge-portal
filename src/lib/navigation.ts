import type { LucideIcon } from "lucide-react";
import {
	Bell,
	BookOpen,
	Cloud,
	Database,
	FolderKanban,
	GitBranch,
	Hammer,
	Inbox,
	LayoutDashboard,
	Map as MapIcon,
	Network,
	PanelTop,
	Radio,
	Server,
	Settings,
	ShieldCheck,
	Users,
	Webhook,
	Workflow,
} from "lucide-react";
import { SKYFORGE_API, type UIConfigResponse } from "./skyforge-api";

export type NavFeatures = Partial<UIConfigResponse["features"]>;

export type NavContext = {
	isAdmin?: boolean;
	features?: NavFeatures;
};

export type NavItem = {
	id: string;
	label: string;
	href: string;
	icon: LucideIcon;
	external?: boolean;
	newTab?: boolean;
	adminOnly?: boolean;
	matchPrefixes?: string[];
	searchTerms?: string[];
	visible?: (ctx: NavContext) => boolean;
};

export type NavSection = {
	id: string;
	label: string;
	icon: LucideIcon;
	defaultExpanded?: boolean;
	items: NavItem[];
};

type FeatureKey = keyof NonNullable<UIConfigResponse["features"]>;

function featureEnabled(ctx: NavContext, key: FeatureKey): boolean {
	const features = ctx.features as
		| Record<string, boolean | undefined>
		| undefined;
	if (!features) return true;
	return Boolean(features[key as string]);
}

const NAV_SECTIONS: NavSection[] = [
	{
		id: "operate",
		label: "Operate",
		icon: LayoutDashboard,
		defaultExpanded: true,
		items: [
			{
				id: "status",
				label: "Status",
				href: "/status",
				icon: LayoutDashboard,
				matchPrefixes: ["/status"],
			},
			{
				id: "deployments",
				label: "Deployments",
				href: "/dashboard/deployments",
				icon: FolderKanban,
				matchPrefixes: ["/dashboard/deployments"],
			},
			{
				id: "runs",
				label: "Runs",
				href: "/dashboard/runs",
				icon: Workflow,
				matchPrefixes: ["/dashboard/runs"],
			},
			{
				id: "workspaces",
				label: "Workspaces",
				href: "/dashboard/workspaces",
				icon: Users,
				matchPrefixes: ["/dashboard/workspaces"],
			},
			{
				id: "notifications",
				label: "Notifications",
				href: "/notifications",
				icon: Bell,
				matchPrefixes: ["/notifications"],
			},
		],
	},
	{
		id: "labs",
		label: "Labs",
		icon: Hammer,
		items: [
			{
				id: "designer",
				label: "Designer",
				href: "/dashboard/labs/designer",
				icon: Hammer,
				newTab: true,
				matchPrefixes: ["/dashboard/labs/designer"],
			},
			{
				id: "labs-map",
				label: "Topology Map",
				href: "/dashboard/labs/map",
				icon: MapIcon,
				matchPrefixes: ["/dashboard/labs/map"],
			},
		],
	},
	{
		id: "assurance",
		label: "Assurance",
		icon: ShieldCheck,
		defaultExpanded: true,
		items: [
			{
				id: "forward-networks",
				label: "Forward Networks",
				href: "/fwd/",
				icon: Network,
				external: true,
				newTab: true,
				matchPrefixes: ["/fwd"],
				visible: (ctx) => featureEnabled(ctx, "forwardEnabled"),
			},
			{
				id: "policy-compliance",
				label: "Policy & Compliance",
				href: "/dashboard/policy-reports",
				icon: ShieldCheck,
				matchPrefixes: ["/dashboard/policy-reports"],
				searchTerms: ["Policy Reports"],
				visible: (ctx) => featureEnabled(ctx, "forwardEnabled"),
			},
		],
	},
	{
		id: "integrations",
		label: "Integrations",
		icon: Network,
		defaultExpanded: true,
		items: [
			{
				id: "integrations-overview",
				label: "Integrations Overview",
				href: "/dashboard/integrations",
				icon: Workflow,
				matchPrefixes: ["/dashboard/integrations"],
			},
			{
				id: "forward-collector",
				label: "Forward Collector",
				href: "/dashboard/forward",
				icon: Radio,
				matchPrefixes: ["/dashboard/forward"],
				visible: (ctx) => featureEnabled(ctx, "forwardEnabled"),
			},
			{
				id: "forward-onprem",
				label: "Forward On-Prem",
				href: "/fwd",
				icon: Network,
				external: true,
				newTab: true,
				matchPrefixes: ["/fwd"],
				visible: (ctx) => featureEnabled(ctx, "forwardEnabled"),
			},
			{
				id: "servicenow",
				label: "ServiceNow",
				href: "/dashboard/servicenow",
				icon: Workflow,
				matchPrefixes: ["/dashboard/servicenow"],
				visible: (ctx) => featureEnabled(ctx, "forwardEnabled"),
			},
			{
				id: "elastic",
				label: "Elastic",
				href: "/dashboard/elastic",
				icon: Database,
				matchPrefixes: ["/dashboard/elastic"],
				visible: (ctx) =>
					featureEnabled(ctx, "forwardEnabled") &&
					featureEnabled(ctx, "elasticEnabled"),
			},
			{
				id: "artifacts",
				label: "Artifacts",
				href: "/dashboard/s3",
				icon: Server,
				matchPrefixes: ["/dashboard/s3"],
				visible: (ctx) => featureEnabled(ctx, "minioEnabled"),
			},
			{
				id: "git",
				label: "Git",
				href: "/git/",
				icon: GitBranch,
				external: true,
				matchPrefixes: ["/git"],
				visible: (ctx) => featureEnabled(ctx, "giteaEnabled"),
			},
			{
				id: "dns",
				label: "DNS",
				href: `${SKYFORGE_API}/dns/sso?next=/dns/`,
				icon: Network,
				external: true,
				visible: (ctx) => featureEnabled(ctx, "dnsEnabled"),
			},
			{
				id: "coder",
				label: "Coder",
				href: `${SKYFORGE_API}/coder/launch`,
				icon: Cloud,
				external: true,
				matchPrefixes: ["/coder"],
				visible: (ctx) => featureEnabled(ctx, "coderEnabled"),
			},
			{
				id: "coder-admin",
				label: "Coder Admin",
				href: "/coder/",
				icon: Cloud,
				external: true,
				matchPrefixes: ["/coder"],
				adminOnly: true,
				visible: (ctx) => featureEnabled(ctx, "coderEnabled"),
			},
			{
				id: "kibana",
				label: "Kibana",
				href: "/kibana/",
				icon: Database,
				external: true,
				matchPrefixes: ["/kibana"],
				visible: (ctx) =>
					featureEnabled(ctx, "forwardEnabled") &&
					featureEnabled(ctx, "elasticEnabled"),
			},
			{
				id: "netbox",
				label: "NetBox",
				href: "/netbox/",
				icon: Network,
				external: true,
				matchPrefixes: ["/netbox"],
				visible: (ctx) => featureEnabled(ctx, "netboxEnabled"),
			},
			{
				id: "nautobot",
				label: "Nautobot",
				href: "/nautobot/",
				icon: Network,
				external: true,
				matchPrefixes: ["/nautobot"],
				visible: (ctx) => featureEnabled(ctx, "nautobotEnabled"),
			},
		],
	},
	{
		id: "observability-apis",
		label: "Observability & APIs",
		icon: PanelTop,
		items: [
			{
				id: "webhooks",
				label: "Webhooks",
				href: "/webhooks",
				icon: Webhook,
				matchPrefixes: ["/webhooks"],
			},
			{
				id: "syslog",
				label: "Syslog",
				href: "/syslog",
				icon: Inbox,
				matchPrefixes: ["/syslog"],
			},
			{
				id: "snmp",
				label: "SNMP",
				href: "/snmp",
				icon: ShieldCheck,
				matchPrefixes: ["/snmp"],
			},
			{
				id: "api-docs",
				label: "API Docs",
				href: "/redoc/",
				icon: BookOpen,
				external: true,
				matchPrefixes: ["/redoc"],
			},
			{
				id: "api-testing",
				label: "API Testing",
				href: `${SKYFORGE_API}/yaade/sso`,
				icon: PanelTop,
				external: true,
				visible: (ctx) => featureEnabled(ctx, "yaadeEnabled"),
			},
			{
				id: "docs",
				label: "Docs",
				href: "/dashboard/docs",
				icon: BookOpen,
				matchPrefixes: ["/dashboard/docs"],
			},
		],
	},
	{
		id: "settings",
		label: "Settings",
		icon: Settings,
		items: [
			{
				id: "my-settings",
				label: "My Settings",
				href: "/dashboard/settings",
				icon: Settings,
				matchPrefixes: ["/dashboard/settings"],
			},
			{
				id: "admin-settings",
				label: "Admin Settings",
				href: "/admin/settings",
				icon: Settings,
				adminOnly: true,
				matchPrefixes: ["/admin/settings"],
			},
			{
				id: "governance",
				label: "Governance",
				href: "/admin/governance",
				icon: ShieldCheck,
				adminOnly: true,
				matchPrefixes: ["/admin/governance"],
			},
		],
	},
];

function itemVisible(item: NavItem, ctx: NavContext): boolean {
	if (item.adminOnly && !ctx.isAdmin) return false;
	if (item.visible && !item.visible(ctx)) return false;
	return true;
}

export function getNavigationSections(ctx: NavContext): NavSection[] {
	return NAV_SECTIONS.map((section) => ({
		...section,
		items: section.items.filter((item) => itemVisible(item, ctx)),
	})).filter((section) => section.items.length > 0);
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
	const prefixes = item.matchPrefixes ?? [];
	for (const prefix of prefixes) {
		if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true;
	}
	if (
		!item.href ||
		item.href.startsWith("http://") ||
		item.href.startsWith("https://")
	) {
		return false;
	}
	if (item.href === "/") return pathname === "/";
	if (item.href.endsWith("/")) return pathname.startsWith(item.href);
	return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
