import { Link, useRouterState } from "@tanstack/react-router";
import {
	BookOpen,
	ChevronDown,
	ChevronRight,
	Cloud,
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
import { useState } from "react";
import { SKYFORGE_API } from "../lib/api-client";
import { sessionHasRole } from "../lib/rbac";
import {
	type SkyforgeAuthMode,
	buildLoginUrl,
} from "../lib/skyforge-config";
import { buildCoderLaunchUrl, buildToolLaunchUrl } from "../lib/tool-links";
import { cn } from "../lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type NavItem = {
	label: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	external?: boolean;
	newTab?: boolean;
	adminOnly?: boolean;
	featureFlag?: keyof Features;
	children?: NavItem[];
};

export type Features = {
	giteaEnabled?: boolean;
	minioEnabled?: boolean;
	dexEnabled?: boolean;
	coderEnabled?: boolean;
	yaadeEnabled?: boolean;
	swaggerUIEnabled?: boolean;
	forwardEnabled?: boolean;
	netboxEnabled?: boolean;
	nautobotEnabled?: boolean;
	infobloxEnabled?: boolean;
	jiraEnabled?: boolean;
	dnsEnabled?: boolean;
};

const FORWARD_CLUSTER_URL = "https://skyforge-fwd.local.forwardnetworks.com";
function createNavItems(options?: {
	authMode?: SkyforgeAuthMode | null;
	authenticated?: boolean;
}): NavItem[] {
	const nautobotLaunchUrl = buildToolLaunchUrl("/nautobot/", options);
	const coderLaunchUrl = buildCoderLaunchUrl(options);
	return [
	{ label: "Dashboard", href: "/status", icon: LayoutDashboard },
	{ label: "Deployments", href: "/dashboard/deployments", icon: FolderKanban },
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
		newTab: true,
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
				href: FORWARD_CLUSTER_URL,
				icon: Network,
				external: true,
			},
			{
				label: "Analytics",
				href: "/dashboard/forward-networks",
				icon: ShieldCheck,
			},
			{ label: "ServiceNow", href: "/dashboard/servicenow", icon: Workflow },
		],
	},
	{ label: "Integrations", href: "/dashboard/integrations", icon: Workflow },
	{
		label: "Artifacts",
		href: "/dashboard/s3",
		icon: Server,
		featureFlag: "minioEnabled",
	},
	{
		label: "Git",
		href: "/api/gitea/public",
		icon: GitBranch,
		external: true,
		featureFlag: "giteaEnabled",
	},
	{
		label: "DNS",
		href: `${SKYFORGE_API}/dns/sso?next=/dns/`,
		icon: Network,
		external: true,
		featureFlag: "dnsEnabled",
	},
	{
		label: "Coder",
		href: coderLaunchUrl,
		icon: Cloud,
		external: true,
		featureFlag: "coderEnabled",
	},
	{ label: "Webhooks", href: "/webhooks", icon: Webhook },
	{ label: "Syslog", href: "/syslog", icon: Inbox },
	{ label: "SNMP", href: "/snmp", icon: ShieldCheck },
	{
		label: "API Testing",
		href: `${SKYFORGE_API}/yaade/sso`,
		icon: PanelTop,
		external: true,
		featureFlag: "yaadeEnabled",
	},
	{
		label: "NetBox",
		href: "/netbox/",
		icon: Network,
		external: true,
		featureFlag: "netboxEnabled",
	},
	{
		label: "Jira",
		href: "/dashboard/integrations",
		icon: Workflow,
		featureFlag: "jiraEnabled",
	},
	{
		label: "Nautobot",
		href: nautobotLaunchUrl,
		icon: Network,
		external: true,
		featureFlag: "nautobotEnabled",
	},
	{
		label: "Infoblox",
		href: "/infoblox/",
		icon: Server,
		external: true,
		featureFlag: "infobloxEnabled",
	},
	{ label: "Docs", href: "/dashboard/docs", icon: BookOpen },
	{
		label: "Settings",
		href: "",
		icon: Settings,
		children: [
			{ label: "My Settings", href: "/dashboard/settings", icon: Settings },
			{
				label: "Coder Admin",
				href: coderLaunchUrl,
				icon: Cloud,
				external: true,
				adminOnly: true,
				featureFlag: "coderEnabled",
			},
			{
				label: "Admin Settings",
				href: "/admin/settings",
				icon: Settings,
				adminOnly: true,
			},
			{
				label: "Governance",
				href: "/admin/governance",
				icon: ShieldCheck,
				adminOnly: true,
			},
		],
	},
	];
}

export function buildSideNavItems(
	sessionOrAdmin?: unknown,
	features?: Features,
	authMode?: SkyforgeAuthMode | null,
): NavItem[] {
	const session =
		typeof sessionOrAdmin === "boolean"
			? { isAdmin: sessionOrAdmin }
			: sessionOrAdmin;
	const isAdmin = sessionHasRole(session, "ADMIN");
	const isAuthenticated =
		typeof session === "object" &&
		session !== null &&
		"authenticated" in session &&
		(session as { authenticated?: boolean }).authenticated === true;
	const items = createNavItems({
		authMode,
		authenticated: isAuthenticated,
	});
	const filterItems = (input: NavItem[]): NavItem[] =>
		input.flatMap((item) => {
			if (item.adminOnly && !isAdmin) return [];
			if (item.featureFlag && features && !features[item.featureFlag]) {
				return [];
			}
			if (!item.children) return [item];
			const children = filterItems(item.children);
			if (children.length === 0) return [];
			return [{ ...item, children }];
		});

	return filterItems(items);
}

export function SideNav(props: {
	collapsed?: boolean;
	session?: unknown;
	isAdmin?: boolean;
	features?: Features;
	authMode?: SkyforgeAuthMode | null;
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [expanded, setExpanded] = useState<Record<string, boolean>>({
		Forward: true,
		Settings: true,
	});

	const targetForExternal = "_blank";
	const relForExternal = "noreferrer noopener";
	const shouldOpenNewTab = (item: NavItem) => !!item.external || !!item.newTab;

	const isActiveHref = (href: string) => {
		if (!href) return false;
		if (href === "/") return pathname === "/";
		if (href.endsWith("/")) return pathname.startsWith(href);
		return pathname === href || pathname.startsWith(`${href}/`);
	};

	const toggleExpand = (label: string) => {
		setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
	};

	return (
		<nav className="grid items-start gap-2">
			<div className="space-y-2">
				<div className="grid gap-1">
					{buildSideNavItems(
						props.session ?? { isAdmin: !!props.isAdmin },
						props.features,
						props.authMode ?? null,
					).map((item) => {
						const Icon = item.icon;

						if (item.children) {
							// Check if any child is active to highlight parent
							const isChildActive = item.children.some((child) =>
								isActiveHref(child.href),
							);
							const isOpen = expanded[item.label];

							// Collapsed Mode: Dropdown
							if (props.collapsed) {
								return (
									<DropdownMenu key={item.label}>
										<DropdownMenuTrigger asChild>
											<button
												className={cn(
													"group flex items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors w-full",
													"hover:bg-accent hover:text-accent-foreground",
													isChildActive
														? "bg-accent text-accent-foreground"
														: "transparent",
												)}
												title={item.label}
											>
												<Icon className="h-5 w-5" />
											</button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											side="right"
											align="start"
											sideOffset={10}
										>
											<DropdownMenuLabel>{item.label}</DropdownMenuLabel>
											<DropdownMenuSeparator />
											{item.children.map((child) => (
												<DropdownMenuItem key={child.href} asChild>
													{child.external ? (
														<a
															href={child.href}
															target={targetForExternal}
															rel={relForExternal}
															className="flex items-center gap-2 cursor-pointer w-full"
														>
															<child.icon className="h-4 w-4 mr-2" />
															{child.label}
														</a>
													) : (
														<Link
															to={child.href}
															className="flex items-center gap-2 cursor-pointer w-full"
														>
															<child.icon className="h-4 w-4 mr-2" />
															{child.label}
														</Link>
													)}
												</DropdownMenuItem>
											))}
										</DropdownMenuContent>
									</DropdownMenu>
								);
							}

							// Expanded Mode: Accordion
							return (
								<div key={item.label} className="space-y-1">
									<button
										onClick={() => toggleExpand(item.label)}
										className={cn(
											"group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
											"hover:bg-accent hover:text-accent-foreground",
											isChildActive
												? "text-foreground font-semibold"
												: "text-muted-foreground",
										)}
									>
										<div className="flex items-center">
											<Icon className="mr-2 h-4 w-4" />
											<span>{item.label}</span>
										</div>
										{isOpen ? (
											<ChevronDown className="h-4 w-4 opacity-50" />
										) : (
											<ChevronRight className="h-4 w-4 opacity-50" />
										)}
									</button>
									{isOpen && (
										<div className="grid gap-1 pl-4 border-l ml-4 border-border/50">
											{item.children.map((child) => {
												const active = isActiveHref(child.href);
												const ChildIcon = child.icon;
												const childClass = cn(
													"group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
													"hover:bg-accent hover:text-accent-foreground",
													active
														? "bg-accent text-accent-foreground"
														: "text-muted-foreground",
												);

												if (child.external) {
													return (
														<a
															key={child.href}
															href={child.href}
															target={targetForExternal}
															rel={relForExternal}
															className={childClass}
														>
															<ChildIcon className="mr-2 h-4 w-4 opacity-70 group-hover:opacity-100" />
															<span>{child.label}</span>
														</a>
													);
												}

												return (
													<Link
														key={child.href}
														to={child.href}
														className={childClass}
													>
														<ChildIcon className="mr-2 h-4 w-4 opacity-70 group-hover:opacity-100" />
														<span>{child.label}</span>
													</Link>
												);
											})}
										</div>
									)}
								</div>
							);
						}

						// Standard Item
						const active = isActiveHref(item.href);
						const baseClass = cn(
							"group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
							"hover:bg-accent hover:text-accent-foreground",
							active ? "bg-accent" : "transparent",
							props.collapsed && "justify-center px-2",
						);

						const iconClass = cn(
							"transition-transform duration-200 group-hover:scale-110 group-hover:text-primary",
							props.collapsed ? "h-5 w-5" : "mr-2 h-4 w-4",
						);

						if (item.external) {
							return (
								<a
									key={item.href}
									href={item.href}
									target={targetForExternal}
									rel={relForExternal}
									className={baseClass}
									title={props.collapsed ? item.label : undefined}
								>
									<Icon className={iconClass} />
									{!props.collapsed ? <span>{item.label}</span> : null}
								</a>
							);
						}

						return (
							<Link
								key={item.href}
								to={item.href}
								className={baseClass}
								title={props.collapsed ? item.label : undefined}
								target={shouldOpenNewTab(item) ? targetForExternal : undefined}
								rel={shouldOpenNewTab(item) ? relForExternal : undefined}
							>
								<Icon className={iconClass} />
								{!props.collapsed ? <span>{item.label}</span> : null}
							</Link>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
