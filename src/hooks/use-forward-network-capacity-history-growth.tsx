import type { ForwardNetworkCapacityDerivedArgs } from "@/hooks/forward-network-capacity-derived-types";
import { useForwardNetworkCapacityGrowth } from "@/hooks/use-forward-network-capacity-growth";
import { useForwardNetworkCapacityHistory } from "@/hooks/use-forward-network-capacity-history";

export function useForwardNetworkCapacityHistoryGrowth(
	args: ForwardNetworkCapacityDerivedArgs,
) {
	const history = useForwardNetworkCapacityHistory(args);
	const growth = useForwardNetworkCapacityGrowth(args);

	return {
		...history,
		...growth,
	};
}
