import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { DashboardLaunchpadCard } from "./dashboard-launchpad-card";
import { DashboardSystemStatusCard } from "./dashboard-system-status-card";
import { PlatformWarningsCard } from "./platform-warnings-card";
import { DashboardAdminSummaryCard } from "./dashboard-admin-summary-card";
import { DashboardAvailabilityCard } from "./dashboard-availability-card";
import { DashboardGuidanceCard } from "./dashboard-guidance-card";
import { DashboardNextStepsCard } from "./dashboard-next-steps-card";
import { DashboardPolicySummaryCard } from "./dashboard-policy-summary-card";
import { DashboardReservationsCard } from "./dashboard-reservations-card";
import { MetricCard, formatCount } from "./dashboard-shared";

type DashboardPageContentProps = {
	page: DashboardPageState;
};

export function DashboardPageContent({ page }: DashboardPageContentProps) {
	const availability = page.platformAvailability;
	const policy = availability?.policy;
	const usage = availability?.usage;
	const availabilityWarnings = availability?.warnings ?? [];
	const overviewWarnings = page.adminOverview?.warnings ?? [];

	return (
		<div className="space-y-6 p-6">
			<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
				<DashboardLaunchpadCard page={page} />
				<DashboardSystemStatusCard page={page} />
			</div>

			<PlatformWarningsCard
				title="Platform conditions"
				description="Live hybrid-placement and capacity warnings that affect new launches."
				warnings={
					page.isAdmin
						? [...availabilityWarnings, ...overviewWarnings]
						: availabilityWarnings
				}
			/>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					title="Concurrent labs remaining"
					value={usage ? formatCount(usage.remainingConcurrentLabs) : "—"}
					description={
						policy
							? `${formatCount(usage?.activeDeployments)} active of ${formatCount(policy.quota.maxConcurrentLabs)} allowed`
							: "Loading quota usage"
					}
				/>
				<MetricCard
					title="Persistent labs remaining"
					value={usage ? formatCount(usage.remainingPersistentLabs) : "—"}
					description={
						policy
							? `${formatCount(usage?.persistentLabs)} active of ${formatCount(policy.quota.maxPersistentLabs)} allowed`
							: "Loading persistence policy"
					}
				/>
				<MetricCard
					title="Reservation requests"
					value={usage ? formatCount(usage.requestedReservations) : "—"}
					description="Pending approval or scheduling decisions"
				/>
				<MetricCard
					title="Approved reservations"
					value={usage ? formatCount(usage.approvedReservations) : "—"}
					description="Reserved future or persistent platform capacity"
				/>
			</div>

			<DashboardGuidanceCard page={page} />

			<div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
				<DashboardAvailabilityCard page={page} />
				<DashboardPolicySummaryCard page={page} />
			</div>

			<div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
				<DashboardReservationsCard page={page} />
				{page.isAdmin ? (
					<DashboardAdminSummaryCard page={page} />
				) : (
					<DashboardNextStepsCard />
				)}
			</div>
		</div>
	);
}
