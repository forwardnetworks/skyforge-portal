import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";
import { DeploymentCapacityBgpNeighborsCard } from "./deployment-capacity-bgp-neighbors-card";
import { DeploymentCapacityRouteScaleCard } from "./deployment-capacity-route-scale-card";
import { DeploymentCapacityTcamCard } from "./deployment-capacity-tcam-card";
import { DeploymentCapacityVrfSummaryCard } from "./deployment-capacity-vrf-summary-card";

export function DeploymentCapacityRoutingTab(props: {
	page: DeploymentCapacityPageState;
}) {
	return (
		<>
			<DeploymentCapacityVrfSummaryCard page={props.page} />
			<DeploymentCapacityTcamCard page={props.page} />
			<DeploymentCapacityRouteScaleCard page={props.page} />
			<DeploymentCapacityBgpNeighborsCard page={props.page} />
		</>
	);
}
