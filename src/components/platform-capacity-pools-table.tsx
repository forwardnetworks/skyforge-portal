import type { PlatformCapacityPageState } from "@/hooks/use-platform-capacity-page";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { renderUnavailable } from "./platform-capacity-render-unavailable";

export function PlatformCapacityPoolsTable({ pools }: { pools: PlatformCapacityPageState["capacityPools"] }) {
	const hasCapacityPools = pools.length > 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Capacity pools by class</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				{renderUnavailable(pools.length, "pools")}
				<div className="overflow-x-auto">
					{hasCapacityPools ? (
						<table className="min-w-full text-sm">
							<thead className="border-b text-left text-muted-foreground">
								<tr>
									<th className="py-2 pr-4">Pool</th>
									<th className="py-2 pr-4">Class</th>
									<th className="py-2 pr-4">Nodes (ready / total)</th>
									<th className="py-2 pr-4">Allocatable CPU</th>
									<th className="py-2 pr-4">Allocatable Memory</th>
								</tr>
							</thead>
							<tbody>
								{pools.map((pool) => (
									<tr key={pool.name || pool.resourceClass}>
										<td className="py-2 pr-4">{pool.name || pool.resourceClass || "default"}</td>
										<td className="py-2 pr-4">{pool.poolClass || "-"}</td>
										<td className="py-2 pr-4">
											{pool.readyNodeCount ?? 0} / {pool.nodeCount ?? 0}
										</td>
										<td className="py-2 pr-4">{pool.availableMilliCpu ?? 0} m</td>
										<td className="py-2 pr-4">{pool.availableMemoryBytes ?? 0} B</td>
									</tr>
								))}
							</tbody>
						</table>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}
