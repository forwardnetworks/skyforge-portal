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
	ToolNavigationEntry,
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
		case "radio":
			return Radio;
		case "server":
			return Server;
		case "settings":
			return Settings;
		case "shield-check":
			return ShieldCheck;
		case "webhook":
			return Webhook;
		case "book-open":
			return BookOpen;
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

function navEntryItem(entry: ToolNavigationEntry): NavItem {
	return {
		id: entry.id,
		label: String(entry.label).trim(),
		href: entry.navigationHref,
		icon: toolNavIcon(entry.navigationIcon),
		adminOnly: entry.adminOnly,
		experience:
			String(entry.experience).trim().toLowerCase() === "both"
				? "both"
				: "advanced",
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

function navEntryItemsForSection(
	entries: ToolNavigationEntry[] | undefined,
	section: string,
): NavItem[] {
	return (entries ?? [])
		.filter(
			(entry) =>
				String(entry.navigationSection).trim().toLowerCase() === section,
		)
		.sort(
			(left, right) =>
				Number(left.navigationOrder ?? 0) - Number(right.navigationOrder ?? 0),
		)
		.map((entry) => navEntryItem(entry));
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

function createNavItems(
	mode: UIExperienceMode,
	sections: ToolNavigationSection[] | undefined,
	entries: ToolNavigationEntry[] | undefined,
	toolLaunches?: ToolLaunchMap,
): NavItem[] {
	const simpleMode = mode === "simple";
	const dynamicSections = [...(sections ?? [])]
		.sort((left, right) => left.order - right.order)
		.map((section) => {
			const children = [
				...navEntryItemsForSection(entries, section.id),
				...navToolItemsForSection(toolLaunches, section.id),
			].sort((left, right) => {
				const leftOrder = (entries ?? []).find(
					(entry) => entry.id === left.id,
				)?.navigationOrder;
				const rightOrder = (entries ?? []).find(
					(entry) => entry.id === right.id,
				)?.navigationOrder;
				const leftToolOrder = Object.values(toolLaunches ?? {}).find(
					(tool) => tool.id === left.id,
				)?.navigationOrder;
				const rightToolOrder = Object.values(toolLaunches ?? {}).find(
					(tool) => tool.id === right.id,
				)?.navigationOrder;
				return (
					Number(leftOrder ?? leftToolOrder ?? 0) -
					Number(rightOrder ?? rightToolOrder ?? 0)
				);
			});
			return {
				id: section.id,
				label: section.label,
				href: "",
				icon: toolNavIcon(section.icon),
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
	entries?: ToolNavigationEntry[],
	toolLaunches?: ToolLaunchMap,
): NavItem[] {
	const session =
		typeof sessionOrAdmin === "boolean"
			? { isAdmin: sessionOrAdmin }
			: sessionOrAdmin;
	const isAdmin = sessionHasRole(session, "ADMIN");
	const uiExperienceMode = normalizeUIExperienceMode(mode);

	return filterNavItems(
		createNavItems(uiExperienceMode, sections, entries, toolLaunches),
		isAdmin,
		features,
		uiExperienceMode,
	);
}
