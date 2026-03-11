import type {
	DeviceRow,
	GroupSummaryRow,
	InterfaceRow,
} from "@/components/capacity/deployment-capacity-types";
import { useDeploymentCapacityDeviceRows } from "./use-deployment-capacity-device-rows";
import {
	useDeploymentCapacityDeviceGroupSummary,
	useDeploymentCapacityInterfaceGroupSummary,
} from "./use-deployment-capacity-group-summaries";
import { useDeploymentCapacityGroupingOptions } from "./use-deployment-capacity-grouping-options";
import { useDeploymentCapacityInterfaceRows } from "./use-deployment-capacity-interface-rows";
import { useDeploymentCapacityOverview } from "./use-deployment-capacity-overview";
import type { DeploymentCapacityRollupArgs } from "./use-deployment-capacity-rollup-shared";

export function useDeploymentCapacityRollups(
	args: DeploymentCapacityRollupArgs,
) {
	const groupingOptions = useDeploymentCapacityGroupingOptions({
		inventoryData: args.inventoryData,
	});
	const ifaceRows: InterfaceRow[] = useDeploymentCapacityInterfaceRows(args);
	const deviceRows: DeviceRow[] = useDeploymentCapacityDeviceRows(args);
	const ifaceGroupSummary: GroupSummaryRow[] =
		useDeploymentCapacityInterfaceGroupSummary({
			ifaceRows,
			groupBy: args.groupBy,
			ifaceMetric: args.ifaceMetric,
			inventoryData: args.inventoryData,
		});
	const deviceGroupSummary: GroupSummaryRow[] =
		useDeploymentCapacityDeviceGroupSummary({
			deviceRows,
			groupBy: args.groupBy,
		});
	const overview = useDeploymentCapacityOverview({ rollups: args.rollups });

	return {
		groupingOptions,
		ifaceRows,
		deviceRows,
		ifaceGroupSummary,
		deviceGroupSummary,
		overview,
	};
}
