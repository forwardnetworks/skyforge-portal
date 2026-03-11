import type {
	DeviceRow,
	InterfaceRow,
} from "@/components/capacity/forward-network-capacity-types";
import type {
	CapacityRollupRow,
	ForwardNetworkCapacityInventoryResponse,
} from "@/lib/api-client";

export type ForwardNetworkCapacityDerivedArgs = {
	ownerUserId: string;
	networkRefId: string;
	forwardNetworkId: string;
	windowLabel: "24h" | "7d" | "30d";
	windowDays: number;
	ifaceMetric:
		| "util_ingress"
		| "util_egress"
		| "if_error_ingress"
		| "if_error_egress"
		| "if_packet_loss_ingress"
		| "if_packet_loss_egress";
	deviceMetric: "device_cpu" | "device_memory";
	growthIfaceMetric: "util_ingress" | "util_egress";
	growthDeviceMetric: "device_cpu" | "device_memory";
	compareHours: number;
	ifaceFilter: string;
	deviceFilter: string;
	tagFilter: string;
	groupFilter: string;
	locationFilter: string;
	vrfFilter: string;
	groupBy: "none" | "location" | "tag" | "group" | "vrf";
	routingDeviceFilter: string;
	routingVrfFilter: string;
	selectedIface: InterfaceRow | null;
	selectedDevice: DeviceRow | null;
	rollups: CapacityRollupRow[];
	inventoryData: ForwardNetworkCapacityInventoryResponse | undefined;
	ifaceInvIndex: Map<string, { aggregateId?: string; interfaceType?: string }>;
};
