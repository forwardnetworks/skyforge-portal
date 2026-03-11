import type { ForwardNetworkCapacityDerivedArgs } from "@/hooks/forward-network-capacity-derived-types";
import { useForwardNetworkCapacityRollupColumns } from "@/hooks/use-forward-network-capacity-rollup-columns";
import { useForwardNetworkCapacityRollupRows } from "@/hooks/use-forward-network-capacity-rollup-rows";
import { useForwardNetworkCapacityRollupSummaries } from "@/hooks/use-forward-network-capacity-rollup-summaries";

export function useForwardNetworkCapacityRollups(
	args: ForwardNetworkCapacityDerivedArgs,
) {
	const rows = useForwardNetworkCapacityRollupRows(args);
	const summaries = useForwardNetworkCapacityRollupSummaries({
		groupBy: args.groupBy,
		ifaceMetric: args.ifaceMetric,
		rollups: args.rollups,
		inventoryData: args.inventoryData,
		ifaceRows: rows.ifaceRows,
		deviceRows: rows.deviceRows,
	});
	const columns = useForwardNetworkCapacityRollupColumns({
		ifaceMetric: args.ifaceMetric,
	});

	return {
		...rows,
		...summaries,
		...columns,
	};
}
