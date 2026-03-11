import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { DeploymentCapacityInterfaceGroupSummary } from "./deployment-capacity-interface-group-summary";
import type { DeploymentCapacityInterfacesTabProps } from "./deployment-capacity-interface-tab-types";
import { DeploymentCapacityInterfacesToolbar } from "./deployment-capacity-interfaces-toolbar";

export function DeploymentCapacityInterfacesTab(
	props: DeploymentCapacityInterfacesTabProps,
) {
	const { page } = props;
	const { summary, ifaceRows, setSelectedIface } = page;

	return (
		<Card>
			<DeploymentCapacityInterfacesToolbar {...props} />
			<CardContent className="space-y-3">
				<DeploymentCapacityInterfaceGroupSummary {...props} />

				{summary.isLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-5 w-56" />
						<Skeleton className="h-32 w-full" />
					</div>
				) : summary.isError ? (
					<div className="text-destructive text-sm">
						Failed to load summary:{" "}
						{summary.error instanceof Error
							? summary.error.message
							: String(summary.error)}
					</div>
				) : (
					<DataTable
						columns={page.ifaceColumns}
						rows={ifaceRows}
						getRowId={(r) => r.id}
						onRowClick={(r) => setSelectedIface(r)}
						emptyText="No rollups for this window/metric yet. Click Refresh to enqueue."
					/>
				)}
			</CardContent>
		</Card>
	);
}
