import type { CapacityRollupRow } from "@/lib/api-client";

export type InterfaceRow = {
	id: string;
	device: string;
	iface: string;
	dir: string;
	aggregateId?: string;
	isAggregate?: boolean;
	vrf?: string;
	vrfNames?: string[];
	locationName?: string;
	tagNames?: string[];
	groupNames?: string[];
	speedMbps?: number | null;
	admin?: string;
	oper?: string;
	p95?: number;
	p99?: number;
	max?: number;
	slopePerDay?: number;
	forecastCrossingTs?: string;
	threshold?: number;
	samples: number;
	raw?: CapacityRollupRow;
};

export type DeviceRow = {
	id: string;
	device: string;
	metric: string;
	locationName?: string;
	tagNames?: string[];
	groupNames?: string[];
	vendor?: string;
	os?: string;
	model?: string;
	p95?: number;
	p99?: number;
	max?: number;
	slopePerDay?: number;
	forecastCrossingTs?: string;
	threshold?: number;
	samples: number;
	raw?: CapacityRollupRow;
};

export type GroupSummaryRow = {
	group: string;
	count: number;
	hotCount: number;
	maxP95?: number;
	maxP95Gbps?: number;
	maxMax?: number;
	sumSpeedGbps?: number;
	sumP95Gbps?: number;
	sumMaxGbps?: number;
	p95Count?: number;
	soonestForecast?: string;
	ipv4RoutesSum?: number;
	ipv6RoutesSum?: number;
	bgpNeighbors?: number;
	bgpEstablished?: number;
};

export type InterfaceGrowthRow = {
	id: string;
	device: string;
	iface: string;
	dir: string;
	locationName?: string;
	tagNames?: string[];
	groupNames?: string[];
	speedMbps?: number | null;
	nowP95?: number;
	prevP95?: number | null;
	deltaP95?: number | null;
	deltaP95Gbps?: number | null;
	nowMax?: number;
	prevMax?: number | null;
	deltaMax?: number | null;
	nowForecast?: string;
	raw: unknown;
};

export type DeviceGrowthRow = {
	id: string;
	device: string;
	locationName?: string;
	tagNames?: string[];
	groupNames?: string[];
	vendor?: string;
	os?: string;
	model?: string;
	nowP95?: number;
	prevP95?: number | null;
	deltaP95?: number | null;
	nowMax?: number;
	prevMax?: number | null;
	deltaMax?: number | null;
	nowForecast?: string;
	raw: unknown;
};

export type VrfSummaryRow = {
	id: string;
	deviceName: string;
	vrf: string;
	ipv4Routes: number;
	ipv6Routes: number;
	bgpNeighbors: number;
	bgpEstablished: number;
	maxIfaceMax?: number;
	maxIfaceP95?: number;
	soonestForecast?: string;
};
