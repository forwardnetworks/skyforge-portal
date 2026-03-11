import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";
import { DeploymentCapacityDeviceTrendDialog } from "./deployment-capacity-device-trend-dialog";
import { DeploymentCapacityInterfaceTrendDialog } from "./deployment-capacity-interface-trend-dialog";
import { DeploymentCapacityPickDeviceDialog } from "./deployment-capacity-pick-device-dialog";
import { DeploymentCapacityPickInterfaceDialog } from "./deployment-capacity-pick-interface-dialog";
import { DeploymentCapacityTcamEvidenceDialog } from "./deployment-capacity-tcam-evidence-dialog";

export function DeploymentCapacityDialogs(props: {
	page: DeploymentCapacityPageState;
}) {
	return (
		<>
			<DeploymentCapacityInterfaceTrendDialog page={props.page} />
			<DeploymentCapacityDeviceTrendDialog page={props.page} />
			<DeploymentCapacityPickInterfaceDialog page={props.page} />
			<DeploymentCapacityTcamEvidenceDialog page={props.page} />
			<DeploymentCapacityPickDeviceDialog page={props.page} />
		</>
	);
}
