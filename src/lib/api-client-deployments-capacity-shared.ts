import type { JSONMap } from "./api-client-user-user-scope";

export type CapacityRollupRow = {
	objectType: string;
	objectId: string;
	metric: string;
	window: string;
	periodEnd: string;
	samples: number;
	avg?: number;
	p95?: number;
	p99?: number;
	max?: number;
	slopePerDay?: number;
	forecastCrossingTs?: string;
	threshold?: number;
	details?: JSONMap;
	createdAt?: string;
	forwardNetworkId?: string;
	deploymentId?: string;
	userId?: string;
};

export type CapacityPerfProxyResponse = {
	body: unknown;
};

export type CapacityRouteScaleDeltaRow = {
	deviceName: string;
	vrf: string;
	ipv4Now: number;
	ipv6Now: number;
	ipv4Prev: number;
	ipv6Prev: number;
	ipv4Delta: number;
	ipv6Delta: number;
};

export type CapacityBgpNeighborDeltaRow = {
	deviceName: string;
	vrf: string;
	neighborsNow: number;
	neighborsPrev: number;
	neighborsDelta: number;
	establishedNow: number;
	establishedPrev: number;
	establishedDelta: number;
};

export type CapacityGrowthRow = {
	objectType: string;
	objectId: string;
	metric: string;
	window: string;
	now: CapacityRollupRow;
	prev?: CapacityRollupRow | null;
	deltaP95?: number | null;
	deltaMax?: number | null;
	deltaP95Gbps?: number | null;
};

export type CapacityDeviceInventoryRow = {
	deviceName: string;
	tagNames?: string[];
	groupNames?: string[];
	deviceType?: string;
	vendor?: string;
	os?: string;
	model?: string | null;
	osVersion?: string | null;
	locationName?: string | null;
};

export type CapacityInterfaceInventoryRow = {
	deviceName: string;
	deviceLocationName?: string | null;
	deviceTagNames?: string[];
	deviceGroupNames?: string[];
	interfaceName: string;
	description?: string | null;
	adminStatus?: string;
	operStatus?: string;
	layer?: string;
	interfaceType?: string;
	mtu?: number | null;
	speedMbps?: number | null;
	aggregateId?: string | null;
	aggregationMemberNames?: string[];
	aggregationConfiguredMemberNames?: string[];
};

export type CapacityRouteScaleRow = {
	deviceName: string;
	vrf: string;
	ipv4Routes: number;
	ipv6Routes: number;
};

export type CapacityBgpNeighborRow = {
	deviceName: string;
	vrf: string;
	neighborAddress: string;
	peerDeviceName?: string | null;
	peerVrf?: string | null;
	peerAs: number;
	enabled: boolean;
	sessionState?: string | null;
	receivedPrefixes?: number | null;
	advertisedPrefixes?: number | null;
	sessionDurationSec?: number | null;
};

export type CapacityInterfaceWithDirection = {
	deviceName: string;
	interfaceName: string;
	direction?: string;
};

export type PostCapacityInterfaceMetricsHistoryRequest = {
	type: string;
	days?: number;
	startTime?: string;
	endTime?: string;
	maxSamples?: number;
	interfaces: CapacityInterfaceWithDirection[];
};

export type PostCapacityDeviceMetricsHistoryRequest = {
	type: string;
	days?: number;
	startTime?: string;
	endTime?: string;
	maxSamples?: number;
	devices: string[];
};

export type GetCapacityUnhealthyDevicesQuery = {
	snapshotId?: string;
	endTime?: string;
};

export type PostCapacityUnhealthyInterfacesRequest = {
	devices: string[];
};

export type GetCapacityUnhealthyInterfacesQuery = {
	snapshotId?: string;
	endTime?: string;
};

export type CapacityPathSearchQuery = {
	from?: string;
	srcIp?: string;
	dstIp: string;
	ipProto?: number;
	srcPort?: string;
	dstPort?: string;
	icmpType?: number;
	fin?: number;
	syn?: number;
	rst?: number;
	psh?: number;
	ack?: number;
	urg?: number;
	appId?: string;
	userId?: string;
	userGroupId?: string;
	url?: string;
};

export type ForwardNetworkCapacityPathHop = {
	deviceName?: string;
	ingressInterface?: string;
	egressInterface?: string;
};

export type ForwardNetworkCapacityPathBottleneck = {
	deviceName: string;
	interfaceName: string;
	direction: string;
	source?: string;
	speedMbps?: number | null;
	threshold?: number | null;
	p95Util?: number | null;
	maxUtil?: number | null;
	p95Gbps?: number | null;
	maxGbps?: number | null;
	headroomGbps?: number | null;
	headroomUtil?: number | null;
	forecastCrossingTs?: string | null;
};

export type CapacityNote = {
	code: string;
	message: string;
};

export type ForwardNetworkCapacityPathBottleneckItem = {
	index: number;
	query: CapacityPathSearchQuery;
	timedOut?: boolean;
	totalHits?: number;
	forwardQueryUrl?: string;
	forwardingOutcome?: string;
	securityOutcome?: string;
	bottleneck?: ForwardNetworkCapacityPathBottleneck | null;
	hops?: ForwardNetworkCapacityPathHop[];
	unmatchedHopInterfacesSample?: string[];
	notes?: CapacityNote[];
	error?: string;
};

export type ForwardNetworkCapacityPathBottlenecksCoverage = {
	hopInterfaceKeys: number;
	rollupMatched: number;
	perfFallbackUsed: number;
	unknown: number;
	truncated?: boolean;
	unmatchedHopInterfacesSample?: string[];
};
