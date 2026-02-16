import { apiFetch } from "./http";

export type AssuranceTrafficSeedRequest = {
	snapshotId?: string;
	// mesh mode filters
	tagParts?: string[];
	nameParts?: string[];
	deviceTypes?: string[];
	// cross mode filters
	srcTagParts?: string[];
	srcNameParts?: string[];
	srcDeviceTypes?: string[];
	dstTagParts?: string[];
	dstNameParts?: string[];
	dstDeviceTypes?: string[];
	includeGroups?: boolean;
	maxDevices?: number;
	maxDemands?: number;
	mode?: string;
};

export type AssuranceTrafficEndpoint = {
	deviceName: string;
	deviceType?: string;
	mgmtIp: string;
	tagNames?: string[];
	groupNames?: string[];
};

export type AssuranceTrafficDemand = {
	from?: string;
	srcIp?: string;
	dstIp: string;
	ipProto?: number;
	srcPort?: string;
	dstPort?: string;
	bandwidthGbps?: number;
	label?: string;
};

export type AssuranceTrafficSeedResponse = {
	ownerUsername: string;
	networkRef: string;
	forwardNetworkId: string;
	snapshotId?: string;
	endpoints: AssuranceTrafficEndpoint[];
	srcEndpoints?: AssuranceTrafficEndpoint[];
	dstEndpoints?: AssuranceTrafficEndpoint[];
	demands: AssuranceTrafficDemand[];
};

export async function postAssuranceTrafficSeeds(
	networkRef: string,
	body: AssuranceTrafficSeedRequest,
): Promise<AssuranceTrafficSeedResponse> {
	return apiFetch<AssuranceTrafficSeedResponse>(
		`/api/fwd/${encodeURIComponent(networkRef)}/assurance/traffic/seeds`,
		{
			method: "POST",
			body: JSON.stringify(body ?? {}),
		},
	);
}

export type AssuranceTrafficForwardOptions = {
	intent?: string;
	maxCandidates?: number;
	maxResults?: number;
	maxSeconds?: number;
	maxOverallSeconds?: number;
	includeTags?: boolean;
	includeNetworkFunctions?: boolean;
};

export type AssuranceTrafficEnforcementOptions = {
	requireEnforcement?: boolean;
	deviceTypes?: string[];
	deviceNameParts?: string[];
	tagParts?: string[];
};

export type AssuranceTrafficEvaluateRequest = {
	snapshotId?: string;
	window?: string;
	thresholdUtil?: number;
	forward?: AssuranceTrafficForwardOptions;
	enforcement?: AssuranceTrafficEnforcementOptions;
	demands: AssuranceTrafficDemand[];
	includeHops?: boolean;
	includeAcl?: boolean;
	projectLoad?: boolean;
};

export type AssuranceTrafficBottleneck = {
	deviceName: string;
	interfaceName: string;
	direction: string;
	speedMbps?: number;
	p95Util?: number;
	maxUtil?: number;
	threshold?: number;
	headroomGbps?: number;
	projectedUtil?: number;
	crossesThreshold?: boolean;
};

export type AssuranceTrafficCandidate = {
	index: number;
	forwardingOutcome?: string;
	securityOutcome?: string;
	enforced: boolean;
	timedOut?: boolean;
	bottleneck?: AssuranceTrafficBottleneck;
	hops?: Array<Record<string, unknown>>;
};

export type AssuranceTrafficEvalItem = {
	index: number;
	demand: AssuranceTrafficDemand;
	timedOut?: boolean;
	totalHits?: number;
	queryUrl?: string;
	recommended: number;
	candidates: AssuranceTrafficCandidate[];
	error?: string;
};

export type AssuranceTrafficEvaluateSummary = {
	totalDemands: number;
	delivered: number;
	notDelivered: number;
	timedOut: number;
	missingEnforcement: number;
	crossesThreshold: number;
};

export type AssuranceTrafficEvaluateResponse = {
	ownerUsername: string;
	networkRef: string;
	forwardNetworkId: string;
	snapshotId?: string;
	window: string;
	thresholdUtil: number;
	asOf?: string;
	summary: AssuranceTrafficEvaluateSummary;
	items: AssuranceTrafficEvalItem[];
	interfaceImpacts?: Array<{
		deviceName: string;
		interfaceName: string;
		direction: string;
		speedMbps?: number;
		baseP95Util?: number;
		addedGbps?: number;
		projectedUtil?: number;
		crossesThreshold?: boolean;
	}>;
};

export async function postAssuranceTrafficEvaluate(
	networkRef: string,
	body: AssuranceTrafficEvaluateRequest,
): Promise<AssuranceTrafficEvaluateResponse> {
	return apiFetch<AssuranceTrafficEvaluateResponse>(
		`/api/fwd/${encodeURIComponent(networkRef)}/assurance/traffic/evaluate`,
		{
			method: "POST",
			body: JSON.stringify(body ?? {}),
		},
	);
}
