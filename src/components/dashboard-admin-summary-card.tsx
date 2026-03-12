import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { formatCurrencyFromCents } from "./platform-capacity-formatting";
import { formatCount, QuotaTile } from "./dashboard-shared";

export function DashboardAdminSummaryCard(props: { page: DashboardPageState }) {
	const { page } = props;
	const overview = page.adminOverview;

	if (!page.isAdmin || !overview) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Admin platform summary</CardTitle>
				<CardDescription>
					GTM and platform-ops observability from the current cluster state.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<QuotaTile
						label="Reservations"
						value={formatCount(overview.reservationCount)}
					/>
					<QuotaTile
						label="Quota overrides"
						value={formatCount(overview.quotaOverrideCount)}
					/>
					<QuotaTile
						label="Forward resets"
						value={formatCount(overview.forwardResetRunCount)}
					/>
					<QuotaTile
						label="Baseline monthly cost"
						value={formatCurrencyFromCents(overview.baselineMonthlyCostCents ?? 0)}
					/>
				</div>
				<div className="grid gap-3 sm:grid-cols-2">
					<Card className="border-border/60 bg-background/60">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm">Availability headroom</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							{(overview.availabilityByClass ?? []).slice(0, 4).map((row) => (
								<div
									key={row.resourceClass}
									className="flex items-center justify-between"
								>
									<span>{row.resourceClass}</span>
									<span className="font-medium">
										{formatCount(row.immediateAvailability)}
									</span>
								</div>
							))}
						</CardContent>
					</Card>
					<Card className="border-border/60 bg-background/60">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm">Pool costs</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							{(overview.poolCostInputs ?? []).slice(0, 4).map((pool) => (
								<div key={pool.name} className="flex items-center justify-between">
									<span>{pool.name}</span>
									<span className="font-medium">
										{formatCurrencyFromCents(pool.estimatedMonthlyCostCents ?? 0)}
									</span>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			</CardContent>
		</Card>
	);
}
