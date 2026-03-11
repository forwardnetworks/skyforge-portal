import { useForwardNetworkCapacityDeviceColumns } from "@/hooks/use-forward-network-capacity-device-columns";
import { useForwardNetworkCapacityInterfaceColumns } from "@/hooks/use-forward-network-capacity-interface-columns";

export function useForwardNetworkCapacityRollupColumns({
	ifaceMetric,
}: {
	ifaceMetric:
		| "util_ingress"
		| "util_egress"
		| "if_error_ingress"
		| "if_error_egress"
		| "if_packet_loss_ingress"
		| "if_packet_loss_egress";
}) {
	const ifaceColumns = useForwardNetworkCapacityInterfaceColumns({
		ifaceMetric,
	});
	const deviceColumns = useForwardNetworkCapacityDeviceColumns();

	return { ifaceColumns, deviceColumns };
}
