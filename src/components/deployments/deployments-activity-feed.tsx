import { Link } from "@tanstack/react-router";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { DeploymentStatusBadge } from "./deployment-status-badge";

export function DeploymentsActivityFeed({
	isFeedOpen,
	runsLoading,
	runs,
	setIsFeedOpen,
	snap,
}: Pick<
	DeploymentsPageState,
	"isFeedOpen" | "runs" | "runsLoading" | "setIsFeedOpen" | "snap"
>) {
	return (
		<div
			className={cn(
				"transition-all duration-300 ease-in-out border-l space-y-4 shrink-0",
				isFeedOpen
					? "w-full lg:w-80 xl:w-96 pl-6 opacity-100"
					: "w-0 lg:w-12 pl-0 opacity-100 border-none lg:border-l",
			)}
		>
			<div
				className={cn(
					"flex items-center gap-2 h-[40px]",
					!isFeedOpen && "justify-center",
				)}
			>
				{isFeedOpen ? (
					<>
						<Activity className="h-4 w-4 text-muted-foreground" />
						<h3 className="flex-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
							Activity Feed
						</h3>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6 text-muted-foreground hover:text-foreground"
							onClick={() => setIsFeedOpen(false)}
							title="Collapse feed"
						>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</>
				) : (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-muted-foreground hover:text-foreground"
						onClick={() => setIsFeedOpen(true)}
						title="Expand activity feed"
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
				)}
			</div>

			<div className={cn("space-y-3", !isFeedOpen && "hidden")}>
				{runsLoading || !snap.data ? (
					<div className="space-y-3">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				) : runs.length === 0 ? (
					<Card>
						<CardContent className="p-6 text-center text-sm text-muted-foreground">
							No recent activity.
						</CardContent>
					</Card>
				) : (
					<div className="space-y-3">
						{runs.slice(0, 15).map((r) => (
							<Link
								key={String(r.id ?? Math.random())}
								to="/dashboard/runs/$runId"
								params={{ runId: String(r.id ?? "") }}
								className="block group"
							>
								<Card className="hover:border-primary/50 transition-colors">
									<CardContent className="p-3">
										<div className="flex items-start justify-between gap-2">
											<div className="flex flex-col gap-1 min-w-0">
												<div className="flex items-center gap-2">
													<span className="font-mono text-xs font-medium text-foreground">
														#{String(r.id ?? "")}
													</span>
													<span className="text-xs text-muted-foreground truncate max-w-[120px]">
														{String(r.tpl_alias ?? r.type ?? "Run")}
													</span>
												</div>
												<div className="text-xs text-muted-foreground truncate">
													{String(r.message || "No message")}
												</div>
											</div>
											<DeploymentStatusBadge
												status={String(r.status ?? "")}
												size="xs"
											/>
										</div>
										<div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
											<span>{String(r.user_name ?? "system")}</span>
											<span>
												{new Date(String(r.created)).toLocaleString(undefined, {
													month: "short",
													day: "numeric",
													hour: "numeric",
													minute: "numeric",
												})}
											</span>
										</div>
									</CardContent>
								</Card>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
