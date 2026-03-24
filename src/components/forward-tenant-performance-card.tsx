import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { useEffect, useMemo, useState } from "react";
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

type ForwardCredentialsPageState = ReturnType<typeof useForwardCredentialsPage>;
type ManagedTenantKey = "demo" | "primary";

type DraftByNetwork = Record<
	string,
	{
		snapshotId: string;
		generationIntervalMins: string;
		healthyDeviceOdds: string;
		healthyInterfaceOdds: string;
	}
>;

const managedTenantOptions: { label: string; value: ManagedTenantKey }[] = [
	{ label: "Deployment Org", value: "primary" },
	{ label: "Demo Org", value: "demo" },
];

function snapshotLabel(snapshot: {
	id: string;
	name?: string;
	state?: string;
}) {
	const name = String(snapshot.name ?? "").trim();
	if (name) {
		return `${name} (${snapshot.id})`;
	}
	return snapshot.id;
}

export function ForwardTenantPerformanceCard(props: {
	page: ForwardCredentialsPageState;
}) {
	const { page } = props;
	const [tenant, setTenant] = useState<ManagedTenantKey>("primary");
	const state = page.tenants[tenant];
	const networks = state.performanceNetworksQ.data?.networks ?? [];
	const [drafts, setDrafts] = useState<Record<ManagedTenantKey, DraftByNetwork>>({
		demo: {},
		primary: {},
	});

	useEffect(() => {
		if (networks.length === 0) {
			setDrafts((prev) => ({ ...prev, [tenant]: {} }));
			return;
		}
		setDrafts((prev) => {
			const nextTenantDrafts: DraftByNetwork = {};
			for (const network of networks) {
				const prior = prev[tenant]?.[network.id];
				const firstSnapshotId =
					network.processedSnapshots?.[0]?.id ??
					String(network.latestProcessedSnapshotId ?? "");
				nextTenantDrafts[network.id] = {
					snapshotId: prior?.snapshotId ?? firstSnapshotId,
					generationIntervalMins:
						prior?.generationIntervalMins ??
						String(network.defaultGenerationIntervalMins ?? 10),
					healthyDeviceOdds:
						prior?.healthyDeviceOdds ??
						String(network.defaultHealthyDeviceOdds ?? 0.8),
					healthyInterfaceOdds:
						prior?.healthyInterfaceOdds ??
						String(network.defaultHealthyInterfaceOdds ?? 0.8),
				};
			}
			return { ...prev, [tenant]: nextTenantDrafts };
		});
	}, [networks, tenant]);

	const cardDescription = useMemo(() => {
		return tenant === "primary"
			? "Generate synthetic performance data for the deployment org. This is the default path for post-collection generation."
			: "Generate synthetic performance data for the demo org when you want to refresh curated demo telemetry.";
	}, [tenant]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Performance Data</CardTitle>
				<CardDescription>{cardDescription}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-[minmax(0,220px)_1fr]">
					<div className="space-y-2">
						<Label>Forward org</Label>
						<Select
							value={tenant}
							onValueChange={(value) =>
								setTenant(value === "demo" ? "demo" : "primary")
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select Forward org" />
							</SelectTrigger>
							<SelectContent>
								{managedTenantOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-end gap-2">
						<Button
							variant="outline"
							onClick={() => void state.performanceNetworksQ.refetch()}
							disabled={state.performanceNetworksQ.isFetching}
						>
							Reload networks
						</Button>
					</div>
				</div>
				{state.performanceNetworksQ.isLoading ? (
					<div className="text-sm text-muted-foreground">
						Loading Forward networks…
					</div>
				) : null}
				{state.performanceNetworksQ.isError ? (
					<div className="text-sm text-destructive">
						Failed to load Forward performance networks.
					</div>
				) : null}
				{!state.performanceNetworksQ.isLoading && networks.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						No Forward networks are available in this org.
					</div>
				) : null}
				<div className="space-y-4">
					{networks.map((network) => {
						const draft = drafts[tenant]?.[network.id] ?? {
							snapshotId:
								network.processedSnapshots?.[0]?.id ??
								String(network.latestProcessedSnapshotId ?? ""),
							generationIntervalMins: String(
								network.defaultGenerationIntervalMins ?? 10,
							),
							healthyDeviceOdds: String(network.defaultHealthyDeviceOdds ?? 0.8),
							healthyInterfaceOdds: String(
								network.defaultHealthyInterfaceOdds ?? 0.8,
							),
						};
						const processedSnapshots = network.processedSnapshots ?? [];
						const canGenerate =
							network.status !== "error" &&
							Boolean(network.forwardNetworkId.trim()) &&
							Boolean(draft.snapshotId.trim());

						return (
							<div key={network.id} className="space-y-4 rounded border p-4">
								<div className="space-y-1">
									<div className="font-medium">{network.name}</div>
									<div className="text-xs text-muted-foreground">
										Network ID: <code>{network.forwardNetworkId}</code>
									</div>
									<div className="text-xs text-muted-foreground">
										Credential source:{" "}
										<code>{network.credentialSource || "unresolved"}</code>
									</div>
									<div className="text-xs text-muted-foreground">
										Status: <code>{network.status || "unknown"}</code>
									</div>
									{network.latestProcessedSnapshotId ? (
										<div className="text-xs text-muted-foreground">
											Latest processed snapshot:{" "}
											<code>{network.latestProcessedSnapshotId}</code>
											{network.latestProcessedSnapshotName
												? ` (${network.latestProcessedSnapshotName})`
												: ""}
										</div>
									) : null}
									{network.error ? (
										<div className="text-xs text-destructive">
											{network.error}
										</div>
									) : null}
								</div>
								<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
									<div className="space-y-2">
										<Label>Snapshot</Label>
										<Select
											value={draft.snapshotId}
											onValueChange={(value) =>
												setDrafts((prev) => ({
													...prev,
													[tenant]: {
														...(prev[tenant] ?? {}),
														[network.id]: {
															...draft,
															snapshotId: value,
														},
													},
												}))
											}
										>
											<SelectTrigger>
												<SelectValue
													placeholder={
														processedSnapshots.length > 0
															? "Select processed snapshot"
															: "No processed snapshots"
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{processedSnapshots.map((snapshot) => (
													<SelectItem key={snapshot.id} value={snapshot.id}>
														{snapshotLabel(snapshot)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Generation interval mins</Label>
										<Input
											type="number"
											min={1}
											value={draft.generationIntervalMins}
											onChange={(e) =>
												setDrafts((prev) => ({
													...prev,
													[tenant]: {
														...(prev[tenant] ?? {}),
														[network.id]: {
															...draft,
															generationIntervalMins: e.target.value,
														},
													},
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Healthy device odds</Label>
										<Input
											type="number"
											min={0}
											max={1}
											step="0.05"
											value={draft.healthyDeviceOdds}
											onChange={(e) =>
												setDrafts((prev) => ({
													...prev,
													[tenant]: {
														...(prev[tenant] ?? {}),
														[network.id]: {
															...draft,
															healthyDeviceOdds: e.target.value,
														},
													},
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label>Healthy interface odds</Label>
										<Input
											type="number"
											min={0}
											max={1}
											step="0.05"
											value={draft.healthyInterfaceOdds}
											onChange={(e) =>
												setDrafts((prev) => ({
													...prev,
													[tenant]: {
														...(prev[tenant] ?? {}),
														[network.id]: {
															...draft,
															healthyInterfaceOdds: e.target.value,
														},
													},
												}))
											}
										/>
									</div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										onClick={() =>
											page.generateSyntheticPerformanceMutation.mutate({
												tenant,
												networkRef: network.id,
												snapshotId: draft.snapshotId.trim() || undefined,
												generationIntervalMins: Number.parseInt(
													draft.generationIntervalMins,
													10,
												),
												healthyDeviceOdds: Number.parseFloat(
													draft.healthyDeviceOdds,
												),
												healthyInterfaceOdds: Number.parseFloat(
													draft.healthyInterfaceOdds,
												),
											})
										}
										disabled={
											page.generateSyntheticPerformanceMutation.isPending ||
											!canGenerate
										}
									>
										{page.generateSyntheticPerformanceMutation.isPending
											? "Generating…"
											: "Generate performance data"}
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
