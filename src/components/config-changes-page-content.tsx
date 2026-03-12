import type { ConfigChangesPageData } from "../hooks/use-config-changes-page";
import { ConfigChangesDeviceResultsCard } from "./config-changes-device-results-card";
import { ConfigChangesExecutionSummaryCard } from "./config-changes-execution-summary-card";
import { ConfigChangesLifecycleCard } from "./config-changes-lifecycle-card";
import { ConfigChangesNewRunCard } from "./config-changes-new-run-card";
import { ConfigChangesQueueCard } from "./config-changes-queue-card";
import { ConfigChangesReviewCard } from "./config-changes-review-card";
import { ConfigChangesRollbackSummaryCard } from "./config-changes-rollback-summary-card";
import { ConfigChangesSelectedRunCard } from "./config-changes-selected-run-card";

export function ConfigChangesPageContent({
	page,
}: {
	page: ConfigChangesPageData;
}) {
	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Config Changes</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Durable, auditable change runs for protected shared environments. This
					slice covers request, render, review, approval, execution, rollback,
					and operator verification.
				</p>
			</div>

			<ConfigChangesNewRunCard page={page} />

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)]">
				<ConfigChangesQueueCard page={page} />

				<div className="space-y-6">
					<ConfigChangesSelectedRunCard page={page} />
					{page.selectedRun ? (
						<>
							<ConfigChangesRollbackSummaryCard run={page.selectedRun} />
							<ConfigChangesExecutionSummaryCard run={page.selectedRun} />
							<ConfigChangesDeviceResultsCard run={page.selectedRun} />
						</>
					) : null}
					<ConfigChangesReviewCard page={page} />
					<ConfigChangesLifecycleCard page={page} />
				</div>
			</div>
		</div>
	);
}
