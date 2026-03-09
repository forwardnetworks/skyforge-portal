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
	TrendingUp,
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
import {
	type DashboardSnapshot,
	type DeploymentResourceEstimateResponse,
	type ResourceEstimateSummary,
	type UserForwardCollectorConfigSummary,
	type UserScopeDeployment,
	deleteDeployment,
	getDeploymentResourceEstimate,
	getDeploymentTopology,
	listUserForwardCollectorConfigs,
	saveDeploymentNodeConfig,
	syncDeploymentForward,
	updateDeploymentForwardConfig,
} from "../../../lib/api-client";
import { useDashboardEvents } from "../../../lib/dashboard-events";
import {
	deploymentActionQueueDescription,
	noOpMessageForDeploymentAction,
	runDeploymentActionWithRetry,
} from "../../../lib/deployment-actions";
import { queryKeys } from "../../../lib/query-keys";
import {
	type RunLogState,
	type TaskLogEntry,
	useRunEvents,
} from "../../../lib/run-events";

export const Route = createFileRoute("/dashboard/deployments/$deploymentId/")({
	component: DeploymentDetailPage,
	validateSearch: (search: Record<string, unknown>) => {
		const out: { action?: string; node?: string; tab?: string } = {};
		if (typeof search.action === "string" && search.action.trim())
			out.action = search.action.trim();
		if (typeof search.node === "string" && search.node.trim())
			out.node = search.node.trim();
		if (typeof search.tab === "string" && search.tab.trim())
			out.tab = search.tab.trim();
		return out;
	},
});

function formatResourceEstimateSummary(
	estimate?: ResourceEstimateSummary,
): string {
	if (!estimate || !estimate.supported) return "Resource estimate unavailable";
	const cpu = Number.isFinite(estimate.vcpu) ? estimate.vcpu.toFixed(1) : "0.0";
	const ram = Number.isFinite(estimate.ramGiB)
		? estimate.ramGiB.toFixed(1)
		: "0.0";
	return `${cpu} vCPU • ${ram} GiB RAM`;
}

function resourceEstimateReasonFromError(err: unknown): string {
	const msg = String((err as Error)?.message ?? "").trim();
	if (!msg) return "Resource estimate unavailable";
	if (msg.toLowerCase().includes("timed out")) {
		return "Resource estimate timed out";
	}
	return "Resource estimate unavailable";
}

function DeploymentDetailPage() {
	const { deploymentId } = Route.useParams();
	const { action, node, tab } = Route.useSearch();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	useDashboardEvents(true);

	const [destroyDialogOpen, setDestroyDialogOpen] = useState(false);
	const [forwardEnabled, setForwardEnabled] = useState(false);
	const [forwardCollector, setForwardCollector] = useState("");
	const [forwardAutoSyncOnBringUp, setForwardAutoSyncOnBringUp] =
		useState(false);
	const [actionPending, setActionPending] = useState(false);
	const normalizedTab =
		tab === "logs" || tab === "config" || tab === "topology" ? tab : "topology";
	const [activeTab, setActiveTab] = useState<"topology" | "logs" | "config">(
		normalizedTab,
	);

	const snap = useQuery<DashboardSnapshot | null>({
		queryKey: queryKeys.dashboardSnapshot(),
		queryFn: async () => null,
		initialData: null,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const deployment = useMemo(() => {
		return (snap.data?.deployments ?? []).find(
			(d: UserScopeDeployment) => d.id === deploymentId,
		);
	}, [snap.data?.deployments, deploymentId]);

	const userId = String(deployment?.userId ?? "");

	const deploymentType = String(deployment?.family ?? "");
	const deploymentEngine = String(deployment?.engine ?? "")
		.trim()
		.toLowerCase();
	const isC9SDeployment = deploymentType === "c9s";

	useEffect(() => {
		const enabled = Boolean((deployment?.config ?? {})["forwardEnabled"]);
		const collector = String(
			(deployment?.config ?? {})["forwardCollectorId"] ?? "",
		).trim();
		const autoSync =
			Boolean(deployment?.autoSyncOnBringUp) ||
			Boolean((deployment?.config ?? {})["forwardAutoSyncOnBringUp"]);
		setForwardEnabled(enabled);
		setForwardCollector(collector);
		setForwardAutoSyncOnBringUp(autoSync);
	}, [deployment?.id, deployment?.config, deployment?.autoSyncOnBringUp]);
	useEffect(() => {
		setActiveTab(normalizedTab);
	}, [normalizedTab, deploymentId]);

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
		if (actionPending) return;
		setActionPending(true);
		try {
			if (!deployment) throw new Error("deployment not found");
			const action = await runDeploymentActionWithRetry(
				deployment.userId,
				deployment.id,
				"start",
			);
			if (!action.queued) {
				toast.message(
					noOpMessageForDeploymentAction("start", action.meta.reason),
					{
						description: deployment.name,
					},
				);
			} else {
				toast.success("Deployment starting", {
					description: deploymentActionQueueDescription(
						action.queue,
						deployment.name,
					),
				});
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
		} catch (e) {
			toast.error("Start action failed", {
				description: (e as Error).message,
			});
		} finally {
			setActionPending(false);
		}
	};

	const handleStop = async () => {
		if (actionPending) return;
		setActionPending(true);
		try {
			if (!deployment) throw new Error("deployment not found");
			const action = await runDeploymentActionWithRetry(
				deployment.userId,
				deployment.id,
				"stop",
			);
			if (!action.queued) {
				toast.message(
					noOpMessageForDeploymentAction("stop", action.meta.reason),
					{
						description: deployment.name,
					},
				);
			} else {
				toast.success("Deployment stopping", {
					description: deploymentActionQueueDescription(
						action.queue,
						deployment.name,
					),
				});
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
		} catch (e) {
			toast.error("Stop action failed", {
				description: (e as Error).message,
			});
		} finally {
			setActionPending(false);
		}
	};

	const handleDestroy = async () => {
		if (actionPending) return;
		setActionPending(true);
		try {
			if (!deployment) throw new Error("deployment not found");
			await deleteDeployment(deployment.userId, deployment.id);
			toast.success("Deployment deleted");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			navigate({
				to: "/dashboard/deployments",
				search: { userId: deployment.userId },
			});
		} catch (e) {
			const msg = (e as Error).message;
			toast.error("Failed to delete", { description: msg });
		} finally {
			setActionPending(false);
		}
	};

	const status = deployment
		? resolveDeploymentDisplayStatus(deployment)
		: "unknown";
	const primaryAction = deployment
		? resolveDeploymentPrimaryAction(deployment)
		: "none";
	const isBusy = !!deployment?.activeTaskId || actionPending;
	const forwardNetworkID = String(
		(deployment?.config ?? {})["forwardNetworkId"] ?? "",
	).trim();

	const runsForDeployment = useMemo(() => {
		if (!deployment) return [];
		const all = (snap.data?.runs ?? []) as Record<string, unknown>[];
		const filtered = all.filter(
			(r) => String(r.userId ?? "") === deployment.userId,
		);
		const depRuns = filtered.filter(
			(r) => String(r.deploymentId ?? "") === deployment.id,
		);
		if (depRuns.length > 0) return depRuns;

		// Fallback for older snapshots that didn't include deploymentId on the run payload.
		return filtered;
	}, [deployment, snap.data?.runs]);

	const topology = useQuery({
		queryKey: queryKeys.deploymentTopology(userId, deploymentId),
		queryFn: async () => {
			if (!deployment) throw new Error("deployment not found");
			return getDeploymentTopology(deployment.userId, deployment.id);
		},
		enabled: !!deployment && ["c9s", "byos"].includes(deploymentType),
		retry: false,
		staleTime: 10_000,
	});

	const resourceEstimateQ = useQuery<DeploymentResourceEstimateResponse>({
		queryKey: ["deployment-resource-estimate", userId, deploymentId],
		queryFn: async () => {
			if (!deployment) throw new Error("deployment not found");
			try {
				return await getDeploymentResourceEstimate(
					deployment.userId,
					deployment.id,
				);
			} catch (err) {
				return {
					userId: deployment.userId,
					deploymentId: deployment.id,
					family: String(deployment.family ?? ""),
					engine: String(deployment.engine ?? ""),
					estimate: {
						supported: false,
						reason: resourceEstimateReasonFromError(err),
						vcpu: 0,
						ramGiB: 0,
						milliCpu: 0,
						memoryBytes: 0,
						nodeCount: 0,
						profiledNodeCount: 0,
					},
				};
			}
		},
		enabled: Boolean(deployment),
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
		placeholderData: (prev) => prev,
	});
	const resourceEstimate =
		(resourceEstimateQ.data as DeploymentResourceEstimateResponse | undefined)
			?.estimate;
	const resourceEstimatePending =
		resourceEstimateQ.isPending && !resourceEstimate && !resourceEstimateQ.error;

	const saveConfig = useMutation({
		mutationFn: async (nodeId: string) => {
			if (!deployment) throw new Error("deployment not found");
			return saveDeploymentNodeConfig(deployment.userId, deployment.id, nodeId);
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
						deployment.userId,
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
			autoSyncOnBringUp?: boolean;
		}) => {
			if (!deployment) throw new Error("deployment not found");
			return updateDeploymentForwardConfig(
				deployment.userId,
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
			return syncDeploymentForward(deployment.userId, deployment.id);
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
						userId={userId}
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
						userId={userId}
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
						userId={userId}
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
				<div className="space-y-5 p-4 lg:p-5">
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
		<div className="space-y-5 p-4 pb-16 lg:p-5 lg:pb-20">
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
							<span className="capitalize">{deployment.family}</span>
						</p>
						{deployment.actionReason ? (
							<p className="text-xs text-muted-foreground mt-1">
								{deployment.actionReason}
							</p>
						) : null}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Link
						to="/dashboard/deployments/$deploymentId/capacity"
						params={{ deploymentId }}
						className={buttonVariants({ variant: "outline", size: "sm" })}
						title="Capacity rollups and forecasting"
					>
						<TrendingUp className="mr-2 h-4 w-4" /> Capacity
					</Link>
					<Button
						variant="outline"
						size="sm"
						disabled={!forwardNetworkID}
						title={
							forwardNetworkID
								? "Open this deployment network in Forward"
								: "Forward network is not available yet"
						}
						onClick={() => {
							if (!forwardNetworkID) return;
							void navigate({
								to: "/dashboard/tools/$tool",
								params: { tool: "forward-cluster" },
								search: {
									path: `/?/search?networkId=${encodeURIComponent(forwardNetworkID)}`,
								},
							});
						}}
					>
						<ExternalLink className="mr-2 h-4 w-4" />
						Open in Forward
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							if (primaryAction === "shut_down") {
								void handleStop();
								return;
							}
							if (primaryAction === "bring_up") {
								void handleStart();
							}
						}}
						disabled={isBusy || primaryAction === "none"}
					>
						{primaryAction === "shut_down" ? (
							<StopCircle className="mr-2 h-4 w-4" />
						) : (
							<Play className="mr-2 h-4 w-4" />
						)}{" "}
						{primaryAction === "shut_down" ? "Shut Down" : "Bring Up"}
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => setDestroyDialogOpen(true)}
						disabled={actionPending}
					>
						<Trash2 className="mr-2 h-4 w-4" /> Delete
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader className="pb-3">
					<CardTitle>Deployment Resources</CardTitle>
					<CardDescription>
						Estimated footprint from the selected template.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-sm">
					<div className="font-medium">
						{resourceEstimatePending
							? "Estimating resources…"
							: formatResourceEstimateSummary(resourceEstimate)}
					</div>
					{resourceEstimate?.reason ? (
						<div className="text-xs text-muted-foreground mt-1">
							{resourceEstimate.reason}
						</div>
					) : null}
				</CardContent>
			</Card>

			<Tabs
				value={activeTab}
				onValueChange={(v) => setActiveTab(v as "topology" | "logs" | "config")}
				className="space-y-6"
			>
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
										{deployment.family === "c9s" &&
										deploymentEngine === "netlab"
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
														: deployment.family === "byos" &&
																deploymentEngine === "eve_ng"
															? "Derived from EVE-NG artifacts after deploy."
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
											autoSyncOnBringUp: forwardAutoSyncOnBringUp,
										});
									}}
								/>
							</div>
							<div className="flex items-center justify-between">
								<div className="space-y-1">
									<div className="text-sm font-medium">
										Auto-sync after bring-up
									</div>
									<div className="text-xs text-muted-foreground">
										Queue Forward sync automatically after successful bring-up.
									</div>
								</div>
								<Switch
									checked={forwardAutoSyncOnBringUp}
									disabled={!forwardEnabled || updateForward.isPending}
									onCheckedChange={(checked) => {
										setForwardAutoSyncOnBringUp(checked);
										updateForward.mutate({
											enabled: forwardEnabled,
											collectorConfigId: forwardCollector || undefined,
											autoSyncOnBringUp: checked,
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
													autoSyncOnBringUp: forwardAutoSyncOnBringUp,
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
							<div className="rounded-md border p-3 text-xs">
								<div className="font-medium text-foreground">
									Sync status:{" "}
									<span className="capitalize">
										{String(deployment.syncState ?? "idle").replaceAll(
											"_",
											" ",
										)}
									</span>
								</div>
								{deployment.lastSyncAt ? (
									<div className="text-muted-foreground mt-1">
										Last sync:{" "}
										{new Date(deployment.lastSyncAt).toLocaleString()}
										{deployment.lastSyncStatus
											? ` (${deployment.lastSyncStatus})`
											: ""}
									</div>
								) : (
									<div className="text-muted-foreground mt-1">
										No sync run recorded yet.
									</div>
								)}
								{deployment.lastSyncError ? (
									<div className="text-destructive mt-1">
										{deployment.lastSyncError}
									</div>
								) : null}
							</div>
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
							This will force-delete <strong>{deployment.name}</strong> from
							Skyforge regardless of current runtime state. This action cannot
							be undone.
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

function normalizeDeploymentLifecycleState(raw: unknown): string {
	return String(raw ?? "")
		.trim()
		.toLowerCase();
}

function resolveDeploymentDisplayStatus(d: UserScopeDeployment): string {
	const lifecycle = normalizeDeploymentLifecycleState(d.lifecycleState);
	if (lifecycle) {
		switch (lifecycle) {
			case "draft":
				return "draft";
			case "queued_bring_up":
			case "queued_shut_down":
			case "queued_destroy":
				return "queued";
			case "bringing_up":
				return "bringing up";
			case "shutting_down":
				return "shutting down";
			case "active":
				return "active";
			case "stopped":
				return "stopped";
			case "destroying":
				return "destroying";
			case "failed":
				return "failed";
			default:
				return "unknown";
		}
	}
	const active = String(d.activeTaskStatus ?? "")
		.trim()
		.toLowerCase();
	if (active) return active;
	const last = String(d.lastStatus ?? "")
		.trim()
		.toLowerCase();
	return last || "unknown";
}

function resolveDeploymentPrimaryAction(
	d: UserScopeDeployment,
): "bring_up" | "shut_down" | "none" {
	const explicit = String(d.primaryAction ?? "")
		.trim()
		.toLowerCase();
	if (
		explicit === "bring_up" ||
		explicit === "shut_down" ||
		explicit === "none"
	)
		return explicit;

	const lifecycle = normalizeDeploymentLifecycleState(d.lifecycleState);
	switch (lifecycle) {
		case "queued_bring_up":
		case "bringing_up":
		case "queued_shut_down":
		case "shutting_down":
		case "queued_destroy":
		case "destroying":
			return "none";
		case "active":
			return "shut_down";
		default:
			break;
	}
	const status = resolveDeploymentDisplayStatus(d).toLowerCase();
	if (["running", "active", "healthy"].includes(status)) return "shut_down";
	return "bring_up";
}

function StatusBadge({ status }: { status: string }) {
	let variant: "default" | "secondary" | "destructive" | "outline" =
		"secondary";
	const s = status.toLowerCase();
	if (
		[
			"running",
			"active",
			"healthy",
			"succeeded",
			"success",
			"queued",
			"bringing up",
			"shutting down",
			"destroying",
		].includes(s)
	)
		variant = "default";
	if (["failed", "error", "crashloopbackoff"].includes(s))
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
