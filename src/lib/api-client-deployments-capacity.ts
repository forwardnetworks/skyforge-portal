import type { JSONMap } from "./api-client-user-user-scope";
import { apiFetch } from "./http";

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

export type DeploymentCapacitySummaryResponse = {
	userId: string;
	deploymentId: string;
	forwardNetworkId: string;
	asOf?: string;
	rollups: CapacityRollupRow[];
	stale: boolean;
};

export type DeploymentCapacityRefreshResponse = {
	userId: string;
	deploymentId: string;
	run: JSONMap;
};

export type CapacityPerfProxyResponse = {
	body: unknown;
};

export async function getDeploymentCapacitySummary(
	userId: string,
	deploymentId: string,
): Promise<DeploymentCapacitySummaryResponse> {
	return apiFetch<DeploymentCapacitySummaryResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/summary`,
	);
}

export async function refreshDeploymentCapacityRollups(
	userId: string,
	deploymentId: string,
): Promise<DeploymentCapacityRefreshResponse> {
	return apiFetch<DeploymentCapacityRefreshResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/rollups/refresh`,
		{ method: "POST", body: "{}" },
	);
}

export type ForwardNetworkCapacitySummaryResponse = {
	userId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOf?: string;
	rollups: CapacityRollupRow[];
	stale: boolean;
};

export type ForwardNetworkCapacityRefreshResponse = {
	userId: string;
	networkRef: string;
	run: JSONMap;
};

export async function getForwardNetworkCapacitySummary(
	userId: string,
	networkRef: string,
): Promise<ForwardNetworkCapacitySummaryResponse> {
	return apiFetch<ForwardNetworkCapacitySummaryResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/summary`,
	);
}

export async function refreshForwardNetworkCapacityRollups(
	userId: string,
	networkRef: string,
): Promise<ForwardNetworkCapacityRefreshResponse> {
	return apiFetch<ForwardNetworkCapacityRefreshResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/rollups/refresh`,
		{ method: "POST", body: "{}" },
	);
}

export type ForwardNetworkCapacityCoverageResponse = {
	userId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOfRollups?: string;
	asOfInventory?: string;
	devicesTotal: number;
	ifacesTotal: number;
	ifacesWithSpeed: number;
	ifacesAdminUp: number;
	ifacesOperUp: number;
	rollupsInterfaceTotal: number;
	rollupsDeviceTotal: number;
	rollupsWithSamples: number;
};

export async function getForwardNetworkCapacityCoverage(
	userId: string,
	networkRef: string,
): Promise<ForwardNetworkCapacityCoverageResponse> {
	return apiFetch<ForwardNetworkCapacityCoverageResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/coverage`,
	);
}

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

export type ForwardNetworkCapacitySnapshotDeltaResponse = {
	userId: string;
	networkRef: string;
	forwardNetworkId: string;
	latestSnapshotId?: string;
	prevSnapshotId?: string;
	routeDelta: CapacityRouteScaleDeltaRow[];
	bgpDelta: CapacityBgpNeighborDeltaRow[];
	deviceDelta?: Array<{
		deviceName: string;
		changeType: string;
		changes?: string[];
		prev?: CapacityDeviceInventoryRow;
		now?: CapacityDeviceInventoryRow;
	}>;
	interfaceDelta?: Array<{
		deviceName: string;
		interfaceName: string;
		changeType: string;
		changes?: string[];
		prev?: CapacityInterfaceInventoryRow;
		now?: CapacityInterfaceInventoryRow;
	}>;
};

export async function getForwardNetworkCapacitySnapshotDelta(
	userId: string,
	networkRef: string,
): Promise<ForwardNetworkCapacitySnapshotDeltaResponse> {
	return apiFetch<ForwardNetworkCapacitySnapshotDeltaResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/snapshot-delta`,
	);
}

export type ForwardNetworkCapacityUpgradeCandidate = {
	scopeType: string;
	device: string;
	name: string;
	members?: string[];
	speedMbps: number;
	worstDirection: string;
	p95Util: number;
	maxUtil: number;
	p95Gbps: number;
	maxGbps: number;
	forecastCrossingTs?: string | null;
	requiredSpeedMbps?: number | null;
	recommendedSpeedMbps?: number | null;
	reason?: string;
	worstMemberMaxUtil?: number | null;
};

export type ForwardNetworkCapacityUpgradeCandidatesResponse = {
	userId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOf?: string;
	items: ForwardNetworkCapacityUpgradeCandidate[];
};

export async function getForwardNetworkCapacityUpgradeCandidates(
	userId: string,
	networkRef: string,
	q: { window?: string } = {},
): Promise<ForwardNetworkCapacityUpgradeCandidatesResponse> {
	const qs = new URLSearchParams();
	if (q.window) qs.set("window", q.window);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<ForwardNetworkCapacityUpgradeCandidatesResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/upgrade-candidates${suffix}`,
	);
}

export type ForwardNetworkCapacityPortfolioItem = {
	networkRef: string;
	forwardNetworkId: string;
	name: string;
	description?: string;
	asOf?: string;
	stale: boolean;
	hotInterfaces: number;
	soonestForecast?: string | null;
	maxUtilMax?: number | null;
	maxUtilP95?: number | null;
};

export type ForwardNetworkCapacityPortfolioResponse = {
	userId: string;
	items: ForwardNetworkCapacityPortfolioItem[];
};

export async function getUserScopeForwardNetworkCapacityPortfolio(
	userId: string,
): Promise<ForwardNetworkCapacityPortfolioResponse> {
	return apiFetch<ForwardNetworkCapacityPortfolioResponse>(
		`/api/users/${encodeURIComponent(userId)}/capacity/forward-networks/portfolio`,
	);
}

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

export type DeploymentCapacityInventoryResponse = {
	userId: string;
	deploymentId: string;
	forwardNetworkId: string;
	asOf?: string;
	snapshotId?: string;
	devices: CapacityDeviceInventoryRow[];
	interfaces: CapacityInterfaceInventoryRow[];
	interfaceVrfs?: Array<{
		deviceName: string;
		vrf: string;
		ifaceName: string;
		subIfaceName?: string | null;
	}>;
	hardwareTcam?: Array<{
		deviceName: string;
		vendor?: string;
		os?: string;
		model?: string | null;
		tcamUsed: number;
		tcamTotal: number;
		commandText?: string;
		evidence?: string;
	}>;
	routeScale: CapacityRouteScaleRow[];
	bgpNeighbors: CapacityBgpNeighborRow[];
};

export type ForwardNetworkCapacityInventoryResponse = {
	userId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOf?: string;
	snapshotId?: string;
	devices: CapacityDeviceInventoryRow[];
	interfaces: CapacityInterfaceInventoryRow[];
	interfaceVrfs?: Array<{
		deviceName: string;
		vrf: string;
		ifaceName: string;
		subIfaceName?: string | null;
	}>;
	hardwareTcam?: Array<{
		deviceName: string;
		vendor?: string;
		os?: string;
		model?: string | null;
		tcamUsed: number;
		tcamTotal: number;
		commandText?: string;
		evidence?: string;
	}>;
	routeScale: CapacityRouteScaleRow[];
	bgpNeighbors: CapacityBgpNeighborRow[];
};

export async function getDeploymentCapacityInventory(
	userId: string,
	deploymentId: string,
): Promise<DeploymentCapacityInventoryResponse> {
	return apiFetch<DeploymentCapacityInventoryResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/inventory`,
	);
}

export async function getForwardNetworkCapacityInventory(
	userId: string,
	networkRef: string,
): Promise<ForwardNetworkCapacityInventoryResponse> {
	return apiFetch<ForwardNetworkCapacityInventoryResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/inventory`,
	);
}

export type DeploymentCapacityGrowthQuery = {
	metric: string;
	window: string;
	objectType?: string;
	compareHours?: number;
	limit?: number;
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

export type DeploymentCapacityGrowthResponse = {
	userId: string;
	deploymentId: string;
	metric: string;
	window: string;
	objectType?: string;
	asOf?: string;
	compareAsOf?: string;
	compareHours: number;
	rows: CapacityGrowthRow[];
};

export type ForwardNetworkCapacityGrowthResponse = {
	userId: string;
	networkRef: string;
	forwardNetworkId: string;
	metric: string;
	window: string;
	objectType?: string;
	asOf?: string;
	compareAsOf?: string;
	compareHours: number;
	rows: CapacityGrowthRow[];
};

export async function getDeploymentCapacityGrowth(
	userId: string,
	deploymentId: string,
	q: DeploymentCapacityGrowthQuery,
): Promise<DeploymentCapacityGrowthResponse> {
	const qs = new URLSearchParams();
	qs.set("metric", q.metric);
	qs.set("window", q.window);
	if (q.objectType) qs.set("objectType", q.objectType);
	if (q.compareHours) qs.set("compareHours", String(q.compareHours));
	if (q.limit) qs.set("limit", String(q.limit));
	return apiFetch<DeploymentCapacityGrowthResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/growth?${qs.toString()}`,
	);
}

export async function getForwardNetworkCapacityGrowth(
	userId: string,
	networkRef: string,
	q: DeploymentCapacityGrowthQuery,
): Promise<ForwardNetworkCapacityGrowthResponse> {
	const qs = new URLSearchParams();
	qs.set("metric", q.metric);
	qs.set("window", q.window);
	if (q.objectType) qs.set("objectType", q.objectType);
	if (q.compareHours) qs.set("compareHours", String(q.compareHours));
	if (q.limit) qs.set("limit", String(q.limit));
	return apiFetch<ForwardNetworkCapacityGrowthResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/growth?${qs.toString()}`,
	);
}

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

export async function postDeploymentCapacityInterfaceMetricsHistory(
	userId: string,
	deploymentId: string,
	body: PostCapacityInterfaceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/interface-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function postForwardNetworkCapacityInterfaceMetricsHistory(
	userId: string,
	networkRef: string,
	body: PostCapacityInterfaceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/perf/interface-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type PostCapacityDeviceMetricsHistoryRequest = {
	type: string;
	days?: number;
	startTime?: string;
	endTime?: string;
	maxSamples?: number;
	devices: string[];
};

export async function postDeploymentCapacityDeviceMetricsHistory(
	userId: string,
	deploymentId: string,
	body: PostCapacityDeviceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/device-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function postForwardNetworkCapacityDeviceMetricsHistory(
	userId: string,
	networkRef: string,
	body: PostCapacityDeviceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/perf/device-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type GetCapacityUnhealthyDevicesQuery = {
	snapshotId?: string;
	endTime?: string;
};

export async function getDeploymentCapacityUnhealthyDevices(
	userId: string,
	deploymentId: string,
	q: GetCapacityUnhealthyDevicesQuery,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/unhealthy-devices${suffix}`,
	);
}

export async function getForwardNetworkCapacityUnhealthyDevices(
	userId: string,
	networkRef: string,
	q: GetCapacityUnhealthyDevicesQuery,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/perf/unhealthy-devices${suffix}`,
	);
}

export type PostCapacityUnhealthyInterfacesRequest = {
	devices: string[];
};

export type GetCapacityUnhealthyInterfacesQuery = {
	snapshotId?: string;
	endTime?: string;
};

export async function postDeploymentCapacityUnhealthyInterfaces(
	userId: string,
	deploymentId: string,
	q: GetCapacityUnhealthyInterfacesQuery,
	body: PostCapacityUnhealthyInterfacesRequest,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/unhealthy-interfaces${suffix}`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function postForwardNetworkCapacityUnhealthyInterfaces(
	userId: string,
	networkRef: string,
	q: GetCapacityUnhealthyInterfacesQuery,
	body: PostCapacityUnhealthyInterfacesRequest,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/perf/unhealthy-interfaces${suffix}`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

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

export type ForwardNetworkCapacityPathBottlenecksRequest = {
	window: string;
	snapshotId?: string;
	includeHops?: boolean;
	queries: CapacityPathSearchQuery[];
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

export type ForwardNetworkCapacityPathBottlenecksResponse = {
	userId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOf?: string;
	window: string;
	snapshotId?: string;
	coverage?: ForwardNetworkCapacityPathBottlenecksCoverage | null;
	items: ForwardNetworkCapacityPathBottleneckItem[];
};

export async function postForwardNetworkCapacityPathBottlenecks(
	userId: string,
	networkRef: string,
	body: ForwardNetworkCapacityPathBottlenecksRequest,
): Promise<ForwardNetworkCapacityPathBottlenecksResponse> {
	return apiFetch<ForwardNetworkCapacityPathBottlenecksResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/path-bottlenecks`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}
