import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
	createUserForwardNetwork,
	deleteUserForwardNetwork,
	getUserForwardNetworkCapacityPortfolio,
	listUserForwardCollectorConfigs,
	listUserForwardNetworks,
} from "../../../lib/skyforge-api";

const searchSchema = z.object({});

export const Route = createFileRoute("/dashboard/fwd/")({
	validateSearch: (search) => searchSchema.parse(search),
	component: ForwardNetworksPage,
});

function ForwardNetworksPage() {
	const qc = useQueryClient();
	const selectedUserContextId = "personal";

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

	const portfolioQ = useQuery({
		queryKey: queryKeys.userContextForwardNetworkCapacityPortfolio(
			selectedUserContextId,
		),
		queryFn: () =>
			getUserForwardNetworkCapacityPortfolio(selectedUserContextId),
		enabled: Boolean(selectedUserContextId),
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

	const canOpenNetworkViews = Boolean(
		String(selectedUserContextId ?? "").trim(),
	);

	const createM = useMutation({
		mutationFn: async () => {
			const n = name.trim();
			const fid = forwardNetworkId.trim();
			if (!n) throw new Error("Name is required");
			if (!fid) throw new Error("Forward Network ID is required");
			return createUserForwardNetwork({
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
			await qc.invalidateQueries({ queryKey: queryKeys.userForwardNetworks() });
			await qc.invalidateQueries({
				queryKey: queryKeys.userContextForwardNetworkCapacityPortfolio(
					selectedUserContextId,
				),
			});
		},
		onError: (e) =>
			toast.error("Failed to save network", {
				description: (e as Error).message,
			}),
	});

	const deleteM = useMutation({
		mutationFn: async (networkRef: string) =>
			deleteUserForwardNetwork(networkRef),
		onSuccess: async () => {
			toast.success("Forward network deleted");
			await qc.invalidateQueries({ queryKey: queryKeys.userForwardNetworks() });
			await qc.invalidateQueries({
				queryKey: queryKeys.userContextForwardNetworkCapacityPortfolio(
					selectedUserContextId,
				),
			});
		},
		onError: (e) =>
			toast.error("Failed to delete network", {
				description: (e as Error).message,
			}),
	});

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 border-b pb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Forward Networks
					</h1>
					<p className="text-muted-foreground text-sm">
						Manage saved Forward network references for your account and launch
						capacity and assurance workflows.
					</p>
				</div>
				<div className="flex items-center gap-2 text-xs text-muted-foreground">
					<span>Data context</span>
					{selectedUserContextId ? (
						<Badge variant="secondary" className="font-mono text-[10px]">
							{selectedUserContextId}
						</Badge>
					) : (
						<Badge variant="destructive" className="text-[10px]">
							Unavailable
						</Badge>
					)}
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Add Forward network</CardTitle>
					<CardDescription>
						Save a Forward network to your user profile.
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
								placeholder="236545"
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
					<Button onClick={() => createM.mutate()} disabled={createM.isPending}>
						<Plus className="mr-2 h-4 w-4" />
						Save network
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>My saved networks</CardTitle>
					<CardDescription>
						Open capacity and assurance views from your saved network list.
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
							className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
						>
							<div className="min-w-0">
								<div className="truncate font-medium">{n.name}</div>
								<div className="truncate text-sm text-muted-foreground">
									<span className="font-mono">{n.forwardNetworkId}</span>
									{n.description ? ` · ${n.description}` : ""}
								</div>
							</div>
							<div className="flex items-center gap-2">
								{canOpenNetworkViews ? (
									<Button asChild variant="outline" size="sm">
										<Link
											to="/dashboard/fwd/$networkRef/capacity"
											params={{ networkRef: n.id }}
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
											to="/dashboard/fwd/$networkRef/assurance-studio"
											params={{ networkRef: n.id }}
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
											to="/dashboard/fwd/$networkRef/assurance"
											params={{ networkRef: n.id }}
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
											to="/dashboard/fwd/$networkRef/traffic-scenarios"
											params={{ networkRef: n.id }}
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
									onClick={() => deleteM.mutate(n.id)}
									disabled={deleteM.isPending}
								>
									<Trash2 className="mr-2 h-4 w-4" />
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
						Cross-network summary view (hot interfaces where util max is above
						85%).
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{!selectedUserContextId ? (
						<div className="text-sm text-muted-foreground">
							Context is unavailable. Once user context is initialized,
							portfolio data will appear.
						</div>
					) : portfolioQ.isLoading ? (
						<div className="text-sm text-muted-foreground">Loading…</div>
					) : portfolioQ.isError ? (
						<div className="text-sm text-muted-foreground">
							Unable to load portfolio.
						</div>
					) : portfolioItems.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No portfolio data yet. Save a network and run a capacity refresh.
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead className="text-xs text-muted-foreground">
									<tr className="border-b text-left">
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
															className="h-auto p-0"
														>
															<Link
																to="/dashboard/fwd/$networkRef/capacity"
																params={{ networkRef: String(it.networkRef) }}
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
													<div className="truncate font-mono text-xs text-muted-foreground">
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
