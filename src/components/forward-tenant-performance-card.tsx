import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { useEffect, useState } from "react";
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

function tenantCopy(tenant: ManagedTenantKey) {
	if (tenant === "demo") {
		return {
			title: "Demo Org Performance Data",
			description:
				"List demo-org networks and generate synthetic performance data for curated demos.",
		};
	}
	return {
		title: "Deployment Org Performance Data",
		description:
			"List deployment-org networks and generate synthetic performance data after collection or on demand.",
	};
}

export function ForwardTenantPerformanceCard(props: {
	page: ForwardCredentialsPageState;
	tenant: ManagedTenantKey;
}) {
	const { page, tenant } = props;
	const state = page.tenants[tenant];
	const copy = tenantCopy(tenant);
	const networks = state.performanceNetworksQ.data?.networks ?? [];
	const [drafts, setDrafts] = useState<DraftByNetwork>({});

	useEffect(() => {
		if (networks.length === 0) {
			setDrafts({});
			return;
		}
		setDrafts((prev) => {
			const next: DraftByNetwork = {};
			for (const network of networks) {
				next[network.id] = {
					snapshotId:
						prev[network.id]?.snapshotId ??
						String(network.latestProcessedSnapshotId ?? ""),
					generationIntervalMins:
						prev[network.id]?.generationIntervalMins ??
						String(network.defaultGenerationIntervalMins ?? 10),
					healthyDeviceOdds:
						prev[network.id]?.healthyDeviceOdds ??
						String(network.defaultHealthyDeviceOdds ?? 0.8),
					healthyInterfaceOdds:
						prev[network.id]?.healthyInterfaceOdds ??
						String(network.defaultHealthyInterfaceOdds ?? 0.8),
				};
			}
			return next;
		});
	}, [networks]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{copy.title}</CardTitle>
				<CardDescription>{copy.description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						onClick={() => void state.performanceNetworksQ.refetch()}
						disabled={state.performanceNetworksQ.isFetching}
					>
						Reload networks
					</Button>
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
						const draft = drafts[network.id] ?? {
							snapshotId: String(network.latestProcessedSnapshotId ?? ""),
							generationIntervalMins: String(
								network.defaultGenerationIntervalMins ?? 10,
							),
							healthyDeviceOdds: String(network.defaultHealthyDeviceOdds ?? 0.8),
							healthyInterfaceOdds: String(
								network.defaultHealthyInterfaceOdds ?? 0.8,
							),
						};
						const canGenerate =
							network.status !== "error" &&
							Boolean(network.forwardNetworkId.trim());
						return (
							<div key={network.id} className="rounded border p-4 space-y-4">
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
										<Label>Snapshot ID</Label>
										<Input
											value={draft.snapshotId}
											onChange={(e) =>
												setDrafts((prev) => ({
													...prev,
													[network.id]: {
														...draft,
														snapshotId: e.target.value,
													},
												}))
											}
											placeholder="latest processed snapshot"
										/>
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
													[network.id]: {
														...draft,
														generationIntervalMins: e.target.value,
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
													[network.id]: {
														...draft,
														healthyDeviceOdds: e.target.value,
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
													[network.id]: {
														...draft,
														healthyInterfaceOdds: e.target.value,
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
											!canGenerate ||
											page.generateSyntheticPerformanceMutation.isPending
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
