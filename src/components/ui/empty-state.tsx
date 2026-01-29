import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { Button } from "./button";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
	title: string;
	description?: string;
	icon?: LucideIcon;
	action?: {
		label: string;
		onClick: () => void;
	};
}

export function EmptyState({
	title,
	description,
	icon: Icon,
	action,
	className,
	...props
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in zoom-in duration-300",
				className,
			)}
			{...props}
		>
			<div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
				{Icon && (
					<div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
						<Icon className="h-10 w-10 text-muted-foreground" />
					</div>
				)}
				<h3 className="mt-4 text-lg font-semibold">{title}</h3>
				{description && (
					<p className="mb-4 mt-2 text-sm text-muted-foreground">
						{description}
					</p>
				)}
				{action && (
					<Button onClick={action.onClick} variant="outline" size="sm">
						{action.label}
					</Button>
				)}
			</div>
		</div>
	);
}
