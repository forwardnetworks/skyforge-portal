import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import { DeploymentsActivityFeed } from "./deployments-activity-feed";
import { DeploymentsDeleteDialog } from "./deployments-delete-dialog";
import { DeploymentsLifetimeDialog } from "./deployments-lifetime-dialog";
import { DeploymentsPageHeader } from "./deployments-page-header";
import { DeploymentsPageLoadingState } from "./deployments-page-loading-state";
import { DeploymentsPageTable } from "./deployments-page-table";
import { DeploymentsPageToolbar } from "./deployments-page-toolbar";

export function DeploymentsPageContent({
	state,
}: {
	state: DeploymentsPageState;
}) {
	return (
		<div className="space-y-5 p-4 lg:p-5">
			<DeploymentsPageHeader state={state} />

			{!state.snap.data ? <DeploymentsPageLoadingState state={state} /> : null}

			<div className="relative flex flex-col items-start gap-6 lg:flex-row">
				<div className="w-full min-w-0 flex-1 space-y-4">
					<DeploymentsPageToolbar state={state} />
					<DeploymentsPageTable state={state} />
				</div>

				<DeploymentsActivityFeed {...state} />
			</div>

			<DeploymentsLifetimeDialog {...state} />
			<DeploymentsDeleteDialog {...state} />
		</div>
	);
}
