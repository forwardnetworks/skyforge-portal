import type { PlatformCapacityPageState } from "@/hooks/use-platform-capacity-page";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { renderUnavailable } from "./platform-capacity-render-unavailable";

export function PlatformCapacityAvailabilityTable({ availability }: { availability: PlatformCapacityPageState["availabilityByClass"] }) {
	const hasAvailabilityByClass = availability.length > 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Availability by class</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				{renderUnavailable(availability.length, "availability entries")}
				<div className="overflow-x-auto">
					{hasAvailabilityByClass ? (
						<table className="min-w-full text-sm">
							<thead className="border-b text-left text-muted-foreground">
								<tr>
									<th className="py-2 pr-4">Class</th>
									<th className="py-2 pr-4">Capacity Units</th>
									<th className="py-2 pr-4">Requested</th>
									<th className="py-2 pr-4">Approved</th>
									<th className="py-2 pr-4">Reserved</th>
									<th className="py-2 pr-4">Immediate</th>
								</tr>
							</thead>
							<tbody>
								{availability.map((item) => (
									<tr key={item.resourceClass}>
										<td className="py-2 pr-4 font-medium">{item.resourceClass}</td>
										<td className="py-2 pr-4">{item.estimatedCapacityUnits ?? 0}</td>
										<td className="py-2 pr-4">{item.requestedReservations ?? 0}</td>
										<td className="py-2 pr-4">{item.approvedReservations ?? 0}</td>
										<td className="py-2 pr-4">{item.reservedBlocks ?? 0}</td>
										<td className="py-2 pr-4">{item.immediateAvailability ?? 0}</td>
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
