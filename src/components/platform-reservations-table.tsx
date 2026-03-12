import type { PlatformReservationsPageState } from "@/hooks/use-platform-reservations-page";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { canCancelReservation } from "./platform-reservations-shared";

export function PlatformReservationsTable(props: {
	page: PlatformReservationsPageState;
}) {
	const { page } = props;

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full text-sm">
				<thead className="border-b text-left text-muted-foreground">
					<tr>
						<th className="py-2 pr-4">Class</th>
						<th className="py-2 pr-4">Type</th>
						<th className="py-2 pr-4">Status</th>
						<th className="py-2 pr-4">Priority</th>
						<th className="py-2 pr-4">Scope</th>
						<th className="py-2 pr-4">Window</th>
						<th className="py-2 pr-4">Template</th>
						<th className="py-2 pr-4">Actions</th>
					</tr>
				</thead>
				<tbody>
					{page.reservations.map((item) => (
						<tr key={item.id} className="border-b align-top">
							<td className="py-2 pr-4">{item.resourceClass}</td>
							<td className="py-2 pr-4">{item.type}</td>
							<td className="py-2 pr-4">{item.status}</td>
							<td className="py-2 pr-4 text-xs">
								<Badge variant="outline">
									{item.priorityTier ?? "standard"}
								</Badge>
							</td>
							<td className="py-2 pr-4 text-xs">
								<div className="flex flex-wrap gap-1">
									{item.adminOverride ? (
										<Badge variant="secondary">admin override</Badge>
									) : null}
									{item.isCuratedDemo ? (
										<Badge variant="outline">curated</Badge>
									) : null}
									{!item.adminOverride && !item.isCuratedDemo ? (
										<span className="text-muted-foreground">-</span>
									) : null}
								</div>
							</td>
							<td className="py-2 pr-4 text-xs text-muted-foreground">
								<div>{item.startAt}</div>
								<div>{item.endAt}</div>
							</td>
							<td className="py-2 pr-4 text-xs text-muted-foreground">
								{item.templateRef || "-"}
							</td>
							<td className="py-2 pr-4">
								<div className="flex flex-wrap gap-2">
									<Button
										size="sm"
										variant={
											page.selectedReservationID === item.id
												? "secondary"
												: "outline"
										}
										onClick={() =>
											page.setSelectedReservationID(
												page.selectedReservationID === item.id ? "" : item.id,
											)
										}
									>
										{page.selectedReservationID === item.id
											? "Hide details"
											: "Details"}
									</Button>
									{canCancelReservation(item.status) ? (
										<Button
											size="sm"
											variant="outline"
											onClick={() => page.cancelReservationMutation.mutate(item.id)}
											disabled={page.cancelReservationMutation.isPending}
										>
											Cancel
										</Button>
									) : null}
									{!canCancelReservation(item.status) ? (
										<span className="self-center text-xs text-muted-foreground">
											No direct actions
										</span>
									) : null}
								</div>
							</td>
						</tr>
					))}
					{page.reservations.length === 0 ? (
						<tr>
							<td
								className="py-6 text-center text-muted-foreground"
								colSpan={8}
							>
								No reservations recorded.
							</td>
						</tr>
					) : null}
				</tbody>
			</table>
		</div>
	);
}
