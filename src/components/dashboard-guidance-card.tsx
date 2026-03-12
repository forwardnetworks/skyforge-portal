import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { formatMode, titleize } from "./dashboard-shared";

export function DashboardGuidanceCard(props: { page: DashboardPageState }) {
	const { page } = props;
	const availability = page.platformAvailability;
	const reservationGuidance = availability?.reservationGuidance ?? [];
	const primaryGuidance =
		reservationGuidance.find((item) => item.recommendedAction === "launch-now") ??
		reservationGuidance.find((item) => item.quotaAllowed) ??
		reservationGuidance[0];
	const infraComparison = availability?.infraComparison;

	if (!primaryGuidance) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Reservation guidance</CardTitle>
				<CardDescription>
					Live recommendation based on quota and current platform headroom.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				<p>
					Recommended class:{" "}
					<span className="font-semibold">{primaryGuidance.resourceClass}</span>
				</p>
				<p>
					Action:{" "}
					<Badge variant="secondary">
						{titleize(primaryGuidance.recommendedAction)}
					</Badge>
				</p>
				<p>{primaryGuidance.reason}</p>
				<p className="text-muted-foreground text-xs">
					Suggested reservation priority:{" "}
					<span className="font-medium">
						{primaryGuidance.suggestedPriority || "standard"}
					</span>
				</p>
				{infraComparison ? (
					<div className="grid gap-2 pt-2 text-xs text-muted-foreground sm:grid-cols-2">
						<div>
							Cloud mode:{" "}
							<span className="font-medium text-foreground">
								{formatMode(infraComparison.cloud?.mode)}
							</span>
						</div>
						<div>
							On-prem mode:{" "}
							<span className="font-medium text-foreground">
								{formatMode(infraComparison.onPrem?.mode)}
							</span>
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
