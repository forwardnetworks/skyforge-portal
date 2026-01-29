import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, User } from "lucide-react";
import * as React from "react";
import { Badge } from "./badge";

// Gradient types for Bento items
type Gradient = "blue" | "green" | "purple" | "orange" | "red";

const gradients: Record<Gradient, string> = {
	blue: "from-blue-500/10 via-blue-500/5 to-transparent",
	green: "from-emerald-500/10 via-emerald-500/5 to-transparent",
	purple: "from-purple-500/10 via-purple-500/5 to-transparent",
	orange: "from-orange-500/10 via-orange-500/5 to-transparent",
	red: "from-red-500/10 via-red-500/5 to-transparent",
};

// Base Bento Grid Container
export const BentoGrid = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
			className,
		)}
		{...props}
	/>
));
BentoGrid.displayName = "BentoGrid";

// Base Bento Item
export interface BentoItemProps extends React.HTMLAttributes<HTMLDivElement> {
	gradient?: Gradient;
}

export const BentoItem = React.forwardRef<HTMLDivElement, BentoItemProps>(
	({ className, gradient = "blue", children, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(
				"relative overflow-hidden rounded-xl border border-border bg-card p-6",
				"bg-gradient-to-br",
				gradients[gradient],
				className,
			)}
			{...props}
		>
			{children}
		</div>
	),
);
BentoItem.displayName = "BentoItem";

// Bento Stat Card (for metrics/KPIs)
export interface BentoStatCardProps {
	title: string;
	value: string | number;
	gradient?: Gradient;
	icon?: React.ReactNode;
	subtitle?: string;
	trend?: {
		value: number;
		direction: "up" | "down";
	};
	className?: string;
}

export const BentoStatCard = React.forwardRef<
	HTMLDivElement,
	BentoStatCardProps
>(
	(
		{ title, value, gradient = "blue", icon, subtitle, trend, className },
		ref,
	) => (
		<BentoItem ref={ref} gradient={gradient} className={className}>
			<div className="flex items-center gap-2 mb-2">
				{icon && <div className="text-muted-foreground">{icon}</div>}
				<h3 className="text-sm font-medium text-muted-foreground/80">
					{title}
				</h3>
			</div>
			<div className="flex items-end justify-between">
				<div className="text-3xl font-bold">{value}</div>
				{trend && (
					<div
						className={cn(
							"flex items-center gap-1 text-sm",
							trend.direction === "up" ? "text-emerald-500" : "text-red-500",
						)}
					>
						{trend.direction === "up" ? (
							<TrendingUp className="w-4 h-4" />
						) : (
							<TrendingDown className="w-4 h-4" />
						)}
						{trend.value}%
					</div>
				)}
			</div>
			{subtitle && (
				<p className="text-xs text-muted-foreground/70 mt-2">{subtitle}</p>
			)}
		</BentoItem>
	),
);
BentoStatCard.displayName = "BentoStatCard";

// Bento Welcome Card
export interface BentoWelcomeCardProps {
	userName?: string;
	subtitle?: string;
	className?: string;
}

export const BentoWelcomeCard = React.forwardRef<
	HTMLDivElement,
	BentoWelcomeCardProps
>(({ userName, subtitle, className }, ref) => (
	<BentoItem
		ref={ref}
		gradient="purple"
		className={cn("md:col-span-2", className)}
	>
		<div className="flex items-center gap-3 mb-3">
			<div className="p-2 rounded-full bg-purple-500/10">
				<User className="w-5 h-5 text-purple-500" />
			</div>
			<div>
				<h2 className="text-xl font-bold">
					{userName ? `Welcome back, ${userName}` : "Welcome to Skyforge"}
				</h2>
				{subtitle && (
					<p className="text-sm text-muted-foreground/80">{subtitle}</p>
				)}
			</div>
		</div>
	</BentoItem>
));
BentoWelcomeCard.displayName = "BentoWelcomeCard";

// Bento Quick Actions
export interface QuickAction {
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
}

export interface BentoQuickActionsProps {
	actions: QuickAction[];
	className?: string;
}

export const BentoQuickActions = React.forwardRef<
	HTMLDivElement,
	BentoQuickActionsProps
>(({ actions, className }, ref) => (
	<BentoItem
		ref={ref}
		gradient="blue"
		className={cn("md:col-span-2", className)}
	>
		<h3 className="font-semibold mb-4">Quick Actions</h3>
		<div className="grid grid-cols-2 gap-3">
			{actions.map((action, index) => (
				<motion.button
					key={index}
					onClick={action.onClick}
					className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
					whileHover={{ scale: 1.02 }}
					whileTap={{ scale: 0.98 }}
				>
					{action.icon}
					<span className="text-sm font-medium">{action.label}</span>
				</motion.button>
			))}
		</div>
	</BentoItem>
));
BentoQuickActions.displayName = "BentoQuickActions";

// Bento Server Status
export interface ServerStatus {
	name: string;
	status: "online" | "offline" | "degraded";
	cpu?: number;
}

export interface BentoServerStatusProps {
	servers: ServerStatus[];
	className?: string;
}

export const BentoServerStatus = React.forwardRef<
	HTMLDivElement,
	BentoServerStatusProps
>(({ servers, className }, ref) => (
	<BentoItem
		ref={ref}
		gradient="green"
		className={cn("md:col-span-2", className)}
	>
		<h3 className="font-semibold mb-4">Server Status</h3>
		<div className="grid grid-cols-2 gap-3">
			{servers.map((server, index) => (
				<div
					key={index}
					className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
				>
					<div className="flex items-center gap-2">
						<div
							className={cn(
								"w-2 h-2 rounded-full",
								server.status === "online"
									? "bg-emerald-500"
									: server.status === "degraded"
										? "bg-amber-500"
										: "bg-red-500",
							)}
						/>
						<span className="text-sm font-medium">{server.name}</span>
					</div>
					{server.cpu !== undefined && (
						<Badge variant="secondary" className="text-xs">
							{server.cpu}%
						</Badge>
					)}
				</div>
			))}
		</div>
	</BentoItem>
));
BentoServerStatus.displayName = "BentoServerStatus";
