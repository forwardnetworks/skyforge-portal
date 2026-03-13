import type { PlatformCapacityPageState } from "@/hooks/use-platform-capacity-page";
import { PlatformCapacityInfraComparisonCard } from "./platform-capacity-infra-comparison-card";
import { PlatformCapacitySummaryCards } from "./platform-capacity-summary-cards";
import { PlatformCapacityTables } from "./platform-capacity-tables";
import { PlatformWarningsCard } from "./platform-warnings-card";

export { formatCurrencyFromCents } from "./platform-capacity-formatting";

export function PlatformCapacityPageContent(props: {
	page: PlatformCapacityPageState;
}) {
	const { page } = props;
	const overview = page.overviewQ.data;

	return (
		<div className="space-y-6 p-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">
					Platform Capacity
				</h1>
				<p className="text-sm text-muted-foreground">
					Admin planning view for reservation pressure, quota overrides, and
					Forward org reset activity.
				</p>
			</div>

			<PlatformWarningsCard
				title="Platform warnings"
				description="Current hybrid-placement or capacity issues from the live cluster inventory."
				warnings={overview?.warnings}
			/>

			<PlatformCapacityInfraComparisonCard
				infraComparison={overview?.infraComparison}
			/>

			<PlatformCapacitySummaryCards page={page} />

			<PlatformCapacityTables page={page} />
		</div>
	);
}
