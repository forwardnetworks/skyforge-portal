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
import type { UIExperienceMode } from "../lib/api-client-user-settings";
import { sessionHasRole } from "../lib/rbac";
import type { SkyforgeAuthMode } from "../lib/skyforge-config";
import type {
	ToolLaunchEntry,
	ToolLaunchMap,
	ToolNavigationSection,
} from "../lib/tool-launches";
import { normalizeUIExperienceMode } from "../lib/ui-experience";

export type NavItem = {
	id?: string;
	label: string;
	href: string;
	icon: ComponentType<{ className?: string }>;
	external?: boolean;
	newTab?: boolean;
	adminOnly?: boolean;
	featureFlag?: keyof Features;
	children?: NavItem[];
	experience?: "both" | "advanced";
};

function toolNavIcon(icon: string | undefined) {
	switch (
		String(icon ?? "")
			.trim()
			.toLowerCase()
	) {
		case "activity":
			return Activity;
		case "cloud":
			return Cloud;
		case "database":
			return Database;
		case "git-branch":
			return GitBranch;
		case "inbox":
			return Inbox;
		case "network":
			return Network;
		case "panel-top":
			return PanelTop;
		case "server":
			return Server;
		case "workflow":
			return Workflow;
		default:
			return Workflow;
	}
}

function toolNavSection(tool: ToolLaunchEntry): string {
	return String(tool.navigationSection).trim().toLowerCase();
}

function toolNavExperience(tool: ToolLaunchEntry): "both" | "advanced" {
	return String(tool.experience).trim().toLowerCase() === "both"
		? "both"
		: "advanced";
}

function navToolItem(tool: ToolLaunchEntry): NavItem {
	return {
		id: tool.id,
		label: String(tool.navigationLabel).trim(),
		href: tool.navigationHref,
		icon: toolNavIcon(tool.navigationIcon),
		external: String(tool.navigationMode ?? "").trim() === "direct",
		newTab: String(tool.launchMode ?? "").trim() === "new_tab",
		experience: toolNavExperience(tool),
	};
}

function navToolItemsForSection(
	toolLaunches: ToolLaunchMap | undefined,
	section: string,
): NavItem[] {
	return Object.values(toolLaunches ?? {})
		.filter((tool) => toolNavSection(tool) === section)
		.sort((left, right) => {
			const orderDelta =
				Number(left.navigationOrder ?? 0) - Number(right.navigationOrder ?? 0);
			if (orderDelta !== 0) {
				return orderDelta;
			}
			return String(left.navigationLabel).localeCompare(
				String(right.navigationLabel),
			);
		})
		.map((tool) => navToolItem(tool));
}

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

function toolSectionIcon(section: ToolNavigationSection["icon"]) {
	return toolNavIcon(section);
}

function sectionStaticChildren(sectionID: string): NavItem[] {
	switch (sectionID) {
		case "forward":
			return [
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
					label: "Analytics",
					href: "/dashboard/forward-analytics",
					icon: ShieldCheck,
					experience: "advanced",
				},
				{
					label: "ServiceNow",
					href: "/dashboard/servicenow",
					icon: Workflow,
					experience: "advanced",
				},
				{
					label: "Teams",
					href: "/dashboard/teams",
					icon: Workflow,
					featureFlag: "teamsEnabled",
					experience: "advanced",
				},
			];
		case "platform":
			return [
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
					label: "ReDoc",
					href: "/redoc/",
					icon: BookOpen,
					featureFlag: "swaggerUIEnabled",
				},
				{ label: "Webhooks", href: "/webhooks", icon: Webhook },
				{ label: "Syslog", href: "/syslog", icon: Inbox },
				{ label: "SNMP", href: "/snmp", icon: ShieldCheck },
			];
		default:
			return [];
	}
}

function createNavItems(
	mode: UIExperienceMode,
	sections: ToolNavigationSection[] | undefined,
	toolLaunches?: ToolLaunchMap,
): NavItem[] {
	const simpleMode = mode === "simple";
	const dynamicSections = [...(sections ?? [])]
		.sort((left, right) => left.order - right.order)
		.map((section) => {
			const toolChildren = navToolItemsForSection(toolLaunches, section.id);
			const staticChildren = sectionStaticChildren(section.id);
			const children =
				section.id === "forward"
					? [
							...staticChildren.slice(0, 2),
							...toolChildren,
							...staticChildren.slice(2),
						]
					: section.id === "platform"
						? [...toolChildren, ...staticChildren]
						: toolChildren;
			return {
				id: section.id,
				label: section.label,
				href: "",
				icon: toolSectionIcon(section.icon),
				experience: section.id === "forward" ? "both" : "advanced",
				featureFlag:
					section.id === "forward" ? ("forwardEnabled" as const) : undefined,
				children,
			} satisfies NavItem;
		});
	return [
		{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
		{
			label: "Observability",
			href: "/dashboard/observability",
			icon: Activity,
			experience: "advanced",
		},
		{
			label: "Deployments",
			href: "/dashboard/deployments",
			icon: FolderKanban,
		},
		{
			label: "Launch Lab",
			href: "/dashboard/deployments/quick",
			icon: Workflow,
			featureFlag: "forwardEnabled",
		},
		{
			label: "Designer",
			href: "/dashboard/labs/designer",
			icon: Hammer,
			experience: "advanced",
		},
		...(simpleMode
			? [
					{
						label: "Reservations",
						href: "/dashboard/reservations",
						icon: Activity,
					} satisfies NavItem,
				]
			: []),
		...dynamicSections,
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
	mode: UIExperienceMode = "simple",
): NavItem[] {
	return items.flatMap((item) => {
		if (item.experience === "advanced" && mode !== "advanced") {
			return [];
		}
		if (item.adminOnly && !isAdmin) {
			return [];
		}
		if (item.featureFlag && features && !features[item.featureFlag]) {
			return [];
		}
		if (!item.children) {
			return [item];
		}

		const children = filterNavItems(item.children, isAdmin, features, mode);
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
	mode?: UIExperienceMode,
	sections?: ToolNavigationSection[],
	toolLaunches?: ToolLaunchMap,
): NavItem[] {
	const session =
		typeof sessionOrAdmin === "boolean"
			? { isAdmin: sessionOrAdmin }
			: sessionOrAdmin;
	const isAdmin = sessionHasRole(session, "ADMIN");
	const uiExperienceMode = normalizeUIExperienceMode(mode);

	return filterNavItems(
		createNavItems(uiExperienceMode, sections, toolLaunches),
		isAdmin,
		features,
		uiExperienceMode,
	);
}
