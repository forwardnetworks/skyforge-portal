import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import type { NavItem } from "./side-nav-items";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type NavGroup = NavItem & { children: NavItem[] };

type NavLinkShellProps = {
	item: NavItem;
	className: string;
	title?: string;
	children: ReactNode;
};

type SideNavLeafItemProps = {
	item: NavItem;
	active: boolean;
	collapsed?: boolean;
};

type CollapsedNavGroupProps = {
	item: NavGroup;
	isChildActive: boolean;
};

type ExpandedNavGroupProps = {
	item: NavGroup;
	isChildActive: boolean;
	isOpen: boolean;
	onToggle: (label: string) => void;
	isActiveHref: (href: string) => boolean;
	depth?: number;
};

const relForExternal = "noreferrer noopener";

function targetForItem(item: NavItem) {
	return item.newTab ? "_blank" : undefined;
}

function relForItem(item: NavItem) {
	return item.newTab ? relForExternal : undefined;
}

function NavLinkShell({ item, className, title, children }: NavLinkShellProps) {
	if (item.external) {
		return (
			<a
				href={item.href}
				target={targetForItem(item)}
				rel={relForItem(item)}
				className={className}
				title={title}
			>
				{children}
			</a>
		);
	}

	return (
		<Link
			to={item.href}
			target={targetForItem(item)}
			rel={relForItem(item)}
			className={className}
			title={title}
		>
			{children}
		</Link>
	);
}

function DropdownNavLink({ item }: { item: NavItem }) {
	return (
		<NavLinkShell
			item={item}
			className="flex w-full cursor-pointer items-center gap-2"
		>
			<item.icon className="mr-2 h-4 w-4" />
			{item.label}
		</NavLinkShell>
	);
}

function ExpandedGroupChild({
	item,
	active,
}: { item: NavItem; active: boolean }) {
	const childClass = cn(
		"group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
		"hover:bg-accent hover:text-accent-foreground",
		active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
	);

	return (
		<NavLinkShell item={item} className={childClass}>
			<item.icon className="mr-2 h-4 w-4 opacity-70 group-hover:opacity-100" />
			<span>{item.label}</span>
		</NavLinkShell>
	);
}

function itemOrDescendantActive(
	item: NavItem,
	isActiveHref: (href: string) => boolean,
): boolean {
	if (item.href && isActiveHref(item.href)) {
		return true;
	}
	return (item.children ?? []).some((child) => itemOrDescendantActive(child, isActiveHref));
}

function ExpandedChildTree({
	item,
	isActiveHref,
	onToggle,
	depth = 1,
}: {
	item: NavItem;
	isActiveHref: (href: string) => boolean;
	onToggle: (label: string) => void;
	depth?: number;
}) {
	if (!hasChildren(item)) {
		return <ExpandedGroupChild item={item} active={isActiveHref(item.href)} />;
	}
	return (
		<ExpandedNavGroup
			item={item}
			isChildActive={itemOrDescendantActive(item, isActiveHref)}
			isOpen
			onToggle={onToggle}
			isActiveHref={isActiveHref}
			depth={depth}
		/>
	);
}

export function hasChildren(item: NavItem): item is NavGroup {
	return Array.isArray(item.children) && item.children.length > 0;
}

export function SideNavLeafItem({
	item,
	active,
	collapsed = false,
}: SideNavLeafItemProps) {
	const baseClass = cn(
		"group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
		"hover:bg-accent hover:text-accent-foreground",
		active ? "bg-accent" : "transparent",
		collapsed && "justify-center px-2",
	);
	const iconClass = cn(
		"transition-transform duration-200 group-hover:scale-110 group-hover:text-primary",
		collapsed ? "h-5 w-5" : "mr-2 h-4 w-4",
	);

	return (
		<NavLinkShell
			item={item}
			className={baseClass}
			title={collapsed ? item.label : undefined}
		>
			<item.icon className={iconClass} />
			{collapsed ? null : <span>{item.label}</span>}
		</NavLinkShell>
	);
}

export function CollapsedNavGroup({
	item,
	isChildActive,
}: CollapsedNavGroupProps) {
	const flattenChildren = (items: NavItem[]): NavItem[] =>
		items.flatMap((child) => {
			if (!hasChildren(child)) {
				return [child];
			}
			return child.href ? [child, ...flattenChildren(child.children)] : flattenChildren(child.children);
		});
	const flattenedChildren = flattenChildren(item.children);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					className={cn(
						"group flex w-full items-center justify-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
						"hover:bg-accent hover:text-accent-foreground",
						isChildActive ? "bg-accent text-accent-foreground" : "transparent",
					)}
					title={item.label}
				>
					<item.icon className="h-5 w-5" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent side="right" align="start" sideOffset={10}>
				<DropdownMenuLabel>{item.label}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{item.href ? (
					<>
						<DropdownMenuItem asChild>
							<DropdownNavLink item={item} />
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				) : null}
				{flattenedChildren.map((child) => (
					<DropdownMenuItem key={child.href} asChild>
						<DropdownNavLink item={child} />
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function ExpandedNavGroup({
	item,
	isChildActive,
	isOpen,
	onToggle,
	isActiveHref,
	depth = 0,
}: ExpandedNavGroupProps) {
	return (
		<div className="space-y-1">
			<div
				className={cn(
					"group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
					"hover:bg-accent hover:text-accent-foreground",
					isChildActive || (item.href ? isActiveHref(item.href) : false)
						? "text-foreground font-semibold"
						: "text-muted-foreground",
				)}
			>
				<div className="min-w-0 flex-1">
					{item.href ? (
						<NavLinkShell item={item} className="flex items-center gap-2">
							<item.icon className="h-4 w-4" />
							<span>{item.label}</span>
						</NavLinkShell>
					) : (
						<div className="flex items-center">
							<item.icon className="mr-2 h-4 w-4" />
							<span>{item.label}</span>
						</div>
					)}
				</div>
				<button
					onClick={() => onToggle(item.id ?? item.label)}
					className="ml-2 rounded-sm p-1 hover:bg-accent"
					aria-label={`Toggle ${item.label}`}
				>
					{isOpen ? (
						<ChevronDown className="h-4 w-4 opacity-50" />
					) : (
						<ChevronRight className="h-4 w-4 opacity-50" />
					)}
				</button>
			</div>
			{isOpen ? (
				<div
					className={cn(
						"grid gap-1 border-l border-border/50 pl-4",
						depth === 0 ? "ml-4" : "ml-2",
					)}
				>
					{item.children.map((child) => (
						<ExpandedChildTree
							key={child.id ?? child.href}
							item={child}
							isActiveHref={isActiveHref}
							onToggle={onToggle}
							depth={depth + 1}
						/>
					))}
				</div>
			) : null}
		</div>
	);
}
