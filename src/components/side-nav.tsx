import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getToolCatalog } from "../lib/api-client-tool-catalog";
import type { UIExperienceMode } from "../lib/api-client-user-settings";
import { queryKeys } from "../lib/query-keys";
import { indexToolLaunches } from "../lib/tool-launches";
import { type Features, buildSideNavItems } from "./side-nav-items";
import {
	CollapsedNavGroup,
	ExpandedNavGroup,
	SideNavLeafItem,
	hasChildren,
} from "./side-nav-renderers";

export { buildSideNavItems } from "./side-nav-items";
export type { Features } from "./side-nav-items";

export function SideNav({
	collapsed = false,
	features,
	mode,
}: {
	collapsed?: boolean;
	features?: Features;
	mode?: UIExperienceMode;
}) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const toolCatalogQ = useQuery({
		queryKey: queryKeys.toolCatalog(),
		queryFn: getToolCatalog,
		retry: false,
		staleTime: 5 * 60_000,
	});
	const defaultExpandedSections = useMemo(
		() =>
			Object.fromEntries(
				(toolCatalogQ.data?.sections ?? []).map((section) => [
					section.id,
					section.defaultExpanded,
				]),
			),
		[toolCatalogQ.data?.sections],
	);
	useEffect(() => {
		setExpanded((previous) => {
			const next = { ...previous };
			for (const [sectionID, isExpanded] of Object.entries(
				defaultExpandedSections,
			)) {
				if (typeof next[sectionID] !== "boolean") {
					next[sectionID] = isExpanded;
				}
			}
			return next;
		});
	}, [defaultExpandedSections]);
	const items = buildSideNavItems(
		features,
		mode,
		toolCatalogQ.data?.sections ?? [],
		toolCatalogQ.data?.entries ?? [],
		indexToolLaunches(toolCatalogQ.data?.tools),
	);

	const isActiveHref = (href: string) => {
		if (!href) {
			return false;
		}
		if (href === "/") {
			return pathname === "/";
		}
		if (href.endsWith("/")) {
			return pathname.startsWith(href);
		}
		return pathname === href || pathname.startsWith(`${href}/`);
	};

	const toggleExpand = (groupID: string) => {
		setExpanded((previous) => ({ ...previous, [groupID]: !previous[groupID] }));
	};

	return (
		<nav className="grid items-start gap-2">
			<div className="space-y-2">
				<div className="grid gap-1">
					{items.map((item) => {
						if (hasChildren(item)) {
							const isChildActive = item.children.some((child) =>
								isActiveHref(child.href),
							);

							return collapsed ? (
								<CollapsedNavGroup
									key={item.id ?? item.label}
									item={item}
									isChildActive={isChildActive}
								/>
							) : (
								<ExpandedNavGroup
									key={item.id ?? item.label}
									item={item}
									isChildActive={isChildActive}
									isOpen={!!expanded[item.id ?? item.label]}
									onToggle={(label) => toggleExpand(item.id ?? label)}
									isActiveHref={isActiveHref}
								/>
							);
						}

						return (
							<SideNavLeafItem
								key={item.href}
								item={item}
								active={isActiveHref(item.href)}
								collapsed={collapsed}
							/>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
