import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	type NavFeatures,
	getNavigationSections,
	isNavItemActive,
} from "../lib/navigation";
import { cn } from "../lib/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function SideNav(props: {
	collapsed?: boolean;
	isAdmin?: boolean;
	features?: NavFeatures;
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const sections = useMemo(
		() =>
			getNavigationSections({
				isAdmin: props.isAdmin,
				features: props.features,
			}),
		[props.isAdmin, props.features],
	);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({
		operate: true,
		forward: true,
		integrations: true,
	});

	useEffect(() => {
		setExpanded((prev) => {
			const next = { ...prev };
			for (const section of sections) {
				if (next[section.id] === undefined) {
					next[section.id] = Boolean(section.defaultExpanded);
				}
			}
			return next;
		});
	}, [sections]);

	const targetForExternal = "_blank";
	const relForExternal = "noreferrer noopener";
	const toggleExpand = (sectionId: string) => {
		setExpanded((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
	};

	return (
		<nav className="grid items-start gap-2">
			<div className="space-y-2">
				<div className="grid gap-1">
					{sections.map((section) => {
						const SectionIcon = section.icon;
						const isChildActive = section.items.some((item) =>
							isNavItemActive(pathname, item),
						);
						const isOpen = expanded[section.id];

						if (props.collapsed) {
							return (
								<DropdownMenu key={section.id}>
									<DropdownMenuTrigger asChild>
										<button
											className={cn(
												"group flex items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors w-full",
												"hover:bg-accent hover:text-accent-foreground",
												isChildActive
													? "bg-accent text-accent-foreground"
													: "transparent",
											)}
											title={section.label}
										>
											<SectionIcon className="h-5 w-5" />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										side="right"
										align="start"
										sideOffset={10}
									>
										<DropdownMenuLabel>{section.label}</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{section.items.map((item) => (
											<DropdownMenuItem key={item.id} asChild>
												{item.external || item.newTab ? (
													<a
														href={item.href}
														target={targetForExternal}
														rel={relForExternal}
														className="flex items-center gap-2 cursor-pointer w-full"
													>
														<item.icon className="h-4 w-4 mr-2" />
														{item.label}
													</a>
												) : (
													<Link
														to={item.href}
														className="flex items-center gap-2 cursor-pointer w-full"
													>
														<item.icon className="h-4 w-4 mr-2" />
														{item.label}
													</Link>
												)}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							);
						}

						return (
							<div key={section.id} className="space-y-1">
								<button
									onClick={() => toggleExpand(section.id)}
									className={cn(
										"group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
										"hover:bg-accent hover:text-accent-foreground",
										isChildActive
											? "text-foreground font-semibold"
											: "text-muted-foreground",
									)}
								>
									<div className="flex items-center">
										<SectionIcon className="mr-2 h-4 w-4" />
										<span>{section.label}</span>
									</div>
									{isOpen ? (
										<ChevronDown className="h-4 w-4 opacity-50" />
									) : (
										<ChevronRight className="h-4 w-4 opacity-50" />
									)}
								</button>
								{isOpen ? (
									<div className="grid gap-1 pl-4 border-l ml-4 border-border/50">
										{section.items.map((item) => {
											const active = isNavItemActive(pathname, item);
											const itemClass = cn(
												"group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
												"hover:bg-accent hover:text-accent-foreground",
												active
													? "bg-accent text-accent-foreground"
													: "text-muted-foreground",
											);

											if (item.external || item.newTab) {
												return (
													<a
														key={item.id}
														href={item.href}
														target={targetForExternal}
														rel={relForExternal}
														className={itemClass}
													>
														<item.icon className="mr-2 h-4 w-4 opacity-70 group-hover:opacity-100" />
														<span>{item.label}</span>
													</a>
												);
											}

											return (
												<Link
													key={item.id}
													to={item.href}
													className={itemClass}
												>
													<item.icon className="mr-2 h-4 w-4 opacity-70 group-hover:opacity-100" />
													<span>{item.label}</span>
												</Link>
											);
										})}
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			</div>
		</nav>
	);
}
