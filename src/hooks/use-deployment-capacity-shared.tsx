import type {
	DeviceRow,
	InterfaceRow,
} from "@/components/capacity/deployment-capacity-types";

export type DeploymentCapacityDerivedInput = {
	userId: string;
	deploymentId: string;
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
	selectedIface: InterfaceRow | null;
	selectedDevice: DeviceRow | null;
	forwardEnabled: boolean;
	forwardNetworkId: string;
	locationFilter: string;
	tagFilter: string;
	groupFilter: string;
	routingDeviceFilter: string;
	routingVrfFilter: string;
	summary: any;
	inventory: any;
	rollups: any[];
	ifaceRows: InterfaceRow[];
	deviceRows: DeviceRow[];
};
