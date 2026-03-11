import { DataTable } from "@/components/ui/data-table";
import { buildDeploymentCapacityInterfaceGroupColumns } from "./deployment-capacity-interface-group-columns";
import type { DeploymentCapacityInterfacesTabProps } from "./deployment-capacity-interface-tab-types";

export function DeploymentCapacityInterfaceGroupSummary(
	props: DeploymentCapacityInterfacesTabProps,
) {
	const { page } = props;
	const {
		groupBy,
		ifaceMetric,
		ifaceGroupSummary,
		setLocationFilter,
		setTagFilter,
		setGroupFilter,
		setVrfFilter,
	} = page;

	if (groupBy === "none") return null;

	return (
		<div className="space-y-2">
			<div className="text-xs text-muted-foreground">
				Group summary ({groupBy})
			</div>
			<DataTable
				columns={buildDeploymentCapacityInterfaceGroupColumns(
					groupBy,
					ifaceMetric,
				)}
				rows={ifaceGroupSummary}
				getRowId={(r) => r.group}
				onRowClick={(r) => {
					if (groupBy === "location") setLocationFilter(r.group);
					else if (groupBy === "tag")
						setTagFilter(r.group === "untagged" ? "all" : r.group);
					else if (groupBy === "group")
						setGroupFilter(r.group === "ungrouped" ? "all" : r.group);
					else if (groupBy === "vrf")
						setVrfFilter(r.group === "unknown" ? "all" : r.group);
				}}
				emptyText="No groups."
				maxHeightClassName="max-h-[260px]"
				minWidthClassName="min-w-0"
			/>
		</div>
	);
}
