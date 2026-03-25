import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { forwardNetworkInsightsEmptyText } from "./forward-network-insights-messaging";
import type { ForwardNetworkCapacityInterfacesTabProps } from "./forward-network-capacity-interface-tab-types";

export function ForwardNetworkCapacityInterfaceRollups({
	page,
}: ForwardNetworkCapacityInterfacesTabProps) {
	if (page.summary.isLoading) {
		return (
			<div className="space-y-2">
				<Skeleton className="h-5 w-56" />
				<Skeleton className="h-32 w-full" />
			</div>
		);
	}

	if (page.summary.isError) {
		return (
			<div className="text-destructive text-sm">
				Failed to load summary:{" "}
				{page.summary.error instanceof Error
					? page.summary.error.message
					: String(page.summary.error)}
			</div>
		);
	}

	return (
		<DataTable
			columns={page.ifaceColumns}
			rows={page.ifaceRows}
			getRowId={(r) => r.id}
			onRowClick={(r) => page.setSelectedIface(r)}
			emptyText={forwardNetworkInsightsEmptyText(page)}
		/>
	);
}
