import { DeploymentRunOutput } from "@/components/deployments/deployment-run-output";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import type { DeploymentDetailPageState } from "@/hooks/use-deployment-detail-page";
import { Link } from "@tanstack/react-router";
import { Terminal } from "lucide-react";

export function DeploymentDetailLogsTab({
	page,
}: { page: DeploymentDetailPageState }) {
	const { deployment, activeLogs, runsForDeployment } = page;
	if (!deployment) return null;
	return (
		<TabsContent value="logs" className="space-y-6 animate-in fade-in-50">
			<Card>
				<CardHeader>
					<CardTitle>Logs & Events</CardTitle>
					<CardDescription>Live task output.</CardDescription>
				</CardHeader>
				<CardContent>
					{deployment.activeTaskId ? (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="text-sm font-medium">
									Active run: {String(deployment.activeTaskId)}
								</div>
								<Link
									to="/dashboard/runs/$runId"
									params={{ runId: String(deployment.activeTaskId) }}
									className={buttonVariants({ variant: "outline", size: "sm" })}
								>
									Open run details
								</Link>
							</div>
							<div className="rounded-md border bg-zinc-950 p-4 font-mono text-xs text-zinc-100">
								<DeploymentRunOutput entries={activeLogs.data?.entries ?? []} />
							</div>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
							<Terminal className="h-10 w-10 mb-3 opacity-20" />
							<p>No active run.</p>
							<p className="text-xs mt-1">
								Start/stop/destroy will queue runs that appear here.
							</p>
						</div>
					)}
					<div className="mt-8 space-y-3">
						<div className="text-sm font-medium">Recent runs</div>
						<div className="space-y-2">
							{runsForDeployment.length === 0 ? (
								<div className="text-sm text-muted-foreground">
									No runs yet.
								</div>
							) : (
								runsForDeployment.slice(0, 10).map((r) => {
									const id = String(r.id ?? "");
									return (
										<div
											key={id}
											className="flex items-center justify-between gap-3 rounded-md border p-3"
										>
											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<span className="font-mono text-xs">{id}</span>
													<Badge variant="secondary" className="capitalize">
														{String(r.status ?? "")}
													</Badge>
													<span className="text-xs text-muted-foreground truncate">
														{String(r.tpl_alias ?? r.type ?? "")}
													</span>
												</div>
												<div className="text-xs text-muted-foreground truncate mt-1">
													{String(r.status_text ?? r.message ?? "")}
												</div>
											</div>
											<Link
												to="/dashboard/runs/$runId"
												params={{ runId: id }}
												className={buttonVariants({
													variant: "outline",
													size: "sm",
												})}
											>
												View
											</Link>
										</div>
									);
								})
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</TabsContent>
	);
}
