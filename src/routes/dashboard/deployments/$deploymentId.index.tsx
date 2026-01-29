import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	Box,
	Copy,
	Download,
	ExternalLink,
	FileJson,
	Network,
	Play,
	StopCircle,
	Terminal,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { NodeDescribeView } from "../../../components/node-describe-view";
import { NodeLogsView } from "../../../components/node-logs-view";
import { TerminalView } from "../../../components/terminal-view";
import { TopologyViewer } from "../../../components/topology-viewer";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { Badge } from "../../../components/ui/badge";
import { Button, buttonVariants } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { EmptyState } from "../../../components/ui/empty-state";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { Skeleton } from "../../../components/ui/skeleton";
import { Switch } from "../../../components/ui/switch";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../../components/ui/tabs";
import { useDashboardEvents } from "../../../lib/dashboard-events";
import { queryKeys } from "../../../lib/query-keys";
import {
	type RunLogState,
	type TaskLogEntry,
	useRunEvents,
} from "../../../lib/run-events";
import {
	type DashboardSnapshot,
	type JSONMap,
	type UserForwardCollectorConfigSummary,
	type WorkspaceDeployment,
	deleteDeployment,
	getDeploymentTopology,
	listUserForwardCollectorConfigs,
	saveDeploymentNodeConfig,
	startDeployment,
	stopDeployment,
	syncDeploymentForward,
	updateDeploymentForwardConfig,
} from "../../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/deployments/$deploymentId/")({
	component: DeploymentDetailPage,
	validateSearch: (search: Record<string, unknown>) => {
		const out: { action?: string; node?: string } = {};
		if (typeof search.action === "string" && search.action.trim())
			out.action = search.action.trim();
		if (typeof search.node === "string" && search.node.trim())
			out.node = search.node.trim();
		return out;
	},
});

function DeploymentDetailPage() {
	const { deploymentId } = Route.useParams();
	const { action, node } = Route.useSearch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	useDashboardEvents(true);

	const [destroyDialogOpen, setDestroyDialogOpen] = useState(false);
	const [forwardEnabled, setForwardEnabled] = useState(false);
	const [forwardCollector, setForwardCollector] = useState("");

	const snap = useQuery<DashboardSnapshot | null>({
		queryKey: queryKeys.dashboardSnapshot(),
		queryFn: async () => null,
		initialData: null,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const deployment = useMemo(() => {
		return (snap.data?.deployments ?? []).find(
			(d: WorkspaceDeployment) => d.id === deploymentId,
		);
	}, [snap.data?.deployments, deploymentId]);

	const workspaceId = String(deployment?.workspaceId ?? "");

	const deploymentType = String(deployment?.type ?? "");

	useEffect(() => {
		const enabled = Boolean((deployment?.config ?? {})["forwardEnabled"]);
		const collector = String(
			(deployment?.config ?? {})["forwardCollectorId"] ?? "",
		).trim();
		setForwardEnabled(enabled);
		setForwardCollector(collector);
	}, [deployment?.id, deployment?.config]);

	const activeRunId = String(deployment?.activeTaskId ?? "");
	useRunEvents(activeRunId, Boolean(activeRunId));
	const activeLogs = useQuery({
		queryKey: queryKeys.runLogs(activeRunId),
		queryFn: async () => ({ cursor: 0, entries: [] }) as RunLogState,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
		enabled: Boolean(activeRunId),
	});

	const handleStart = async () => {
		try {
			if (!deployment) throw new Error("deployment not found");
			await startDeployment(deployment.workspaceId, deployment.id);
			toast.success("Deployment starting", {
				description: `${deployment.name} is queued to start.`,
			});
		} catch (e) {
			toast.error("Failed to start", { description: (e as Error).message });
		}
	};

	const handleStop = async () => {
		try {
			if (!deployment) throw new Error("deployment not found");
			await stopDeployment(deployment.workspaceId, deployment.id);
			toast.success("Deployment stopping", {
				description: `${deployment.name} is queued to stop.`,
			});
		} catch (e) {
			toast.error("Failed to stop", { description: (e as Error).message });
		}
	};

	const handleDestroy = async () => {
		try {
			if (!deployment) throw new Error("deployment not found");
			await deleteDeployment(deployment.workspaceId, deployment.id);
			toast.success("Deployment deleted");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			navigate({
				to: "/dashboard/deployments",
				search: { workspace: deployment.workspaceId },
			});
		} catch (e) {
			toast.error("Failed to delete", { description: (e as Error).message });
		}
	};

	const status =
		deployment?.activeTaskStatus ?? deployment?.lastStatus ?? "unknown";
	const isBusy = !!deployment?.activeTaskId;

	const runsForDeployment = useMemo(() => {
		if (!deployment) return [];
		const all = (snap.data?.runs ?? []) as JSONMap[];
		const filtered = all.filter(
			(r) => String(r.workspaceId ?? "") === deployment.workspaceId,
		);
		const depRuns = filtered.filter(
			(r) => String(r.deploymentId ?? "") === deployment.id,
		);
		if (depRuns.length > 0) return depRuns;

		// Fallback for older snapshots that didn't include deploymentId on the run payload.
		return filtered;
	}, [deployment, snap.data?.runs]);

	const topology = useQuery({
		queryKey: queryKeys.deploymentTopology(workspaceId, deploymentId),
		queryFn: async () => {
			if (!deployment) throw new Error("deployment not found");
			return getDeploymentTopology(deployment.workspaceId, deployment.id);
		},
		enabled:
			!!deployment &&
			["containerlab", "netlab-c9s", "clabernetes"].includes(deploymentType),
		retry: false,
		staleTime: 10_000,
	});

	const saveConfig = useMutation({
		mutationFn: async (nodeId: string) => {
			if (!deployment) throw new Error("deployment not found");
			return saveDeploymentNodeConfig(
				deployment.workspaceId,
				deployment.id,
				nodeId,
			);
		},
		onSuccess: (resp, nodeId) => {
			if (resp?.skipped) {
				toast.message("Save config skipped", {
					description: resp.message || `Node ${nodeId}`,
				});
				return;
			}
			toast.success("Save config queued/applied", {
				description: resp.stdout || `Node ${nodeId}`,
			});
		},
		onError: (e) =>
			toast.error("Save config failed", { description: (e as Error).message }),
	});

	const saveAllConfigs = async () => {
		if (!deployment) return;
		const nodes = topology.data?.nodes ?? [];
		if (!nodes.length) {
			toast.message("No nodes to save");
			return;
		}
		if (saveConfig.isPending) return;

		toast.message("Saving configs…", { description: `Nodes: ${nodes.length}` });

		const ids = nodes.map((n) => String(n.id));
		const concurrency = 3;
		let idx = 0;
		let ok = 0;
		let skipped = 0;
		let failed = 0;

		const worker = async () => {
			while (idx < ids.length) {
				const cur = ids[idx++];
				try {
					const resp = await saveDeploymentNodeConfig(
						deployment.workspaceId,
						deployment.id,
						cur,
					);
					if (resp?.skipped) skipped++;
					else ok++;
				} catch {
					failed++;
				}
			}
		};

		await Promise.all(
			Array.from({ length: Math.min(concurrency, ids.length) }, worker),
		);

		if (failed) {
			toast.error("Save configs finished with errors", {
				description: `ok=${ok} skipped=${skipped} failed=${failed}`,
			});
			return;
		}
		toast.success("Save configs finished", {
			description: `ok=${ok} skipped=${skipped}`,
		});
	};

	const downloadDeploymentConfig = () => {
		try {
			if (!deployment) {
				toast.error("Cannot download config", {
					description: "Deployment not found.",
				});
				return;
			}
			const blob = new Blob(
				[JSON.stringify(deployment.config ?? {}, null, 2)],
				{ type: "application/json" },
			);
			const a = document.createElement("a");
			const safeName = String(deployment.name ?? "deployment").replace(
				/[^a-zA-Z0-9._-]+/g,
				"_",
			);
			a.href = URL.createObjectURL(blob);
			a.download = `${safeName}.config.json`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(a.href), 5_000);
			toast.success("Downloaded config");
		} catch (e) {
			toast.error("Failed to download config", {
				description: (e as Error).message,
			});
		}
	};

	const forwardCollectorsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		enabled: forwardEnabled,
		retry: false,
		staleTime: 30_000,
	});
	const forwardCollectors = (forwardCollectorsQ.data?.collectors ??
		[]) as UserForwardCollectorConfigSummary[];

	const updateForward = useMutation({
		mutationFn: async (next: {
			enabled: boolean;
			collectorConfigId?: string;
		}) => {
			if (!deployment) throw new Error("deployment not found");
			return updateDeploymentForwardConfig(
				deployment.workspaceId,
				deployment.id,
				next,
			);
		},
		onSuccess: async () => {
			toast.success("Forward settings updated");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
		},
		onError: (e) =>
			toast.error("Failed to update Forward settings", {
				description: (e as Error).message,
			}),
	});

	const syncForward = useMutation({
		mutationFn: async () => {
			if (!deployment) throw new Error("deployment not found");
			return syncDeploymentForward(deployment.workspaceId, deployment.id);
		},
		onSuccess: async (resp) => {
			toast.success("Forward sync queued", {
				description: `Run ${String(resp.run?.id ?? "")}`,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
		},
		onError: (e) =>
			toast.error("Failed to sync to Forward", {
				description: (e as Error).message,
			}),
	});

	// Handling for standalone tool windows (terminal, logs, describe)
	// This must be at the end to ensure hooks run unconditionally.
	if (action && node && deployment) {
		if (action === "terminal") {
			return (
				<div className="h-screen w-screen bg-zinc-950 flex flex-col">
					<TerminalView
						workspaceId={workspaceId}
						deploymentId={deploymentId}
						nodeId={node}
						className="flex-1"
					/>
				</div>
			);
		}
		if (action === "logs") {
			return (
				<div className="h-screen w-screen bg-background flex flex-col">
					<NodeLogsView
						workspaceId={workspaceId}
						deploymentId={deploymentId}
						nodeId={node}
						className="flex-1"
					/>
				</div>
			);
		}
		if (action === "describe") {
			return (
				<div className="h-screen w-screen bg-background flex flex-col">
					<NodeDescribeView
						workspaceId={workspaceId}
						deploymentId={deploymentId}
						nodeId={node}
						className="flex-1"
					/>
				</div>
			);
		}
	}

	if (!deployment) {
		if (snap.isLoading || snap.isFetching) {
			return (
				<div className="space-y-6 p-6">
					<div className="flex items-center gap-4">
						<Skeleton className="h-10 w-32" />
						<Skeleton className="h-10 w-48" />
					</div>
					<Skeleton className="h-[400px] w-full" />
				</div>
			);
		}
		return (
			<div className="p-6">
				<EmptyState
					icon={Box}
					title="Deployment not found"
					description="This deployment may have been deleted or you don't have access."
					action={{
						label: "Back to Deployments",
						onClick: () => navigate({ to: "/dashboard/deployments" }),
					}}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6 pb-20">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-3">
					<Link
						to="/dashboard/deployments"
						className={buttonVariants({
							variant: "outline",
							size: "icon",
							className: "h-9 w-9",
						})}
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<div>
						<h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
							{deployment.name}
							<StatusBadge status={status} />
						</h1>
						<p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
							<span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
								{deployment.id}
							</span>
							<span>•</span>
							<span className="capitalize">{deployment.type}</span>
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleStart}
						disabled={isBusy}
					>
						<Play className="mr-2 h-4 w-4" /> Start
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={handleStop}
						disabled={isBusy}
					>
						<StopCircle className="mr-2 h-4 w-4" /> Stop
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => setDestroyDialogOpen(true)}
						disabled={isBusy}
					>
						<Trash2 className="mr-2 h-4 w-4" /> Delete
					</Button>
				</div>
			</div>

			<Tabs defaultValue="topology" className="space-y-6">
				<TabsList>
					<TabsTrigger value="topology" className="gap-2">
						<Network className="h-4 w-4" /> Topology
					</TabsTrigger>
					<TabsTrigger value="logs" className="gap-2">
						<Terminal className="h-4 w-4" /> Logs & Events
					</TabsTrigger>
					<TabsTrigger value="config" className="gap-2">
						<FileJson className="h-4 w-4" /> Configuration
					</TabsTrigger>
				</TabsList>

				<TabsContent
					value="topology"
					className="space-y-6 animate-in fade-in-50"
				>
					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between">
								<div>
									<CardTitle>Network Topology</CardTitle>
									<CardDescription>
										{deployment.type === "containerlab"
											? "Derived from containerlab after deploy (includes resolved mgmt IPs)."
											: deployment.type === "netlab-c9s"
												? "Derived from clabernetes after deploy (includes resolved mgmt IPs)."
												: deployment.type === "clabernetes"
													? "Derived from clabernetes after deploy (includes resolved mgmt IPs)."
													: "Topology is provider-dependent; not yet implemented for this deployment type."}
									</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											const p = window.location.pathname;
											const base = p.endsWith("/") ? p.slice(0, -1) : p;
											window.open(
												`${base}/map`,
												"_blank",
												"noopener,noreferrer",
											);
										}}
										title="Open the full-screen map view in a new tab"
									>
										<ExternalLink className="mr-2 h-4 w-4" />
										Open map
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<TopologyViewer
								topology={topology.data}
								workspaceId={deployment.workspaceId}
								deploymentId={deployment.id}
								enableTerminal={["netlab-c9s", "clabernetes"].includes(
									deployment.type,
								)}
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
														disabled={
															!["netlab-c9s", "clabernetes"].includes(
																deployment.type,
															)
														}
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
											className={buttonVariants({
												variant: "outline",
												size: "sm",
											})}
										>
											Open run details
										</Link>
									</div>
									<div className="rounded-md border bg-zinc-950 p-4 font-mono text-xs text-zinc-100">
										<RunOutput entries={activeLogs.data?.entries ?? []} />
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

				<TabsContent value="config" className="space-y-6 animate-in fade-in-50">
					<Card>
						<CardHeader>
							<CardTitle>Forward Networks</CardTitle>
							<CardDescription>
								Optional: sync device IPs into Forward for collection.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<div className="text-sm font-medium">
										Enable Forward collection
									</div>
									<div className="text-xs text-muted-foreground">
										Requires configuring your Collector first.
									</div>
								</div>
								<Switch
									checked={forwardEnabled}
									disabled={updateForward.isPending}
									onCheckedChange={(checked) => {
										setForwardEnabled(checked);
										const nextCollector = checked
											? forwardCollector.trim()
											: "";
										updateForward.mutate({
											enabled: checked,
											collectorConfigId: nextCollector || undefined,
										});
									}}
								/>
							</div>

							{forwardEnabled ? (
								<div className="grid gap-3 md:grid-cols-2">
									<div className="space-y-2">
										<div className="text-sm font-medium">Collector</div>
										<Select
											value={forwardCollector}
											onValueChange={(val) => {
												setForwardCollector(val);
												updateForward.mutate({
													enabled: true,
													collectorConfigId: val,
												});
											}}
											disabled={
												forwardCollectorsQ.isLoading ||
												forwardCollectorsQ.isError ||
												updateForward.isPending
											}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={
														forwardCollectorsQ.isLoading
															? "Loading…"
															: forwardCollectorsQ.isError
																? "Configure Collector first"
																: "Select collector…"
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{forwardCollectors.map((c) => (
													<SelectItem key={c.id} value={c.id}>
														{c.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="flex items-end gap-2">
										<Button
											variant="outline"
											onClick={() => syncForward.mutate()}
											disabled={
												!forwardCollector.trim() ||
												syncForward.isPending ||
												updateForward.isPending
											}
										>
											{syncForward.isPending ? "Queueing…" : "Sync now"}
										</Button>
									</div>
								</div>
							) : null}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<div className="flex items-center justify-between gap-3">
								<div>
									<CardTitle>Configuration</CardTitle>
									<CardDescription>
										Read-only view of the deployment parameters.
									</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											void navigator.clipboard?.writeText(
												JSON.stringify(deployment.config ?? {}, null, 2),
											);
											toast.success("Copied config JSON");
										}}
									>
										<Copy className="mr-2 h-4 w-4" />
										Copy
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={downloadDeploymentConfig}
									>
										<Download className="mr-2 h-4 w-4" />
										Download
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<pre className="bg-muted p-4 rounded-lg overflow-auto font-mono text-xs max-h-[500px]">
								{JSON.stringify(deployment.config, null, 2)}
							</pre>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<AlertDialog open={destroyDialogOpen} onOpenChange={setDestroyDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete deployment?</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove <strong>{deployment.name}</strong> from Skyforge
							and trigger provider cleanup. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDestroy}
							className={buttonVariants({ variant: "destructive" })}
						>
							Delete Deployment
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	let variant: "default" | "secondary" | "destructive" | "outline" =
		"secondary";
	const s = status.toLowerCase();
	if (["running", "active", "healthy", "succeeded", "success"].includes(s))
		variant = "default";
	if (["failed", "error", "stopped", "crashloopbackoff"].includes(s))
		variant = "destructive";

	return (
		<Badge variant={variant} className="capitalize">
			{status}
		</Badge>
	);
}

function RunOutput(props: { entries: TaskLogEntry[] }) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [props.entries.length]);

	if (props.entries.length === 0)
		return <div className="text-zinc-500">Waiting for output…</div>;

	return (
		<div
			ref={containerRef}
			className="max-h-[65vh] overflow-auto whitespace-pre-wrap"
		>
			{props.entries.map((e, idx) => (
				<div key={`${e.time}-${idx}`}>
					<span className="text-zinc-500 select-none">
						{e.time ? `${e.time} ` : ""}
					</span>
					<span>{e.output}</span>
				</div>
			))}
		</div>
	);
}
