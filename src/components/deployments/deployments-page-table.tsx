import { Inbox } from "lucide-react";
import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import { Card, CardContent } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import { Skeleton } from "../ui/skeleton";
import { DataTable } from "../ui/data-table";
import { getDeploymentsTableColumns } from "./deployments-page-columns";

export function DeploymentsPageTable({
	state,
}: {
	state: DeploymentsPageState;
}) {
	const columns = getDeploymentsTableColumns(state);

	return (
		<Card>
			<CardContent className="p-0">
				{!state.snap.data ? (
					<div className="space-y-4 p-6">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				) : state.deployments.length === 0 ? (
					<EmptyState
						icon={Inbox}
						title="No deployments found"
						description={
							state.searchQuery || state.statusFilter !== "all"
								? "Try adjusting your filters."
								: "You haven't created any deployments for this user yet."
						}
						action={
							!state.searchQuery && state.statusFilter === "all"
								? {
									label: "Create deployment",
									onClick: () =>
										state.navigate({
											to: "/dashboard/deployments/new",
											search: { userId: state.selectedUserScopeId },
										}),
							}
							: undefined
					}
					/>
				) : (
					<DataTable
						columns={columns}
						rows={state.deployments}
						getRowId={(deployment) => deployment.id}
						minWidthClassName="min-w-0"
						scrollable={false}
					/>
				)}
			</CardContent>
		</Card>
	);
}
