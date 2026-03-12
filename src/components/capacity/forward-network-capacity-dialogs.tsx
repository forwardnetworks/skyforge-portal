import type { ForwardNetworkCapacityPageContentProps } from "./forward-network-capacity-page-shared";
import { ForwardNetworkCapacityDeviceTrendDialog } from "./forward-network-capacity-device-trend-dialog";
import { ForwardNetworkCapacityInterfaceTrendDialog } from "./forward-network-capacity-interface-trend-dialog";
import { ForwardNetworkCapacityPickDeviceDialog } from "./forward-network-capacity-pick-device-dialog";
import { ForwardNetworkCapacityPickInterfaceDialog } from "./forward-network-capacity-pick-interface-dialog";
import { ForwardNetworkCapacityTcamEvidenceDialog } from "./forward-network-capacity-tcam-evidence-dialog";

export function ForwardNetworkCapacityDialogs({
	page,
}: ForwardNetworkCapacityPageContentProps) {
	return (
		<>
			<ForwardNetworkCapacityInterfaceTrendDialog page={page} />
			<ForwardNetworkCapacityDeviceTrendDialog page={page} />
			<ForwardNetworkCapacityPickInterfaceDialog page={page} />
			<ForwardNetworkCapacityPickDeviceDialog page={page} />
			<ForwardNetworkCapacityTcamEvidenceDialog page={page} />
		</>
	);
}
