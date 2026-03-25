import type { JSONMap } from "./api-client-user-user-scope";
import { apiFetch } from "./http";
import type {
	CapacityBgpNeighborDeltaRow,
	CapacityDeviceInventoryRow,
	CapacityInterfaceInventoryRow,
	CapacityRouteScaleDeltaRow,
	CapacityRollupRow,
} from "./api-client-deployments-capacity-shared";

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

export type ForwardNetworkInsightSummary = {
	checks: number;
	totalFindings: number;
	high: number;
	medium: number;
	low: number;
};

export type ForwardNetworkInsightCheckResult = {
	checkId: string;
	title?: string;
	category?: string;
	severity?: string;
	findings: number;
};

export type ForwardNetworkInsightResultResponse = {
	userId: string;
	networkRef: string;
	forwardNetworkId: string;
	insightType: string;
	packId: string;
	snapshotId?: string;
	asOf?: string;
	status: string;
	summary: ForwardNetworkInsightSummary;
	checks: ForwardNetworkInsightCheckResult[];
};

export type ForwardNetworkInsightRunResponse = ForwardNetworkInsightResultResponse & {
	run: { id: number };
};

export async function getForwardNetworkSecurityInsights(
	userId: string,
	networkRef: string,
): Promise<ForwardNetworkInsightResultResponse> {
	return apiFetch<ForwardNetworkInsightResultResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/insights/security`,
	);
}

export async function runForwardNetworkSecurityInsights(
	userId: string,
	networkRef: string,
	snapshotId?: string,
): Promise<ForwardNetworkInsightRunResponse> {
	return apiFetch<ForwardNetworkInsightRunResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/insights/security/run`,
		{
			method: "POST",
			body: JSON.stringify(snapshotId ? { snapshotId } : {}),
		},
	);
}

export async function getForwardNetworkCloudInsights(
	userId: string,
	networkRef: string,
): Promise<ForwardNetworkInsightResultResponse> {
	return apiFetch<ForwardNetworkInsightResultResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/insights/cloud`,
	);
}

export async function runForwardNetworkCloudInsights(
	userId: string,
	networkRef: string,
	snapshotId?: string,
): Promise<ForwardNetworkInsightRunResponse> {
	return apiFetch<ForwardNetworkInsightRunResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/insights/cloud/run`,
		{
			method: "POST",
			body: JSON.stringify(snapshotId ? { snapshotId } : {}),
		},
	);
}
