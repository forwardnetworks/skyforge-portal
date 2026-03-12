import type { PlatformReservationsPageState } from "@/hooks/use-platform-reservations-page";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { formatCount, formatMode } from "./platform-reservations-shared";

export function PlatformReservationsGuidanceCard(props: {
	page: PlatformReservationsPageState;
}) {
	const { page } = props;
	const availability = page.availabilityQ.data;
	const recommendedGuidance =
		availability?.reservationGuidance?.find(
			(item) => item.resourceClass === page.resourceClass,
		) ??
		availability?.reservationGuidance?.find(
			(item) => item.recommendedAction === "launch-now",
		) ??
		availability?.reservationGuidance?.[0];

	if (!recommendedGuidance) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Reservation guidance</CardTitle>
				<CardDescription>
					Live guidance for the selected class from quota and capacity state.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				<div>
					<span className="font-semibold">
						{recommendedGuidance.resourceClass}
					</span>{" "}
					should{" "}
					<span className="font-semibold">
						{recommendedGuidance.recommendedAction.replace(/-/g, " ")}
					</span>
					.
				</div>
				<div>{recommendedGuidance.reason}</div>
				<div className="grid gap-2 pt-2 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
					<div>
						Quota allowed:{" "}
						<span className="font-medium text-foreground">
							{recommendedGuidance.quotaAllowed ? "yes" : "no"}
						</span>
					</div>
					<div>
						Immediate capacity:{" "}
						<span className="font-medium text-foreground">
							{recommendedGuidance.immediateAvailable ? "yes" : "no"}
						</span>
					</div>
					<div>
						Reservation required:{" "}
						<span className="font-medium text-foreground">
							{recommendedGuidance.requiresReservation ? "yes" : "no"}
						</span>
					</div>
					<div>
						Suggested priority:{" "}
						<span className="font-medium text-foreground">
							{recommendedGuidance.suggestedPriority || "standard"}
						</span>
					</div>
				</div>
				{availability?.usage ? (
					<div className="grid gap-3 pt-2 md:grid-cols-3">
						<div className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
							<div className="text-xs uppercase tracking-wide text-muted-foreground">
								Concurrent labs remaining
							</div>
							<div className="mt-1 text-lg font-semibold">
								{formatCount(availability.usage.remainingConcurrentLabs)}
							</div>
						</div>
						<div className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
							<div className="text-xs uppercase tracking-wide text-muted-foreground">
								Persistent labs remaining
							</div>
							<div className="mt-1 text-lg font-semibold">
								{formatCount(availability.usage.remainingPersistentLabs)}
							</div>
						</div>
						<div className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
							<div className="text-xs uppercase tracking-wide text-muted-foreground">
								Requested reservations
							</div>
							<div className="mt-1 text-lg font-semibold">
								{formatCount(availability.usage.requestedReservations)}
							</div>
						</div>
					</div>
				) : null}
				{availability?.infraComparison ? (
					<div className="grid gap-2 pt-2 text-xs text-muted-foreground md:grid-cols-2">
						<div>
							Cloud mode:{" "}
							<span className="font-medium text-foreground">
								{formatMode(availability.infraComparison.cloud?.mode)}
							</span>
						</div>
						<div>
							On-prem mode:{" "}
							<span className="font-medium text-foreground">
								{formatMode(availability.infraComparison.onPrem?.mode)}
							</span>
						</div>
						{availability.infraComparison.summary ? (
							<div className="md:col-span-2">
								{availability.infraComparison.summary}
							</div>
						) : null}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
