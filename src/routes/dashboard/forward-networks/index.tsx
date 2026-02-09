import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Settings, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { queryKeys } from "../../../lib/query-keys";
import {
	type PolicyReportForwardNetwork,
	type SkyforgeWorkspace,
	createUserForwardNetwork,
	createWorkspaceForwardNetwork,
	deleteUserForwardNetwork,
	deleteWorkspaceForwardNetwork,
	getWorkspaceForwardNetworkCapacityPortfolio,
	getWorkspaces,
	listUserForwardCollectorConfigs,
	listUserForwardNetworks,
	listWorkspaceForwardNetworks,
} from "../../../lib/skyforge-api";

const searchSchema = z.object({
	workspace: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/forward-networks/")({
	validateSearch: (search) => searchSchema.parse(search),
	loaderDeps: ({ search: { workspace } }) => ({ workspace }),
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData({
			queryKey: queryKeys.workspaces(),
			queryFn: getWorkspaces,
			staleTime: 30_000,
		});
	},
	component: ForwardNetworksPage,
});

function ForwardNetworksPage() {
	const navigate = useNavigate();
	const qc = useQueryClient();
	const { workspace } = Route.useSearch();

	const workspacesQ = useQuery({
		queryKey: queryKeys.workspaces(),
		queryFn: getWorkspaces,
		staleTime: 30_000,
		retry: false,
	});
	const workspaces = useMemo(
		() => (workspacesQ.data?.workspaces ?? []) as SkyforgeWorkspace[],
		[workspacesQ.data?.workspaces],
	);

	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
		String(workspace ?? ""),
	);

	useEffect(() => {
		if (selectedWorkspaceId) return;
		if (workspaces.length === 0) return;
		setSelectedWorkspaceId(String(workspaces[0]?.id ?? ""));
	}, [selectedWorkspaceId, workspaces]);

	useEffect(() => {
		const w = String(workspace ?? "");
		if (w === selectedWorkspaceId) return;
		setSelectedWorkspaceId(w);
	}, [workspace, selectedWorkspaceId]);

	const handleWorkspaceChange = (id: string) => {
		void navigate({
			search: { workspace: id === "__none__" ? "" : id } as any,
			replace: true,
		});
	};

	const userNetworksQ = useQuery({
		queryKey: queryKeys.userForwardNetworks(),
		queryFn: listUserForwardNetworks,
		staleTime: 10_000,
		retry: false,
	});

	const userNetworks = useMemo(
		() => (userNetworksQ.data?.networks ?? []) as PolicyReportForwardNetwork[],
		[userNetworksQ.data?.networks],
	);

	const workspaceNetworksQ = useQuery({
		queryKey: queryKeys.workspaceForwardNetworks(selectedWorkspaceId),
		queryFn: () => listWorkspaceForwardNetworks(selectedWorkspaceId),
		enabled: Boolean(selectedWorkspaceId),
		staleTime: 10_000,
		retry: false,
	});

	const workspaceNetworks = useMemo(
		() =>
			(workspaceNetworksQ.data?.networks ?? []) as PolicyReportForwardNetwork[],
		[workspaceNetworksQ.data?.networks],
	);

	const portfolioQ = useQuery({
		queryKey:
			queryKeys.workspaceForwardNetworkCapacityPortfolio(selectedWorkspaceId),
		queryFn: () =>
			getWorkspaceForwardNetworkCapacityPortfolio(selectedWorkspaceId),
		enabled: Boolean(selectedWorkspaceId),
		staleTime: 10_000,
		retry: false,
	});

	const portfolioItems = useMemo(
		() => (portfolioQ.data?.items ?? []) as any[],
		[portfolioQ.data?.items],
	);

	const collectorsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		staleTime: 30_000,
		retry: false,
	});
	const collectors = useMemo(
		() => (collectorsQ.data?.collectors ?? []) as any[],
		[collectorsQ.data?.collectors],
	);

	const [name, setName] = useState("");
	const [forwardNetworkId, setForwardNetworkId] = useState("");
	const [description, setDescription] = useState("");
	const [collectorConfigId, setCollectorConfigId] =
		useState<string>("__default__");
	const [saveScope, setSaveScope] = useState<"user" | "workspace">("user");

	const canOpenNetworkViews = Boolean(String(selectedWorkspaceId ?? "").trim());

	const createM = useMutation({
		mutationFn: async () => {
			const n = name.trim();
			const fid = forwardNetworkId.trim();
			if (!n) throw new Error("Name is required");
			if (!fid) throw new Error("Forward Network ID is required");
			const body = {
				name: n,
				forwardNetworkId: fid,
				description: description.trim() || undefined,
				collectorConfigId:
					collectorConfigId && collectorConfigId !== "__default__"
						? collectorConfigId
						: undefined,
			};
			if (saveScope === "workspace") {
				const ws = selectedWorkspaceId.trim();
				if (!ws) throw new Error("Select a workspace");
				return createWorkspaceForwardNetwork(ws, body);
			}
			return createUserForwardNetwork(body);
		},
		onSuccess: async () => {
			toast.success("Forward network saved");
			setName("");
			setForwardNetworkId("");
			setDescription("");
			setCollectorConfigId("__default__");
			await qc.invalidateQueries({ queryKey: queryKeys.userForwardNetworks() });
			await qc.invalidateQueries({
				queryKey: queryKeys.workspaceForwardNetworks(selectedWorkspaceId),
			});
			await qc.invalidateQueries({
				queryKey:
					queryKeys.workspaceForwardNetworkCapacityPortfolio(selectedWorkspaceId),
			});
		},
		onError: (e) =>
			toast.error("Failed to save network", {
				description: (e as Error).message,
			}),
	});

	const deleteM = useMutation({
		mutationFn: async (args: {
			scope: "user" | "workspace";
			networkRef: string;
		}) => {
			if (args.scope === "workspace") {
				const ws = selectedWorkspaceId.trim();
				if (!ws) throw new Error("Select a workspace");
				return deleteWorkspaceForwardNetwork(ws, args.networkRef);
			}
			return deleteUserForwardNetwork(args.networkRef);
		},
		onSuccess: async () => {
			toast.success("Forward network deleted");
			await qc.invalidateQueries({ queryKey: queryKeys.userForwardNetworks() });
			await qc.invalidateQueries({
				queryKey: queryKeys.workspaceForwardNetworks(selectedWorkspaceId),
			});
			await qc.invalidateQueries({
				queryKey:
					queryKeys.workspaceForwardNetworkCapacityPortfolio(selectedWorkspaceId),
			});
		},
		onError: (e) =>
			toast.error("Failed to delete network", {
				description: (e as Error).message,
			}),
	});

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Forward Networks
					</h1>
					<p className="text-muted-foreground text-sm">
						Save Forward Network IDs to your account (or to a workspace), then
						open Capacity and Assurance views using a workspace context.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
						<Select
							value={selectedWorkspaceId || "__none__"}
							onValueChange={handleWorkspaceChange}
						>
							<SelectTrigger className="w-[240px] h-8 bg-transparent border-0 focus:ring-0 shadow-none">
								<SelectValue placeholder="Select workspace" />
							</SelectTrigger>
							<SelectContent>
								{workspaces.map((w: SkyforgeWorkspace) => (
									<SelectItem key={w.id} value={w.id}>
										{w.name} ({w.slug})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						disabled={!selectedWorkspaceId}
						onClick={() => {
							if (!selectedWorkspaceId) return;
							navigate({
								to: "/dashboard/workspaces/$workspaceId",
								params: { workspaceId: selectedWorkspaceId },
							});
						}}
					>
						<Settings className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Add Forward network</CardTitle>
					<CardDescription>
						These networks are used as the scope for capacity rollups and live
						perf drilldowns.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Save to</Label>
						<Select
							value={saveScope}
							onValueChange={(v) =>
								setSaveScope(v === "workspace" ? "workspace" : "user")
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select scope" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="user">My account</SelectItem>
								<SelectItem value="workspace">Workspace (shared)</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Name</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="prod-edge"
							/>
						</div>
						<div className="space-y-2">
							<Label>Forward Network ID</Label>
							<Input
								value={forwardNetworkId}
								onChange={(e) => setForwardNetworkId(e.target.value)}
								placeholder="abc123..."
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Description (optional)</Label>
						<Input
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Notes for humans"
						/>
					</div>
					<div className="space-y-2">
						<Label>Forward collector config (optional)</Label>
						<Select
							value={collectorConfigId}
							onValueChange={(v) => setCollectorConfigId(v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Use my default Forward config" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__default__">Use my default</SelectItem>
								{collectors.map((c: any) => (
									<SelectItem key={String(c.id)} value={String(c.id)}>
										{String(c.name ?? c.id)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={() => createM.mutate()}
							disabled={
								createM.isPending ||
								(saveScope === "workspace" && !selectedWorkspaceId)
							}
						>
							<Plus className="h-4 w-4 mr-2" />
							Save network
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>My saved networks</CardTitle>
					<CardDescription>
						Open Capacity to compute rollups and explore inventory/perf data.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{userNetworks.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No saved networks yet.
						</div>
					) : null}
					{userNetworks.map((n) => (
						<div
							key={n.id}
							className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border p-3"
						>
							<div className="min-w-0">
								<div className="font-medium truncate">{n.name}</div>
								<div className="text-sm text-muted-foreground truncate">
									<span className="font-mono">{n.forwardNetworkId}</span>
									{n.description ? ` · ${n.description}` : ""}
								</div>
							</div>
							<div className="flex items-center gap-2">
								{canOpenNetworkViews ? (
									<Button asChild variant="outline" size="sm">
										<Link
											to="/dashboard/forward-networks/$networkRef/capacity"
											params={{ networkRef: n.id }}
											search={{ workspace: selectedWorkspaceId } as any}
										>
											Capacity
										</Link>
									</Button>
								) : (
									<Button variant="outline" size="sm" disabled>
										Capacity
									</Button>
								)}
								{canOpenNetworkViews ? (
									<Button asChild variant="outline" size="sm">
										<Link
											to="/dashboard/forward-networks/$networkRef/assurance-studio"
											params={{ networkRef: n.id }}
											search={{ workspace: selectedWorkspaceId } as any}
										>
											Assurance Studio
										</Link>
									</Button>
								) : (
									<Button variant="outline" size="sm" disabled>
										Assurance Studio
									</Button>
								)}
								{canOpenNetworkViews ? (
									<Button asChild variant="outline" size="sm">
										<Link
											to="/dashboard/forward-networks/$networkRef/assurance"
											params={{ networkRef: n.id }}
											search={{ workspace: selectedWorkspaceId } as any}
										>
											Assurance
										</Link>
									</Button>
								) : (
									<Button variant="outline" size="sm" disabled>
										Assurance
									</Button>
								)}
								{canOpenNetworkViews ? (
									<Button asChild variant="outline" size="sm">
										<Link
											to="/dashboard/forward-networks/$networkRef/traffic-scenarios"
											params={{ networkRef: n.id }}
											search={{ workspace: selectedWorkspaceId } as any}
										>
											Traffic Scenarios
										</Link>
									</Button>
								) : (
									<Button variant="outline" size="sm" disabled>
										Traffic Scenarios
									</Button>
								)}
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										deleteM.mutate({ scope: "user", networkRef: n.id })
									}
									disabled={deleteM.isPending}
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Delete
								</Button>
							</div>
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Workspace saved networks</CardTitle>
					<CardDescription>
						Shared with workspace collaborators. These only work in the workspace
						they were saved to.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{!selectedWorkspaceId ? (
						<div className="text-sm text-muted-foreground">
							Select a workspace to view shared networks.
						</div>
					) : workspaceNetworks.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No workspace-saved networks yet.
						</div>
					) : null}
					{selectedWorkspaceId
						? workspaceNetworks.map((n) => (
								<div
									key={n.id}
									className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border p-3"
								>
									<div className="min-w-0">
										<div className="font-medium truncate">{n.name}</div>
										<div className="text-sm text-muted-foreground truncate">
											<span className="font-mono">{n.forwardNetworkId}</span>
											{n.description ? ` · ${n.description}` : ""}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button asChild variant="outline" size="sm">
											<Link
												to="/dashboard/forward-networks/$networkRef/capacity"
												params={{ networkRef: n.id }}
												search={{ workspace: selectedWorkspaceId } as any}
											>
												Capacity
											</Link>
										</Button>
										<Button asChild variant="outline" size="sm">
											<Link
												to="/dashboard/forward-networks/$networkRef/assurance-studio"
												params={{ networkRef: n.id }}
												search={{ workspace: selectedWorkspaceId } as any}
											>
												Assurance Studio
											</Link>
										</Button>
										<Button asChild variant="outline" size="sm">
											<Link
												to="/dashboard/forward-networks/$networkRef/assurance"
												params={{ networkRef: n.id }}
												search={{ workspace: selectedWorkspaceId } as any}
											>
												Assurance
											</Link>
										</Button>
										<Button asChild variant="outline" size="sm">
											<Link
												to="/dashboard/forward-networks/$networkRef/traffic-scenarios"
												params={{ networkRef: n.id }}
												search={{ workspace: selectedWorkspaceId } as any}
											>
												Traffic Scenarios
											</Link>
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												deleteM.mutate({ scope: "workspace", networkRef: n.id })
											}
											disabled={deleteM.isPending}
										>
											<Trash2 className="h-4 w-4 mr-2" />
											Delete
										</Button>
									</div>
								</div>
						  ))
						: null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Capacity portfolio</CardTitle>
					<CardDescription>
						Quick cross-network view (util_* max &gt;= 85%).
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{!selectedWorkspaceId ? (
						<div className="text-sm text-muted-foreground">
							Select a workspace to see portfolio rollups.
						</div>
					) : portfolioQ.isLoading ? (
						<div className="text-sm text-muted-foreground">Loading…</div>
					) : portfolioQ.isError ? (
						<div className="text-sm text-muted-foreground">
							Unable to load portfolio.
						</div>
					) : portfolioItems.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No portfolio data yet. Save a network and run a Capacity refresh.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="text-xs text-muted-foreground">
									<tr className="text-left border-b">
										<th className="py-2 pr-3">Network</th>
										<th className="py-2 pr-3">As of</th>
										<th className="py-2 pr-3">Hot ifaces</th>
										<th className="py-2 pr-3">Soonest</th>
										<th className="py-2 pr-3">Max max</th>
										<th className="py-2 pr-3">Max p95</th>
									</tr>
								</thead>
								<tbody>
									{portfolioItems.map((it) => {
										const asOf = String(it.asOf ?? "").trim() || "—";
										const soonest =
											String(it.soonestForecast ?? "").trim() || "—";
										const fmtPct = (v: unknown) => {
											const n = Number(v);
											if (!Number.isFinite(n)) return "—";
											return `${(n * 100).toFixed(1)}%`;
										};
										return (
											<tr key={String(it.networkRef)} className="border-b">
												<td className="py-2 pr-3">
													<div className="flex items-center gap-2">
														<Button
															asChild
															variant="link"
															className="p-0 h-auto"
														>
															<Link
																to="/dashboard/forward-networks/$networkRef/capacity"
																params={{ networkRef: String(it.networkRef) }}
																search={
																	{ workspace: selectedWorkspaceId } as any
																}
															>
																{String(it.name ?? it.networkRef)}
															</Link>
														</Button>
														{it.stale ? (
															<Badge variant="destructive">Stale</Badge>
														) : (
															<Badge variant="secondary">Fresh</Badge>
														)}
													</div>
													<div className="text-xs text-muted-foreground font-mono truncate">
														{String(it.forwardNetworkId ?? "")}
													</div>
												</td>
												<td className="py-2 pr-3 font-mono text-xs">{asOf}</td>
												<td className="py-2 pr-3">
													{Number(it.hotInterfaces ?? 0)}
												</td>
												<td className="py-2 pr-3 font-mono text-xs">
													{soonest}
												</td>
												<td className="py-2 pr-3">{fmtPct(it.maxUtilMax)}</td>
												<td className="py-2 pr-3">{fmtPct(it.maxUtilP95)}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
