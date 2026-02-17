import type {
	AssuranceTrafficDemand,
	AssuranceTrafficEnforcementOptions,
	AssuranceTrafficEvaluateResponse,
	AssuranceTrafficForwardOptions,
} from "./assurance-traffic-api";
import { apiFetch } from "./http";
import type {
	ForwardNetworkCapacityPathBottlenecksResponse,
	ForwardNetworkCapacityUpgradeCandidatesResponse,
	PolicyReportNQEResponse,
} from "./skyforge-api";

export type AssuranceScenarioSpec = {
	snapshotId?: string;
	window?: string;
	thresholdUtil?: number;
	demands?: AssuranceTrafficDemand[];
	routing?: Record<string, unknown>;
	capacity?: Record<string, unknown>;
	security?: Record<string, unknown>;
	notes?: string;
};

export type AssuranceScenario = {
	id: string;
	userContextId: string;
	networkRef: string;
	forwardNetworkId: string;
	name: string;
	description?: string;
	spec: AssuranceScenarioSpec;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
};

export type AssuranceScenarioListResponse = {
	userContextId: string;
	networkRef: string;
	scenarios: AssuranceScenario[];
};

export type AssuranceScenarioCreateRequest = {
	name: string;
	description?: string;
	spec: AssuranceScenarioSpec;
};

export type AssuranceScenarioUpdateRequest = {
	name?: string;
	description?: string | null;
	spec?: AssuranceScenarioSpec;
};

export async function listAssuranceStudioScenarios(
	userContextId: string,
	networkRef: string,
): Promise<AssuranceScenarioListResponse> {
	void userContextId;
	return apiFetch<AssuranceScenarioListResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/studio/scenarios`,
	);
}

export async function createAssuranceStudioScenario(
	userContextId: string,
	networkRef: string,
	body: AssuranceScenarioCreateRequest,
): Promise<AssuranceScenario> {
	void userContextId;
	return apiFetch<AssuranceScenario>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/studio/scenarios`,
		{ method: "POST", body: JSON.stringify(body ?? {}) },
	);
}

export async function getAssuranceStudioScenario(
	userContextId: string,
	networkRef: string,
	scenarioId: string,
): Promise<AssuranceScenario> {
	void userContextId;
	return apiFetch<AssuranceScenario>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/studio/scenarios/${encodeURIComponent(scenarioId)}`,
	);
}

export async function updateAssuranceStudioScenario(
	userContextId: string,
	networkRef: string,
	scenarioId: string,
	body: AssuranceScenarioUpdateRequest,
): Promise<AssuranceScenario> {
	// Server uses pointer semantics for description; null means clear, undefined means keep.
	void userContextId;
	return apiFetch<AssuranceScenario>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/studio/scenarios/${encodeURIComponent(scenarioId)}`,
		{ method: "PUT", body: JSON.stringify(body ?? {}) },
	);
}

export async function deleteAssuranceStudioScenario(
	userContextId: string,
	networkRef: string,
	scenarioId: string,
): Promise<{ ok: boolean }> {
	void userContextId;
	return apiFetch<{ ok: boolean }>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/studio/scenarios/${encodeURIComponent(scenarioId)}`,
		{ method: "DELETE" },
	);
}

export type AssuranceStudioEvaluatePhases = {
	routing?: boolean;
	capacity?: boolean;
	security?: boolean;
};

export type AssuranceStudioRoutingOptions = {
	thresholdUtil?: number;
	forward?: AssuranceTrafficForwardOptions;
	enforcement?: AssuranceTrafficEnforcementOptions;
	includeHops?: boolean;
	includeAcl?: boolean;
	projectLoad?: boolean;
};

export type AssuranceStudioCapacityOptions = {
	includeHops?: boolean;
	perfFallback?: boolean;
	includeUpgradeCandidates?: boolean;
};

export type AssuranceStudioSecurityOptions = {
	requireEnforcement?: boolean;
	includeReturnPath?: boolean;
	requireSymmetricDelivery?: boolean;
	requireReturnEnforcement?: boolean;
	enforcementDeviceTypes?: string[];
	enforcementDeviceNameParts?: string[];
	enforcementTagParts?: string[];
	intent?: string;
	maxCandidates?: number;
	maxResults?: number;
	maxReturnPathResults?: number;
	maxSeconds?: number;
	maxOverallSeconds?: number;
	includeTags?: boolean;
	includeNetworkFunctions?: boolean;
};

export type AssuranceStudioEvaluateRequest = {
	snapshotId?: string;
	baselineSnapshotId?: string;
	window?: string;
	demands: AssuranceTrafficDemand[];
	phases?: AssuranceStudioEvaluatePhases;
	routing?: AssuranceStudioRoutingOptions;
	capacity?: AssuranceStudioCapacityOptions;
	security?: AssuranceStudioSecurityOptions;
};

export type AssuranceStudioRoutingDiffSummary = {
	totalDemands: number;
	changed: number;
	deliveryRegression: number;
	deliveryImprovement: number;
	pathChanged: number;
	enforcementChanged: number;
	bottleneckChanged: number;
	errorChanged: number;
};

export type AssuranceStudioRoutingDiffItem = {
	index: number;
	demand: AssuranceTrafficDemand;
	changed: boolean;
	reasons?: string[];
	baselineForwardingOutcome?: string;
	compareForwardingOutcome?: string;
	baselineEnforced?: boolean;
	compareEnforced?: boolean;
	baselineQueryUrl?: string;
	compareQueryUrl?: string;
};

export type AssuranceStudioRoutingDiffResponse = {
	baselineSnapshotId?: string;
	compareSnapshotId?: string;
	summary: AssuranceStudioRoutingDiffSummary;
	items: AssuranceStudioRoutingDiffItem[];
};

export type AssuranceStudioEvaluateResponse = {
	userContextId: string;
	networkRef: string;
	forwardNetworkId: string;
	snapshotId?: string;
	baselineSnapshotId?: string;
	window: string;
	routing?: AssuranceTrafficEvaluateResponse;
	routingBaseline?: AssuranceTrafficEvaluateResponse;
	routingDiff?: AssuranceStudioRoutingDiffResponse;
	capacity?: ForwardNetworkCapacityPathBottlenecksResponse;
	capacityUpgradeCandidates?: ForwardNetworkCapacityUpgradeCandidatesResponse;
	security?: PolicyReportNQEResponse;
	errors?: Record<string, string>;
	meta?: Record<string, unknown>;
};

export async function postAssuranceStudioEvaluate(
	userContextId: string,
	networkRef: string,
	body: AssuranceStudioEvaluateRequest,
): Promise<AssuranceStudioEvaluateResponse> {
	void userContextId;
	return apiFetch<AssuranceStudioEvaluateResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/studio/evaluate`,
		{
			method: "POST",
			body: JSON.stringify(body ?? {}),
		},
	);
}
