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
import type {
	ToolLaunchEntry,
	ToolLaunchMap,
	ToolNavigationEntry,
	ToolNavigationSection,
} from "../lib/tool-launches";
import { normalizeUIExperienceMode } from "../lib/ui-experience";

export type NavItem = {
	id?: string;
	order?: number;
	label: string;
	href: string;
	icon: ComponentType<{ className?: string }>;
	external?: boolean;
	newTab?: boolean;
	featureFlag?: keyof Features;
	allowed?: boolean;
	children?: NavItem[];
	experience?: "both" | "advanced" | "simple";
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
		case "folder-kanban":
			return FolderKanban;
		case "git-branch":
			return GitBranch;
		case "hammer":
			return Hammer;
		case "inbox":
			return Inbox;
		case "layout-dashboard":
			return LayoutDashboard;
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
		order: tool.navigationOrder,
		label: String(tool.navigationLabel).trim(),
		href: tool.navigationHref,
		icon: toolNavIcon(tool.navigationIcon),
		external: String(tool.navigationMode ?? "").trim() === "direct",
		newTab: String(tool.launchMode ?? "").trim() === "new_tab",
		allowed: tool.allowed,
		experience: toolNavExperience(tool),
	};
}

function navEntryItem(entry: ToolNavigationEntry): NavItem {
	return {
		id: entry.id,
		order: entry.navigationOrder,
		label: String(entry.label).trim(),
		href: entry.navigationHref,
		icon: toolNavIcon(entry.navigationIcon),
		featureFlag: entry.featureFlag as keyof Features | undefined,
		allowed: entry.allowed,
		experience:
			String(entry.displayMode || entry.experience)
				.trim()
				.toLowerCase() === "simple"
				? "simple"
				: String(entry.experience).trim().toLowerCase() === "both"
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
	const topLevelEntries = navEntryItemsForSection(entries, "").sort(
		(left, right) =>
			Number(
				(entries ?? []).find((entry) => entry.id === left.id)
					?.navigationOrder ?? 0,
			) -
			Number(
				(entries ?? []).find((entry) => entry.id === right.id)
					?.navigationOrder ?? 0,
			),
	);
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
				order: section.order,
				label: section.label,
				href: "",
				icon: toolNavIcon(section.icon),
				experience: section.id === "forward" ? "both" : "advanced",
				featureFlag:
					section.id === "forward" ? ("forwardEnabled" as const) : undefined,
				children,
			} satisfies NavItem;
		});
	return [...topLevelEntries, ...dynamicSections];
}

function filterNavItems(
	items: NavItem[],
	features?: Features,
	mode: UIExperienceMode = "simple",
): NavItem[] {
	return items
		.flatMap((item) => {
			if (item.allowed === false) {
				return [];
			}
			if (item.experience === "advanced" && mode !== "advanced") {
				return [];
			}
			if (item.experience === "simple" && mode !== "simple") {
				return [];
			}
			if (item.featureFlag && features && !features[item.featureFlag]) {
				return [];
			}
			if (!item.children) {
				return [item];
			}

			const children = filterNavItems(item.children, features, mode);
			if (children.length === 0) {
				return [];
			}

			return [{ ...item, children }];
		})
		.sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0));
}

export function buildSideNavItems(
	features?: Features,
	mode?: UIExperienceMode,
	sections?: ToolNavigationSection[],
	entries?: ToolNavigationEntry[],
	toolLaunches?: ToolLaunchMap,
): NavItem[] {
	const uiExperienceMode = normalizeUIExperienceMode(mode);

	return filterNavItems(
		createNavItems(uiExperienceMode, sections, entries, toolLaunches),
		features,
		uiExperienceMode,
	);
}
