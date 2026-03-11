import { Link } from "@tanstack/react-router";
import { Plus, Settings, Trash2 } from "lucide-react";
import type { ForwardNetworksPageData } from "../hooks/use-forward-networks-page";
import type { SkyforgeUserScope } from "../lib/api-client";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

export function ForwardNetworksPageContent({
	page,
}: {
	page: ForwardNetworksPageData;
}) {
	const {
		navigate,
		userScopes,
		selectedUserScopeId,
		handleUserScopeChange,
		networks,
		portfolioQ,
		portfolioItems,
		collectors,
		name,
		setName,
		forwardNetworkId,
		setForwardNetworkId,
		description,
		setDescription,
		collectorConfigId,
		setCollectorConfigId,
		createM,
		deleteM,
	} = page;

	const formatPct = (value: unknown) => {
		const n = Number(value);
		if (!Number.isFinite(n)) return "—";
		return `${(n * 100).toFixed(1)}%`;
	};

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
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
					<div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-1">
						<Select
							value={selectedUserScopeId || "__none__"}
							onValueChange={handleUserScopeChange}
						>
							<SelectTrigger className="h-8 w-[240px] border-0 bg-transparent shadow-none focus:ring-0">
								<SelectValue placeholder="Select user scope" />
							</SelectTrigger>
							<SelectContent>
								{userScopes.map((scope: SkyforgeUserScope) => (
									<SelectItem key={scope.id} value={scope.id}>
										{scope.name} ({scope.slug})
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
							void navigate({ to: "/settings" });
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
							onValueChange={setCollectorConfigId}
						>
							<SelectTrigger>
								<SelectValue placeholder="Use my default Forward config" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__default__">Use my default</SelectItem>
								{collectors.map((collector) => (
									<SelectItem
										key={String(collector.id)}
										value={String(collector.id)}
									>
										{String(collector.name ?? collector.id)}
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
							<Plus className="mr-2 h-4 w-4" />
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
					{networks.map((network) => (
						<div
							key={network.id}
							className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
						>
							<div className="min-w-0">
								<div className="truncate font-medium">{network.name}</div>
								<div className="truncate text-sm text-muted-foreground">
									<span className="font-mono">{network.forwardNetworkId}</span>
									{network.description ? ` · ${network.description}` : ""}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button asChild variant="outline" size="sm">
									<Link
										to="/dashboard/forward-networks/$networkRef/capacity"
										params={{ networkRef: network.id }}
										search={{ userId: selectedUserScopeId } as never}
									>
										Capacity
									</Link>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => deleteM.mutate(network.id)}
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
									{portfolioItems.map((item) => {
										const asOf = String(item.asOf ?? "").trim() || "—";
										const soonest =
											String(item.soonestForecast ?? "").trim() || "—";
										return (
											<tr key={String(item.networkRef)} className="border-b">
												<td className="py-2 pr-3">
													<div className="flex items-center gap-2">
														<Button
															asChild
															variant="link"
															className="h-auto p-0"
														>
															<Link
																to="/dashboard/forward-networks/$networkRef/capacity"
																params={{ networkRef: String(item.networkRef) }}
																search={
																	{ userId: selectedUserScopeId } as never
																}
															>
																{String(item.name ?? item.networkRef)}
															</Link>
														</Button>
														{item.stale ? (
															<Badge variant="destructive">Stale</Badge>
														) : (
															<Badge variant="secondary">Fresh</Badge>
														)}
													</div>
													<div className="truncate font-mono text-xs text-muted-foreground">
														{String(item.forwardNetworkId ?? "")}
													</div>
												</td>
												<td className="py-2 pr-3 font-mono text-xs">{asOf}</td>
												<td className="py-2 pr-3">
													{Number(item.hotInterfaces ?? 0)}
												</td>
												<td className="py-2 pr-3 font-mono text-xs">
													{soonest}
												</td>
												<td className="py-2 pr-3">
													{formatPct(item.maxUtilMax)}
												</td>
												<td className="py-2 pr-3">
													{formatPct(item.maxUtilP95)}
												</td>
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
