import { TopologyViewer } from "@/components/topology-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import type { DeploymentDetailPageState } from "@/hooks/use-deployment-detail-page";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function DeploymentDetailTopologyTab({
	page,
}: { page: DeploymentDetailPageState }) {
	const {
		deployment,
		deploymentEngine,
		topology,
		isC9SDeployment,
		saveConfig,
		saveAllConfigs,
	} = page;
	if (!deployment) return null;
	return (
		<TabsContent value="topology" className="space-y-6 animate-in fade-in-50">
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>Network Topology</CardTitle>
							<CardDescription>
								{deployment.family === "c9s" && deploymentEngine === "netlab"
									? "Derived from C9S/Netlab artifacts after deploy (includes resolved mgmt IPs)."
									: deployment.family === "c9s" &&
											deploymentEngine === "containerlab"
										? "Derived from C9S/Containerlab artifacts after deploy (includes resolved mgmt IPs)."
										: deployment.family === "byos" &&
												deploymentEngine === "containerlab"
										? "Derived from containerlab BYOS artifacts after deploy."
										: deployment.family === "byos" &&
												deploymentEngine === "netlab"
											? "Derived from netlab BYOS artifacts after deploy."
											: "Topology is provider-dependent; not yet implemented for this deployment type."}
							</CardDescription>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								const p = window.location.pathname;
								const base = p.endsWith("/") ? p.slice(0, -1) : p;
								window.open(`${base}/map`, "_blank", "noopener,noreferrer");
							}}
							title="Open the full-screen map view in a new tab"
						>
							<ExternalLink className="mr-2 h-4 w-4" />
							Open map
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<TopologyViewer
						topology={topology.data}
						userId={deployment.userId}
						deploymentId={deployment.id}
						enableTerminal={isC9SDeployment}
					/>
				</CardContent>
			</Card>
			{topology.data?.nodes?.length ? (
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between gap-3">
							<div>
								<CardTitle>Nodes</CardTitle>
								<CardDescription>
									Quick actions (opens in a new tab where applicable).
								</CardDescription>
							</div>
							<Button
								size="sm"
								variant="outline"
								disabled={saveConfig.isPending}
								onClick={saveAllConfigs}
							>
								{saveConfig.isPending ? "Saving…" : "Save all configs"}
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{topology.data.nodes.map((n) => {
								const id = String(n.id);
								const kind = String(n.kind ?? "");
								const ip = String(n.mgmtIp ?? "");
								const status = String(n.status ?? "");
								const baseUrl = `${window.location.pathname}?node=${encodeURIComponent(id)}`;
								return (
									<div
										key={id}
										className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
									>
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<span className="font-mono text-xs">{id}</span>
												{status ? (
													<Badge variant="secondary" className="capitalize">
														{status}
													</Badge>
												) : null}
												{kind ? (
													<span className="text-xs text-muted-foreground truncate">
														{kind}
													</span>
												) : null}
											</div>
											<div className="text-xs text-muted-foreground font-mono truncate mt-1">
												{ip || "—"}
											</div>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<Button
												size="sm"
												variant="outline"
												disabled={!isC9SDeployment}
												onClick={() =>
													window.open(
														`${baseUrl}&action=terminal`,
														"_blank",
														"noopener,noreferrer",
													)
												}
											>
												Terminal
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													window.open(
														`${baseUrl}&action=logs`,
														"_blank",
														"noopener,noreferrer",
													)
												}
											>
												Logs
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													window.open(
														`${baseUrl}&action=describe`,
														"_blank",
														"noopener,noreferrer",
													)
												}
											>
												Describe
											</Button>
											<Button
												size="sm"
												variant="outline"
												disabled={saveConfig.isPending}
												onClick={() => saveConfig.mutate(id)}
											>
												{saveConfig.isPending ? "Saving…" : "Save config"}
											</Button>
											<Button
												size="sm"
												variant="ghost"
												onClick={() => {
													if (!ip.trim()) {
														toast.error("No management IP available");
														return;
													}
													void navigator.clipboard?.writeText(ip);
													toast.success("Copied management IP");
												}}
											>
												Copy IP
											</Button>
										</div>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			) : null}
		</TabsContent>
	);
}
