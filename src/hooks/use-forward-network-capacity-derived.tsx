import type { ForwardNetworkCapacityDerivedArgs } from "@/hooks/forward-network-capacity-derived-types";
import { useForwardNetworkCapacityHistoryGrowth } from "@/hooks/use-forward-network-capacity-history-growth";
import { useForwardNetworkCapacityRollups } from "@/hooks/use-forward-network-capacity-rollups";
import { useForwardNetworkCapacityRouting } from "@/hooks/use-forward-network-capacity-routing";

export function useForwardNetworkCapacityDerived(
	args: ForwardNetworkCapacityDerivedArgs,
) {
	const rollups = useForwardNetworkCapacityRollups(args);
	const historyGrowth = useForwardNetworkCapacityHistoryGrowth(args);
	const routing = useForwardNetworkCapacityRouting(args);

	return {
		...rollups,
		...historyGrowth,
		...routing,
	};
}
