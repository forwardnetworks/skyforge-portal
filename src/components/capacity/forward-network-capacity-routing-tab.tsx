import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";
import { ForwardNetworkCapacityBgpNeighborsCard } from "./forward-network-capacity-bgp-neighbors-card";
import { ForwardNetworkCapacityRouteScaleCard } from "./forward-network-capacity-route-scale-card";
import { ForwardNetworkCapacityTcamCard } from "./forward-network-capacity-tcam-card";
import { ForwardNetworkCapacityVrfSummaryCard } from "./forward-network-capacity-vrf-summary-card";

export function ForwardNetworkCapacityRoutingTab({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	return (
		<div className="space-y-4">
			<ForwardNetworkCapacityVrfSummaryCard page={page} />
			<ForwardNetworkCapacityTcamCard page={page} />
			<ForwardNetworkCapacityRouteScaleCard page={page} />
			<ForwardNetworkCapacityBgpNeighborsCard page={page} />
		</div>
	);
}
