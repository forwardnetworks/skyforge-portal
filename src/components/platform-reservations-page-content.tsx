import type { PlatformReservationsPageState } from "@/hooks/use-platform-reservations-page";
import { PlatformWarningsCard } from "./platform-warnings-card";
import { PlatformReservationsGuidanceCard } from "./platform-reservations-guidance-card";
import { PlatformReservationsLifecycleCard } from "./platform-reservations-lifecycle-card";
import { PlatformReservationsRequestCard } from "./platform-reservations-request-card";
import { PlatformReservationsTable } from "./platform-reservations-table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function PlatformReservationsPageContent(props: {
	page: PlatformReservationsPageState;
}) {
	const { page } = props;
	const availability = page.availabilityQ.data;

	return (
		<div className="space-y-6 p-6">
			<PlatformWarningsCard
				title="Reservation warnings"
				description="Hybrid-placement or capacity conditions that can affect reservation approval."
				warnings={availability?.warnings}
			/>

			<PlatformReservationsGuidanceCard page={page} />

			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
				<p className="text-sm text-muted-foreground">
					Request scheduled or persistent lab capacity and track your current
					reservations.
				</p>
			</div>

			<PlatformReservationsRequestCard page={page} />

			<Card>
				<CardHeader>
					<CardTitle>My Reservations</CardTitle>
				</CardHeader>
				<CardContent>
					<PlatformReservationsLifecycleCard page={page} />
					<PlatformReservationsTable page={page} />
				</CardContent>
			</Card>
		</div>
	);
}
