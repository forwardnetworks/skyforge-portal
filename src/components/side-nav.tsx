import { Link, useRouterState } from "@tanstack/react-router";
import {
	BookOpen,
	ChevronDown,
	ChevronRight,
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
	Sparkles,
	Webhook,
	Workflow,
} from "lucide-react";
import { useState } from "react";
import { SKYFORGE_API } from "../lib/skyforge-api";
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
	children?: NavItem[];
};

type Features = {
	giteaEnabled?: boolean;
	objectStorageEnabled?: boolean;
	dexEnabled?: boolean;
	coderEnabled?: boolean;
	yaadeEnabled?: boolean;
	swaggerUIEnabled?: boolean;
	forwardEnabled?: boolean;
	netboxEnabled?: boolean;
	nautobotEnabled?: boolean;
	dnsEnabled?: boolean;
};

const items: NavItem[] = [
	{ label: "Dashboard", href: "/status", icon: LayoutDashboard },
	{ label: "Deployments", href: "/dashboard/deployments", icon: FolderKanban },
	{ label: "Runs", href: "/dashboard/runs", icon: Workflow },
	{
		label: "Designer",
		href: "/dashboard/labs/designer",
		icon: Hammer,
		newTab: true,
	},
	{
		label: "Connect",
		href: "",
		icon: Workflow,
		children: [
			{ label: "Overview", href: "/dashboard/integrations", icon: Workflow },
			{ label: "Forward Collector", href: "/dashboard/forward", icon: Radio },
			{
				label: "Forward Networks",
				href: "/dashboard/forward-networks",
				icon: Network,
			},
			{ label: "ServiceNow", href: "/dashboard/servicenow", icon: Workflow },
			{ label: "Artifacts", href: "/dashboard/s3", icon: Server },
			{ label: "Git", href: "/git/", icon: GitBranch, external: true },
			{
				label: "DNS",
				href: `${SKYFORGE_API}/dns/sso?next=/dns/`,
				icon: Network,
				external: true,
			},
			// Default UX: send users directly to the VS Code app inside Coder.
			{ label: "Coder", href: "/coder/launch", icon: Cloud, external: true },
			// Admins can still access the full Coder UI for management.
			{
				label: "Coder Admin",
				href: "/coder/",
				icon: Cloud,
				external: true,
				adminOnly: true,
			},
		],
	},
	{
		label: "Tools",
		href: "",
		icon: Database,
		children: [
			{ label: "AI", href: "/dashboard/ai", icon: Sparkles },
			{
				label: "Policy Reports",
				href: "/dashboard/policy-reports",
				icon: ShieldCheck,
			},
			{ label: "Webhooks", href: "/webhooks", icon: Webhook },
			{ label: "Syslog", href: "/syslog", icon: Inbox },
			{ label: "SNMP", href: "/snmp", icon: ShieldCheck },
			{
				label: "API Testing",
				href: `${SKYFORGE_API}/yaade/sso`,
				icon: PanelTop,
				external: true,
			},
			{ label: "NetBox", href: "/netbox/", icon: Network, external: true },
			{ label: "Nautobot", href: "/nautobot/", icon: Network, external: true },
			{ label: "Docs", href: "/dashboard/docs", icon: BookOpen },
		],
	},
	{
		label: "Settings",
		href: "",
		icon: Settings,
		children: [
			{ label: "My Settings", href: "/dashboard/settings", icon: Settings },
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

export function SideNav(props: {
	collapsed?: boolean;
	isAdmin?: boolean;
	features?: Features;
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [expanded, setExpanded] = useState<Record<string, boolean>>({
		Tools: true,
		Connect: true,
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
					{items
						.filter((item) => (item.adminOnly ? !!props.isAdmin : true))
						.flatMap((item) => {
							const f = props.features;
							if (!f) return [item];

							if (item.label === "Connect") {
								const children =
									item.children?.filter((child) => {
										if (child.label === "Forward Collector")
											return !!f.forwardEnabled;
										if (child.label === "Forward Networks")
											return !!f.forwardEnabled;
										if (child.label === "ServiceNow") return !!f.forwardEnabled;
										if (child.label === "Artifacts")
											return !!f.objectStorageEnabled;
										if (child.label === "Git") return !!f.giteaEnabled;
										if (child.label === "DNS") return !!f.dnsEnabled;
										if (child.label === "Coder") return !!f.coderEnabled;
										if (child.label === "Coder Admin") return !!f.coderEnabled;
										if (child.adminOnly) return !!props.isAdmin;
										return true;
									}) ?? [];
								if (children.length === 0) return [];
								return [{ ...item, children }];
							}

							if (item.label === "Tools") {
								const children =
									item.children?.filter((child) => {
										if (child.label === "API Testing") return !!f.yaadeEnabled;
										if (child.label === "NetBox") return !!f.netboxEnabled;
										if (child.label === "Nautobot") return !!f.nautobotEnabled;
										return true;
									}) ?? [];
								if (children.length === 0) return [];
								return [{ ...item, children }];
							}

							if (item.label === "Settings") {
								const children =
									item.children?.filter((child) => {
										if (child.adminOnly) return !!props.isAdmin;
										return true;
									}) ?? [];
								if (children.length === 0) return [];
								return [{ ...item, children }];
							}

							return [item];
						})
						.map((item) => {
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
									target={
										shouldOpenNewTab(item) ? targetForExternal : undefined
									}
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
