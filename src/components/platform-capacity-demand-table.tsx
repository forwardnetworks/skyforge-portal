import type { PlatformCapacityPageState } from "@/hooks/use-platform-capacity-page";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { renderUnavailable } from "./platform-capacity-render-unavailable";

export function PlatformCapacityDemandTable({ demand }: { demand: PlatformCapacityPageState["demandByClass"] }) {
	const hasDemandByClass = demand.length > 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Demand by class</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				{renderUnavailable(demand.length, "demand entries")}
				<div className="overflow-x-auto">
					{hasDemandByClass ? (
						<table className="min-w-full text-sm">
							<thead className="border-b text-left text-muted-foreground">
								<tr>
									<th className="py-2 pr-4">Class</th>
									<th className="py-2 pr-4">Queued</th>
									<th className="py-2 pr-4">Running</th>
									<th className="py-2 pr-4">Active</th>
									<th className="py-2 pr-4">Requested</th>
									<th className="py-2 pr-4">Approved</th>
									<th className="py-2 pr-4">Persistent</th>
								</tr>
							</thead>
							<tbody>
								{demand.map((item) => (
									<tr key={item.resourceClass}>
										<td className="py-2 pr-4 font-medium">{item.resourceClass}</td>
										<td className="py-2 pr-4">{item.queuedTasks ?? 0}</td>
										<td className="py-2 pr-4">{item.runningTasks ?? 0}</td>
										<td className="py-2 pr-4">{item.activeDeployments ?? 0}</td>
										<td className="py-2 pr-4">{item.requestedReservations ?? 0}</td>
										<td className="py-2 pr-4">{item.approvedReservations ?? 0}</td>
										<td className="py-2 pr-4">{item.persistentLabs ?? 0}</td>
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
