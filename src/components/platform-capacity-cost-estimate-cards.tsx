import type { PlatformCapacityPageState } from "@/hooks/use-platform-capacity-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
	formatCurrencyFromCents,
	formatMemoryGiB,
	formatMilliCPU,
} from "./platform-capacity-formatting";
import { renderUnavailable } from "./platform-capacity-render-unavailable";

type CostEstimateCardsProps = {
	estimateActualByClass: PlatformCapacityPageState["estimateActualByClass"];
	poolCostInputs: PlatformCapacityPageState["poolCostInputs"];
	overview?: PlatformCapacityPageState["overviewQ"]["data"];
};

export function PlatformCapacityCostEstimateCards({
	estimateActualByClass,
	poolCostInputs,
	overview,
}: CostEstimateCardsProps) {
	const hasEstimateActual = estimateActualByClass.length > 0;
	const hasPoolCostInputs = poolCostInputs.length > 0;
	const marginalCostData = overview?.marginalCostByClass ?? [];
	const hasMarginalCost = marginalCostData.length > 0;

	return (
		<div className="grid gap-4 xl:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Estimate vs actual by class</CardTitle>
					<CardDescription>
						Class-level estimate drift against live requested Kubernetes resources.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{renderUnavailable(estimateActualByClass.length, "estimate/actual entries")}
					<div className="overflow-x-auto">
						{hasEstimateActual ? (
							<table className="min-w-full text-sm">
								<thead className="border-b text-left text-muted-foreground">
									<tr>
										<th className="py-2 pr-4">Class</th>
										<th className="py-2 pr-4">Deployments</th>
										<th className="py-2 pr-4">Measured</th>
										<th className="py-2 pr-4">Estimated CPU</th>
										<th className="py-2 pr-4">Actual CPU</th>
										<th className="py-2 pr-4">Drift CPU</th>
										<th className="py-2 pr-4">Estimated Memory</th>
										<th className="py-2 pr-4">Actual Memory</th>
										<th className="py-2 pr-4">Drift Memory</th>
									</tr>
								</thead>
								<tbody>
									{estimateActualByClass.map((item) => (
										<tr key={item.resourceClass}>
											<td className="py-2 pr-4 font-medium">{item.resourceClass}</td>
											<td className="py-2 pr-4">{item.activeDeployments ?? 0}</td>
											<td className="py-2 pr-4">{item.measuredDeployments ?? 0}</td>
											<td className="py-2 pr-4">{formatMilliCPU(item.estimatedMilliCpu ?? 0)}</td>
											<td className="py-2 pr-4">{formatMilliCPU(item.actualRequestedMilliCpu ?? 0)}</td>
											<td className="py-2 pr-4">{formatMilliCPU(item.driftMilliCpu ?? 0)}</td>
											<td className="py-2 pr-4">{formatMemoryGiB(item.estimatedMemoryBytes ?? 0)}</td>
											<td className="py-2 pr-4">{formatMemoryGiB(item.actualRequestedMemoryBytes ?? 0)}</td>
											<td className="py-2 pr-4">{formatMemoryGiB(item.driftMemoryBytes ?? 0)}</td>
										</tr>
									))}
								</tbody>
							</table>
						) : null}
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Pool cost inputs</CardTitle>
					<CardDescription>
						Node counts, providers, instance mix, and per-pool cost labels used for budgeting.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{renderUnavailable(poolCostInputs.length, "cost inputs")}
					<div className="overflow-x-auto">
						{hasPoolCostInputs ? (
							<table className="min-w-full text-sm">
								<thead className="border-b text-left text-muted-foreground">
									<tr>
										<th className="py-2 pr-4">Pool</th>
										<th className="py-2 pr-4">Provider</th>
										<th className="py-2 pr-4">Nodes</th>
										<th className="py-2 pr-4">Instance mix</th>
										<th className="py-2 pr-4">Node cost</th>
										<th className="py-2 pr-4">Pool cost</th>
									</tr>
								</thead>
								<tbody>
									{poolCostInputs.map((pool) => {
										const instanceTypes: Record<string, number> = pool.instanceTypes ?? {};
										const typeEntries = Object.entries(instanceTypes)
											.sort((a, b) => a[0].localeCompare(b[0]))
											.map(([name, count]) => `${name} x${count}`);
										return (
											<tr key={pool.name ?? pool.provider ?? "unknown"}>
												<td className="py-2 pr-4 font-medium">{pool.name ?? "default"}</td>
												<td className="py-2 pr-4">{pool.provider || "-"}</td>
												<td className="py-2 pr-4">{pool.readyNodeCount ?? 0} / {pool.nodeCount ?? 0}</td>
												<td className="py-2 pr-4 text-xs text-muted-foreground">{typeEntries.join(", ") || "-"}</td>
												<td className="py-2 pr-4">
													{(pool.monthlyNodeCostCents ?? 0) > 0
														? formatCurrencyFromCents(pool.monthlyNodeCostCents ?? 0)
														: "-"}
												</td>
												<td className="py-2 pr-4">
													{(pool.estimatedMonthlyCostCents ?? 0) > 0
														? formatCurrencyFromCents(pool.estimatedMonthlyCostCents ?? 0)
														: "-"}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						) : null}
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Marginal cost by class</CardTitle>
					<CardDescription>
						Estimated monthly cost per concurrent class for cloud burst and blended total capacity.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{renderUnavailable(marginalCostData.length, "marginal cost data")}
					<div className="overflow-x-auto">
						{hasMarginalCost ? (
							<table className="min-w-full text-sm">
								<thead className="border-b text-left text-muted-foreground">
									<tr>
										<th className="py-2 pr-4">Class</th>
										<th className="py-2 pr-4">Cloud units</th>
										<th className="py-2 pr-4">Cloud unit cost</th>
										<th className="py-2 pr-4">Blended units</th>
										<th className="py-2 pr-4">Blended unit cost</th>
									</tr>
								</thead>
								<tbody>
									{marginalCostData.map((row) => (
										<tr key={row.resourceClass}>
											<td className="py-2 pr-4 font-medium">{row.resourceClass}</td>
											<td className="py-2 pr-4">{row.cloudCapacityUnits ?? 0}</td>
											<td className="py-2 pr-4">
												{(row.cloudUnitCostCents ?? 0) > 0
													? formatCurrencyFromCents(row.cloudUnitCostCents ?? 0)
													: "-"}
											</td>
											<td className="py-2 pr-4">{row.blendedCapacityUnits ?? 0}</td>
											<td className="py-2 pr-4">
												{(row.blendedUnitCostCents ?? 0) > 0
													? formatCurrencyFromCents(row.blendedUnitCostCents ?? 0)
													: "-"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						) : null}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
