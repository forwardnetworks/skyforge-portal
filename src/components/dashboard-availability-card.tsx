import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { formatCount } from "./dashboard-shared";

export function DashboardAvailabilityCard(props: { page: DashboardPageState }) {
	const { page } = props;
	const availabilityByClass = page.platformAvailability?.availabilityByClass ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Availability by resource class</CardTitle>
				<CardDescription>
					Immediate launch headroom after current demand and reserved blocks.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{availabilityByClass.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						Availability has not been reported yet.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead className="border-b text-left text-muted-foreground">
								<tr>
									<th className="py-2 pr-4">Class</th>
									<th className="py-2 pr-4">Immediate</th>
									<th className="py-2 pr-4">Capacity</th>
									<th className="py-2 pr-4">Approved</th>
									<th className="py-2 pr-4">Requested</th>
									<th className="py-2 pr-4">Reserved blocks</th>
								</tr>
							</thead>
							<tbody>
								{availabilityByClass.map((row) => (
									<tr key={row.resourceClass} className="border-b">
										<td className="py-2 pr-4 font-medium">{row.resourceClass}</td>
										<td className="py-2 pr-4">
											<Badge variant="secondary">
												{formatCount(row.immediateAvailability)}
											</Badge>
										</td>
										<td className="py-2 pr-4">
											{formatCount(row.estimatedCapacityUnits)}
										</td>
										<td className="py-2 pr-4">
											{formatCount(row.approvedReservations)}
										</td>
										<td className="py-2 pr-4">
											{formatCount(row.requestedReservations)}
										</td>
										<td className="py-2 pr-4">
											{formatCount(row.reservedBlocks)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
