import {
	Activity,
	Boxes,
	Database,
	GitBranch,
	HardDrive,
	Package2,
	ServerCog,
	ShieldCheck,
	type LucideIcon,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

export type StatusCheckView = {
	name: string;
	status: string;
	detail?: string;
	icon?: string;
};

function toneForStatus(status?: string): "healthy" | "degraded" {
	const value = String(status ?? "").trim().toLowerCase();
	if (value === "up" || value === "ok" || value === "ready") return "healthy";
	return "degraded";
}

function badgeVariantForStatus(
	status?: string,
): "secondary" | "destructive" | "outline" {
	return toneForStatus(status) === "healthy" ? "secondary" : "destructive";
}

function labelForStatus(status?: string): string {
	const value = String(status ?? "").trim().toLowerCase();
	if (!value) return "unknown";
	if (value === "up") return "healthy";
	if (value === "down") return "degraded";
	return value;
}

function iconForCheck(name: string): LucideIcon {
	switch (name) {
		case "skyforge-api":
			return ShieldCheck;
		case "postgres":
			return Database;
		case "redis":
			return HardDrive;
		case "gitea":
			return GitBranch;
		case "task-workers":
			return ServerCog;
		case "task-queue":
			return Boxes;
		case "nsq":
			return Package2;
		default:
			return Activity;
	}
}

function titleizeCheck(name: string): string {
	return name.replace(/[-_]/g, " ");
}

export function StatusCheckGrid(props: {
	checks: StatusCheckView[];
	compact?: boolean;
}) {
	if (props.checks.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
				Status checks have not been reported yet.
			</div>
		);
	}

	return (
		<div
			className={cn(
				"grid gap-3",
				props.compact ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2",
			)}
		>
			{props.checks.map((check) => {
				const Icon = iconForCheck(check.name);
				const healthy = toneForStatus(check.status) === "healthy";
				return (
					<div
						key={`${check.name}:${check.status}:${check.detail ?? ""}`}
						className={cn(
							"rounded-2xl border px-4 py-4",
							healthy
								? "border-emerald-500/25 bg-emerald-500/5"
								: "border-amber-500/30 bg-amber-500/5",
						)}
					>
						<div className="flex items-start justify-between gap-3">
							<div className="flex items-center gap-3">
								<div
									className={cn(
										"flex h-9 w-9 items-center justify-center rounded-xl border",
										healthy
											? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
											: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
									)}
								>
									<Icon className="h-4 w-4" />
								</div>
								<div>
									<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
										Core service
									</div>
									<div className="font-medium capitalize">
										{titleizeCheck(check.name)}
									</div>
								</div>
							</div>
							<Badge variant={badgeVariantForStatus(check.status)}>
								{labelForStatus(check.status)}
							</Badge>
						</div>
						<div className="mt-3 text-sm text-muted-foreground">
							{check.detail?.trim() || "No additional detail reported."}
						</div>
					</div>
				);
			})}
		</div>
	);
}

