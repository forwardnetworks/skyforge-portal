import type { PlatformReservationsPageState } from "@/hooks/use-platform-reservations-page";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function PlatformReservationsLifecycleCard(props: {
	page: PlatformReservationsPageState;
}) {
	const { page } = props;
	const lifecycle = page.reservationLifecycleQ.data;

	if (!page.selectedReservationID) {
		return null;
	}

	return (
		<Card className="mb-4 border-dashed">
			<CardHeader className="pb-3">
				<CardTitle className="text-base">Reservation lifecycle</CardTitle>
				<CardDescription>
					Typed lifecycle state and event history for the selected reservation.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 text-sm">
				{page.reservationLifecycleQ.isLoading ? (
					<div className="text-muted-foreground">
						Loading reservation lifecycle...
					</div>
				) : page.reservationLifecycleQ.isError ? (
					<div className="text-destructive">
						{page.reservationLifecycleQ.error instanceof Error
							? page.reservationLifecycleQ.error.message
							: "Failed to load reservation lifecycle"}
					</div>
				) : lifecycle?.reservation ? (
					<>
						<div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
							<div>
								Status:{" "}
								<span className="font-medium text-foreground">
									{lifecycle.reservation.status}
								</span>
							</div>
							<div>
								Priority:{" "}
								<span className="font-medium text-foreground">
									{lifecycle.reservation.priorityTier}
								</span>
							</div>
							<div>
								Allowed actions:{" "}
								<span className="font-medium text-foreground">
									{lifecycle.allowedActions?.join(", ") || "none"}
								</span>
							</div>
							<div>
								Template:{" "}
								<span className="font-medium text-foreground">
									{lifecycle.reservation.templateRef || "-"}
								</span>
							</div>
						</div>
						<div className="space-y-2">
							{(lifecycle.events ?? []).length > 0 ? (
								lifecycle.events.map((event) => (
									<div
										key={event.id}
										className="rounded-md border border-border/60 bg-background/60 p-3"
									>
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="font-medium">{event.eventType}</div>
											<div className="text-xs text-muted-foreground">
												{event.createdAt}
											</div>
										</div>
										<div className="text-xs text-muted-foreground">
											actor: {event.actor}
										</div>
										{event.summary ? (
											<div className="pt-1 text-sm">{event.summary}</div>
										) : null}
									</div>
								))
							) : (
								<div className="text-muted-foreground">
									No lifecycle events recorded.
								</div>
							)}
						</div>
					</>
				) : (
					<div className="text-muted-foreground">
						No lifecycle details found.
					</div>
				)}
			</CardContent>
		</Card>
	);
}
