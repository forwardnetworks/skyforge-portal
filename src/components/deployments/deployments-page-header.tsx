import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import { Badge } from "../ui/badge";

export function DeploymentsPageHeader({
	state,
}: {
	state: Pick<DeploymentsPageState, "selectedUserScope">;
}) {
	return (
		<div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Deployments</h1>
				<p className="text-sm text-muted-foreground">
					Manage deployments and monitor activity.
				</p>
			</div>
			<div className="flex items-center gap-3">
				{state.selectedUserScope ? (
					<Badge variant="outline">
						{state.selectedUserScope.name} ({state.selectedUserScope.slug})
					</Badge>
				) : (
					<Badge variant="secondary">No user selected</Badge>
				)}
			</div>
		</div>
	);
}

