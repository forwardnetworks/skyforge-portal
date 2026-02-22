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
	type SkyforgeUserScope,
	createUserScopeForwardNetwork,
	deleteUserScopeForwardNetwork,
	getUserScopeForwardNetworkCapacityPortfolio,
	listUserScopes,
	listUserForwardCollectorConfigs,
	listUserScopeForwardNetworks,
} from "../../../lib/skyforge-api";

const searchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/forward-networks/")({
	validateSearch: (search) => searchSchema.parse(search),
	loaderDeps: ({ search: { userId } }) => ({ userId }),
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData({
			queryKey: queryKeys.userScopes(),
			queryFn: listUserScopes,
			staleTime: 30_000,
		});
	},
	component: ForwardNetworksPage,
});

function ForwardNetworksPage() {
	const navigate = useNavigate();
	const qc = useQueryClient();
	const { userId } = Route.useSearch();

	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
		retry: false,
	});
	const userScopes = useMemo(
		() => (userScopesQ.data ?? []) as SkyforgeUserScope[],
		[userScopesQ.data],
	);

	const [selectedUserScopeId, setSelectedUserScopeId] = useState(
		String(userId ?? ""),
	);

	useEffect(() => {
		if (selectedUserScopeId) return;
		if (userScopes.length === 0) return;
		setSelectedUserScopeId(String(userScopes[0]?.id ?? ""));
	}, [selectedUserScopeId, userScopes]);

	useEffect(() => {
		const w = String(userId ?? "");
		if (w === selectedUserScopeId) return;
		setSelectedUserScopeId(w);
	}, [userId, selectedUserScopeId]);

	const handleUserScopeChange = (id: string) => {
		void navigate({
			search: { userId: id === "__none__" ? "" : id } as any,
			replace: true,
		});
	};

	const networksQ = useQuery({
		queryKey: queryKeys.userForwardNetworks(selectedUserScopeId),
		queryFn: () => listUserScopeForwardNetworks(selectedUserScopeId),
		enabled: Boolean(selectedUserScopeId),
		staleTime: 10_000,
		retry: false,
	});

	const networks = useMemo(
		() => (networksQ.data?.networks ?? []) as PolicyReportForwardNetwork[],
		[networksQ.data?.networks],
	);

	const portfolioQ = useQuery({
		queryKey:
			queryKeys.userForwardNetworkCapacityPortfolio(selectedUserScopeId),
		queryFn: () =>
			getUserScopeForwardNetworkCapacityPortfolio(selectedUserScopeId),
		enabled: Boolean(selectedUserScopeId),
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

	const createM = useMutation({
		mutationFn: async () => {
			const ws = selectedUserScopeId.trim();
			if (!ws) throw new Error("Select a user scope");
			const n = name.trim();
			const fid = forwardNetworkId.trim();
			if (!n) throw new Error("Name is required");
			if (!fid) throw new Error("Forward Network ID is required");
			return createUserScopeForwardNetwork(ws, {
				name: n,
				forwardNetworkId: fid,
				description: description.trim() || undefined,
				collectorConfigId:
					collectorConfigId && collectorConfigId !== "__default__"
						? collectorConfigId
						: undefined,
			});
		},
		onSuccess: async () => {
			toast.success("Forward network saved");
			setName("");
			setForwardNetworkId("");
			setDescription("");
			setCollectorConfigId("__default__");
			await qc.invalidateQueries({
				queryKey: queryKeys.userForwardNetworks(selectedUserScopeId),
			});
		},
		onError: (e) =>
			toast.error("Failed to save network", {
				description: (e as Error).message,
			}),
	});

	const deleteM = useMutation({
		mutationFn: async (networkRef: string) => {
			const ws = selectedUserScopeId.trim();
			if (!ws) throw new Error("Select a user scope");
			return deleteUserScopeForwardNetwork(ws, networkRef);
		},
		onSuccess: async () => {
			toast.success("Forward network deleted");
			await qc.invalidateQueries({
				queryKey: queryKeys.userForwardNetworks(selectedUserScopeId),
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
						Save one or more Forward Network IDs per user scope, then open
						Capacity views against them.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
						<Select
							value={selectedUserScopeId || "__none__"}
							onValueChange={handleUserScopeChange}
						>
							<SelectTrigger className="w-[240px] h-8 bg-transparent border-0 focus:ring-0 shadow-none">
								<SelectValue placeholder="Select user scope" />
							</SelectTrigger>
							<SelectContent>
								{userScopes.map((w: SkyforgeUserScope) => (
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
						disabled={!selectedUserScopeId}
						onClick={() => {
							void navigate({ to: "/dashboard/settings" });
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
							disabled={!selectedUserScopeId || createM.isPending}
						>
							<Plus className="h-4 w-4 mr-2" />
							Save network
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Saved networks</CardTitle>
					<CardDescription>
						Open Capacity to compute rollups and explore inventory/perf data.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{networks.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No saved networks yet.
						</div>
					) : null}
					{networks.map((n) => (
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
										search={{ userId: selectedUserScopeId } as any}
									>
										Capacity
									</Link>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => deleteM.mutate(n.id)}
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
					<CardTitle>Capacity portfolio</CardTitle>
					<CardDescription>
						Quick cross-network view (util_* max &gt;= 85%).
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{!selectedUserScopeId ? (
						<div className="text-sm text-muted-foreground">
							Select a user scope to see portfolio rollups.
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
																	{ userId: selectedUserScopeId } as any
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
