import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import * as React from "react";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import { getToolCatalog } from "@/lib/api-client-tool-catalog";
import { queryKeys } from "@/lib/query-keys";
import type { SkyforgeAuthMode } from "@/lib/skyforge-config";
import { indexToolLaunches } from "@/lib/tool-launches";
import {
	type Features,
	type NavItem,
	buildSideNavItems,
} from "./side-nav-items";

type CommandMenuSection = {
	label: string;
	items: NavItem[];
};

function flattenCommandSections(items: NavItem[]): CommandMenuSection[] {
	const topLevel = items.filter((item) => !item.children && item.href);
	const sections = items
		.filter((item) => item.children && item.children.length > 0)
		.map((item) => ({
			label: item.label,
			items: item.children?.filter((child) => child.href) ?? [],
		}))
		.filter((section) => section.items.length > 0);
	return [
		...(topLevel.length > 0 ? [{ label: "Navigation", items: topLevel }] : []),
		...sections,
	];
}

export function CommandMenu(props: {
	session?: unknown;
	features?: Features;
	authMode?: SkyforgeAuthMode | null;
	mode?: "simple" | "advanced";
}) {
	const [open, setOpen] = React.useState(false);
	const navigate = useNavigate();
	const toolCatalogQ = useQuery({
		queryKey: queryKeys.toolCatalog(),
		queryFn: getToolCatalog,
		enabled: Boolean(
			props.session &&
				(props.session as { authenticated?: boolean }).authenticated,
		),
		retry: false,
		staleTime: 5 * 60_000,
	});
	const navigationSections = React.useMemo(
		() =>
			flattenCommandSections(
				buildSideNavItems(
					props.session,
					props.features,
					props.authMode ?? null,
					props.mode,
					toolCatalogQ.data?.sections ?? [],
					toolCatalogQ.data?.entries ?? [],
					indexToolLaunches(toolCatalogQ.data?.tools),
				),
			),
		[
			props.authMode,
			props.features,
			props.mode,
			props.session,
			toolCatalogQ.data?.entries,
			toolCatalogQ.data?.sections,
			toolCatalogQ.data?.tools,
		],
	);

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const runCommand = React.useCallback((command: () => void) => {
		setOpen(false);
		command();
	}, []);

	const handleNavItem = React.useCallback(
		(item: NavItem) => {
			runCommand(() => {
				if (item.newTab) {
					window.open(item.href, "_blank", "noopener,noreferrer");
					return;
				}
				if (item.external) {
					window.location.href = item.href;
					return;
				}
				void navigate({ to: item.href });
			});
		},
		[navigate, runCommand],
	);

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				{navigationSections.map((section, index) => (
					<React.Fragment key={section.label}>
						<CommandGroup heading={section.label}>
							{section.items.map((item) => {
								const Icon = item.icon;
								return (
									<CommandItem
										key={item.id ?? item.href}
										onSelect={() => handleNavItem(item)}
									>
										<Icon className="mr-2 h-4 w-4" />
										<span>{item.label}</span>
									</CommandItem>
								);
							})}
						</CommandGroup>
						{index < navigationSections.length - 1 ? (
							<CommandSeparator />
						) : null}
					</React.Fragment>
				))}
				{navigationSections.length > 0 ? <CommandSeparator /> : null}
				<CommandGroup heading="Activity">
					<CommandItem
						onSelect={() =>
							runCommand(() => navigate({ to: "/notifications" }))
						}
					>
						<Bell className="mr-2 h-4 w-4" />
						<span>Notifications</span>
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
