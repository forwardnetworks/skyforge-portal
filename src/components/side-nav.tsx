import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { getToolCatalog } from "../lib/api-client-tool-catalog";
import type { UIExperienceMode } from "../lib/api-client-user-settings";
import { queryKeys } from "../lib/query-keys";
import type { SkyforgeAuthMode } from "../lib/skyforge-config";
import { indexToolLaunches } from "../lib/tool-launches";
import { type Features, buildSideNavItems } from "./side-nav-items";
import {
	CollapsedNavGroup,
	ExpandedNavGroup,
	SideNavLeafItem,
	hasChildren,
} from "./side-nav-renderers";

const DEFAULT_EXPANDED_GROUPS: Record<string, boolean> = {
	Forward: true,
	Integrations: true,
	Platform: true,
};

export { buildSideNavItems } from "./side-nav-items";
export type { Features } from "./side-nav-items";

export function SideNav({
	collapsed = false,
	session,
	isAdmin,
	features,
	authMode,
	mode,
}: {
	collapsed?: boolean;
	session?: unknown;
	isAdmin?: boolean;
	features?: Features;
	authMode?: SkyforgeAuthMode | null;
	mode?: UIExperienceMode;
}) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const [expanded, setExpanded] = useState(DEFAULT_EXPANDED_GROUPS);
	const toolCatalogQ = useQuery({
		queryKey: queryKeys.toolCatalog(),
		queryFn: getToolCatalog,
		enabled: Boolean(
			session && (session as { authenticated?: boolean }).authenticated,
		),
		retry: false,
		staleTime: 5 * 60_000,
	});
	const items = buildSideNavItems(
		session ?? { isAdmin: !!isAdmin },
		features,
		authMode ?? null,
		mode,
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

	const toggleExpand = (label: string) => {
		setExpanded((previous) => ({ ...previous, [label]: !previous[label] }));
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
									key={item.label}
									item={item}
									isChildActive={isChildActive}
								/>
							) : (
								<ExpandedNavGroup
									key={item.label}
									item={item}
									isChildActive={isChildActive}
									isOpen={!!expanded[item.label]}
									onToggle={toggleExpand}
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
