import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { formatCount, titleize } from "./dashboard-shared";

export function DashboardReservationsCard(props: { page: DashboardPageState }) {
	const { page } = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Reservation status</CardTitle>
				<CardDescription>
					Your current reservation pipeline and next actions.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-2">
					{page.reservationTotals.length > 0 ? (
						page.reservationTotals.map((entry) => (
							<Badge key={entry.status} variant="secondary">
								{titleize(entry.status)}: {formatCount(entry.count)}
							</Badge>
						))
					) : (
						<span className="text-sm text-muted-foreground">
							No reservations recorded.
						</span>
					)}
				</div>
				<div className="space-y-2">
					{page.reservations.slice(0, 5).map((reservation) => (
						<div
							key={reservation.id}
							className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm"
						>
							<div className="flex items-center justify-between gap-3">
								<div className="font-medium">
									{reservation.templateRef || reservation.type}
								</div>
								<Badge variant="outline">
									{titleize(reservation.status || "requested")}
								</Badge>
							</div>
							<div className="mt-1 text-xs text-muted-foreground">
								{reservation.resourceClass} | {reservation.startAt} to{" "}
								{reservation.endAt}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
