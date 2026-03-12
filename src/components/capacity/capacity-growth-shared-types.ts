export type CapacityIfaceGrowthMetric = "util_ingress" | "util_egress";
export type CapacityDeviceGrowthMetric = "device_cpu" | "device_memory";

export type GrowthQueryLike = {
	isLoading: boolean;
	isError: boolean;
	error: unknown;
	data?: {
		asOf?: string;
		compareAsOf?: string;
	};
};

export type InterfaceGrowthRowLike = {
	id: string;
	device: string;
	iface: string;
	dir: string;
	speedMbps?: number | null;
	nowP95?: number;
	prevP95?: number | null;
	deltaP95?: number | null;
	deltaP95Gbps?: number | null;
	nowForecast?: string;
};

export type DeviceGrowthRowLike = {
	id: string;
	device: string;
	vendor?: string;
	os?: string;
	model?: string;
	nowP95?: number;
	prevP95?: number | null;
	deltaP95?: number | null;
	nowForecast?: string;
};
