import type { JSONMap } from "./api-client-user-user-scope";
import { apiFetch } from "./http";

export type PolicyReportCatalogParam = {
	name: string;
	type: string;
	default?: unknown;
	description?: string;
	required?: boolean;
};

export type PolicyReportCatalogCheck = {
	id: string;
	title?: string;
	category?: string;
	severity?: string;
	description?: string;
	params?: PolicyReportCatalogParam[];
};

export type PolicyReportCatalog = {
	version?: string;
	checks?: PolicyReportCatalogCheck[];
};

export type PolicyReportPackCheck = {
	id: string;
	parameters?: JSONMap;
};

export type PolicyReportPack = {
	id: string;
	title?: string;
	description?: string;
	checks?: PolicyReportPackCheck[];
};

export type PolicyReportPacks = {
	version?: string;
	packs?: PolicyReportPack[];
};

export type PolicyReportChecksResponse = {
	catalog?: PolicyReportCatalog;
	checks: PolicyReportCatalogCheck[];
	files: string[];
};

export type PolicyReportCheckResponse = {
	check?: PolicyReportCatalogCheck;
	content: string;
};

export type PolicyReportNQEResponse = {
	snapshotId?: string;
	total: number;
	results: unknown;
};

export type PolicyReportSnapshotsResponse = {
	body: unknown;
};

export type PolicyReportRunCheckRequest = {
	networkId: string;
	snapshotId?: string;
	checkId: string;
	parameters?: JSONMap;
	queryOptions?: JSONMap;
};

export type PolicyReportRunPackRequest = {
	networkId: string;
	snapshotId?: string;
	packId: string;
	queryOptions?: JSONMap;
};

export type PolicyReportRunPackResponse = {
	packId: string;
	networkId: string;
	snapshotId?: string;
	results: Record<string, PolicyReportNQEResponse>;
};

export type PolicyReportPackDeltaRequest = {
	networkId: string;
	packId: string;
	baselineSnapshotId: string;
	compareSnapshotId: string;
	queryOptions?: JSONMap;
	maxSamplesPerBucket?: number;
};

export type PolicyReportPackDeltaCheck = {
	checkId: string;
	baselineTotal: number;
	compareTotal: number;
	newCount: number;
	resolvedCount: number;
	changedCount: number;
	newSamples?: unknown;
	oldSamples?: unknown;
	changedSamples?: unknown;
};

export type PolicyReportPackDeltaResponse = {
	packId: string;
	networkId: string;
	baselineSnapshotId: string;
	compareSnapshotId: string;
	checks: PolicyReportPackDeltaCheck[];
};

export type PolicyReportRecertCampaign = {
	id: string;
	userId: string;
	name: string;
	description?: string;
	forwardNetworkId: string;
	snapshotId?: string;
	packId: string;
	status: string;
	dueAt?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
};

export type PolicyReportRecertCampaignCounts = {
	total: number;
	pending: number;
	attested: number;
	waived: number;
};

export type PolicyReportRecertCampaignWithCounts = {
	campaign: PolicyReportRecertCampaign;
	counts: PolicyReportRecertCampaignCounts;
};

export type PolicyReportListRecertCampaignsResponse = {
	campaigns: PolicyReportRecertCampaignWithCounts[];
};

export type PolicyReportCreateRecertCampaignRequest = {
	name: string;
	description?: string;
	forwardNetworkId: string;
	snapshotId?: string;
	packId: string;
	dueAt?: string;
};

export type PolicyReportRecertAssignment = {
	id: string;
	campaignId: string;
	userId: string;
	findingId: string;
	checkId: string;
	assigneeUsername?: string;
	status: string;
	justification?: string;
	attestedAt?: string;
	finding?: unknown;
	createdAt: string;
	updatedAt: string;
	checkTitle?: string;
	checkCategory?: string;
	checkSeverity?: string;
	findingRiskScore?: number;
	findingRiskReasons?: string[];
	findingAssetKey?: string;
};

export type PolicyReportListRecertAssignmentsResponse = {
	assignments: PolicyReportRecertAssignment[];
};

export type PolicyReportGenerateRecertAssignmentsRequest = {
	assigneeUsername?: string;
	maxPerCheck?: number;
	maxTotal?: number;
	queryOptions?: JSONMap;
};

export type PolicyReportGenerateRecertAssignmentsResponse = {
	campaignId: string;
	created: number;
};

export type PolicyReportAttestAssignmentRequest = {
	justification?: string;
};

export type PolicyReportException = {
	id: string;
	userId: string;
	forwardNetworkId: string;
	findingId: string;
	checkId: string;
	status: string;
	justification: string;
	ticketUrl?: string;
	expiresAt?: string;
	createdBy: string;
	approvedBy?: string;
	createdAt: string;
	updatedAt: string;
};

export type PolicyReportListExceptionsResponse = {
	exceptions: PolicyReportException[];
};

export type PolicyReportCreateExceptionRequest = {
	forwardNetworkId: string;
	findingId: string;
	checkId: string;
	justification: string;
	ticketUrl?: string;
	expiresAt?: string;
};

export type PolicyReportDecisionResponse = {
	ok: boolean;
};

export type PolicyReportForwardNetwork = {
	id: string;
	userId: string;
	forwardNetworkId: string;
	name: string;
	description?: string;
	collectorConfigId?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
};

export type PolicyReportCreateForwardNetworkRequest = {
	forwardNetworkId: string;
	name: string;
	description?: string;
	collectorConfigId?: string;
};

export type PolicyReportListForwardNetworksResponse = {
	networks: PolicyReportForwardNetwork[];
};

export type PolicyReportForwardCredentialsStatus = {
	configured: boolean;
	baseUrl?: string;
	skipTlsVerify?: boolean;
	username?: string;
	hasPassword?: boolean;
	updatedAt?: string;
};

export type PolicyReportPutForwardCredentialsRequest = {
	baseUrl: string;
	skipTlsVerify: boolean;
	username: string;
	password?: string;
};

export type PolicyReportZone = {
	id: string;
	userId: string;
	forwardNetworkId: string;
	name: string;
	description?: string;
	subnets: string[];
	createdBy: string;
	createdAt: string;
	updatedAt: string;
};

export type PolicyReportCreateZoneRequest = {
	name: string;
	description?: string;
	subnets: string[];
};

export type PolicyReportUpdateZoneRequest = {
	name: string;
	description?: string;
	subnets: string[];
};

export type PolicyReportListZonesResponse = {
	zones: PolicyReportZone[];
};

export type PolicyReportRun = {
	id: string;
	userId: string;
	forwardNetworkId: string;
	snapshotId?: string;
	packId: string;
	status: string;
	error?: string;
	createdBy: string;
	startedAt: string;
	finishedAt?: string;
	request?: unknown;
};

export type PolicyReportRunCheck = {
	runId: string;
	checkId: string;
	total: number;
};

export type PolicyReportRunFinding = {
	runId: string;
	checkId: string;
	findingId: string;
	riskScore: number;
	assetKey?: string;
	finding?: unknown;
};

export type PolicyReportFindingAgg = {
	userId: string;
	forwardNetworkId: string;
	checkId: string;
	findingId: string;
	status: string;
	riskScore: number;
	assetKey?: string;
	finding?: unknown;
	firstSeenAt: string;
	lastSeenAt: string;
	resolvedAt?: string;
	lastRunId?: string;
};

export type PolicyReportCreateRunRequest = {
	forwardNetworkId: string;
	snapshotId?: string;
	packId: string;
	queryOptions?: JSONMap;
	maxPerCheck?: number;
	maxTotal?: number;
};

export type PolicyReportCreateRunResponse = {
	run: PolicyReportRun;
	checks: PolicyReportRunCheck[];
	results?: Record<string, PolicyReportNQEResponse>;
};

export type PolicyReportListRunsResponse = {
	runs: PolicyReportRun[];
};

export type PolicyReportGetRunResponse = {
	run: PolicyReportRun;
	checks: PolicyReportRunCheck[];
};

export type PolicyReportListRunFindingsResponse = {
	findings: PolicyReportRunFinding[];
};

export type PolicyReportListFindingsResponse = {
	findings: PolicyReportFindingAgg[];
};

export type PolicyReportPresetCheckSpec = {
	checkId: string;
	parameters?: JSONMap;
};

export type PolicyReportPreset = {
	id: string;
	userId: string;
	forwardNetworkId: string;
	name: string;
	description?: string;
	kind: string;
	packId?: string;
	titleTemplate?: string;
	snapshotId?: string;
	checks?: PolicyReportPresetCheckSpec[];
	queryOptions?: JSONMap;
	maxPerCheck?: number;
	maxTotal?: number;
	enabled: boolean;
	intervalMinutes: number;
	nextRunAt?: string;
	lastRunId?: string;
	lastRunAt?: string;
	lastError?: string;
	ownerUsername: string;
	createdAt: string;
	updatedAt: string;
};

export type PolicyReportCreatePresetRequest = {
	forwardNetworkId: string;
	name: string;
	description?: string;
	kind?: string;
	packId?: string;
	titleTemplate?: string;
	snapshotId?: string;
	checks?: PolicyReportPresetCheckSpec[];
	queryOptions?: JSONMap;
	maxPerCheck?: number;
	maxTotal?: number;
	enabled?: boolean;
	intervalMinutes?: number;
};

export type PolicyReportListPresetsResponse = {
	presets: PolicyReportPreset[];
};

export type PolicyReportRunPresetResponse = {
	preset: PolicyReportPreset;
	run: PolicyReportRun;
	checks: PolicyReportRunCheck[];
	results?: Record<string, PolicyReportNQEResponse>;
};

export type PolicyReportPathQuery = {
	from?: string;
	srcIp?: string;
	dstIp: string;
	ipProto?: number;
	srcPort?: string;
	dstPort?: string;
};

export type PolicyReportPathsEnforcementBypassRequest = {
	forwardNetworkId: string;
	snapshotId?: string;
	queries: PolicyReportPathQuery[];
	requireEnforcement?: boolean;
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

export type PolicyReportPathsEnforcementBypassStoreRequest =
	PolicyReportPathsEnforcementBypassRequest & {
		title?: string;
	};

export type PolicyReportPathsEnforcementBypassStoreResponse = {
	run: PolicyReportRun;
	checks: PolicyReportRunCheck[];
	results?: Record<string, PolicyReportNQEResponse>;
};

export type PolicyReportCustomRunCheckSpec = {
	checkId: string;
	parameters?: JSONMap;
};

export type PolicyReportCreateCustomRunRequest = {
	forwardNetworkId: string;
	snapshotId?: string;
	packId?: string;
	title?: string;
	checks: PolicyReportCustomRunCheckSpec[];
	queryOptions?: JSONMap;
	maxPerCheck?: number;
	maxTotal?: number;
};

export type PolicyReportCreateCustomRunResponse = {
	run: PolicyReportRun;
	checks: PolicyReportRunCheck[];
	results?: Record<string, PolicyReportNQEResponse>;
};

export type PolicyReportFlowTuple = {
	srcIp: string;
	dstIp: string;
	ipProto?: number;
	dstPort?: number;
};

export type PolicyReportProposedRule = {
	index: number;
	action: string;
	ipv4Src?: string[];
	ipv4Dst?: string[];
	ipProto?: number[];
	tpDst?: string[];
};

export type PolicyReportRuleChange = {
	op: string;
	rule: PolicyReportProposedRule;
};

export type PolicyReportChangePlanningRequest = {
	networkId: string;
	snapshotId?: string;
	firewallsOnly?: boolean;
	includeImplicitDefault?: boolean;
	deviceName?: string;
	flows: PolicyReportFlowTuple[];
	change: PolicyReportRuleChange;
};

export type PolicyReportFlowImpact = {
	device: string;
	flow: PolicyReportFlowTuple;
	beforeDecision: string;
	afterDecision: string;
	beforeRule?: string;
	afterRule?: string;
	beforeIndex?: number;
	afterIndex?: number;
	changed: boolean;
	reason?: string;
};

export type PolicyReportChangePlanningResponse = {
	totalFlows: number;
	totalDevices: number;
	changedCount: number;
	impacts: PolicyReportFlowImpact[];
};

export async function getUserScopePolicyReportChecks(
	userId: string,
): Promise<PolicyReportChecksResponse> {
	return apiFetch<PolicyReportChecksResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/checks`,
	);
}

export async function getUserScopePolicyReportCheck(
	userId: string,
	checkId: string,
): Promise<PolicyReportCheckResponse> {
	return apiFetch<PolicyReportCheckResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/checks/${encodeURIComponent(checkId)}`,
	);
}

export async function getUserScopePolicyReportPacks(
	userId: string,
): Promise<PolicyReportPacks> {
	return apiFetch<PolicyReportPacks>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/packs`,
	);
}

export async function getUserScopePolicyReportSnapshots(
	userId: string,
	networkId: string,
	maxResults?: number,
): Promise<PolicyReportSnapshotsResponse> {
	const qs = new URLSearchParams();
	qs.set("networkId", networkId);
	if (typeof maxResults === "number") {
		qs.set("maxResults", String(maxResults));
	}
	return apiFetch<PolicyReportSnapshotsResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/snapshots?${qs.toString()}`,
	);
}

export async function runUserScopePolicyReportCheck(
	userId: string,
	body: PolicyReportRunCheckRequest,
): Promise<PolicyReportNQEResponse> {
	return apiFetch<PolicyReportNQEResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/checks/run`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function runUserScopePolicyReportPack(
	userId: string,
	body: PolicyReportRunPackRequest,
): Promise<PolicyReportRunPackResponse> {
	return apiFetch<PolicyReportRunPackResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/packs/run`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function runUserScopePolicyReportPackDelta(
	userId: string,
	body: PolicyReportPackDeltaRequest,
): Promise<PolicyReportPackDeltaResponse> {
	return apiFetch<PolicyReportPackDeltaResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/packs/delta`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function createUserScopePolicyReportRecertCampaign(
	userId: string,
	body: PolicyReportCreateRecertCampaignRequest,
): Promise<PolicyReportRecertCampaignWithCounts> {
	return apiFetch<PolicyReportRecertCampaignWithCounts>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/governance/campaigns`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listUserScopePolicyReportRecertCampaigns(
	userId: string,
	status?: string,
	limit?: number,
): Promise<PolicyReportListRecertCampaignsResponse> {
	const qs = new URLSearchParams();
	if (status) qs.set("status", status);
	if (typeof limit === "number") qs.set("limit", String(limit));
	return apiFetch<PolicyReportListRecertCampaignsResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/governance/campaigns?${qs.toString()}`,
	);
}

export async function getUserScopePolicyReportRecertCampaign(
	userId: string,
	campaignId: string,
): Promise<PolicyReportRecertCampaignWithCounts> {
	return apiFetch<PolicyReportRecertCampaignWithCounts>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/governance/campaigns/${encodeURIComponent(campaignId)}`,
	);
}

export async function generateUserScopePolicyReportRecertAssignments(
	userId: string,
	campaignId: string,
	body: PolicyReportGenerateRecertAssignmentsRequest,
): Promise<PolicyReportGenerateRecertAssignmentsResponse> {
	return apiFetch<PolicyReportGenerateRecertAssignmentsResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/governance/campaigns/${encodeURIComponent(campaignId)}/generate`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listUserScopePolicyReportRecertAssignments(
	userId: string,
	campaignId?: string,
	status?: string,
	assignee?: string,
	limit?: number,
): Promise<PolicyReportListRecertAssignmentsResponse> {
	const qs = new URLSearchParams();
	if (campaignId) qs.set("campaignId", campaignId);
	if (status) qs.set("status", status);
	if (assignee) qs.set("assignee", assignee);
	if (typeof limit === "number") qs.set("limit", String(limit));
	return apiFetch<PolicyReportListRecertAssignmentsResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/governance/assignments?${qs.toString()}`,
	);
}

export async function attestUserScopePolicyReportRecertAssignment(
	userId: string,
	assignmentId: string,
	body: PolicyReportAttestAssignmentRequest,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/governance/assignments/${encodeURIComponent(assignmentId)}/attest`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function waiveUserScopePolicyReportRecertAssignment(
	userId: string,
	assignmentId: string,
	body: PolicyReportAttestAssignmentRequest,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/governance/assignments/${encodeURIComponent(assignmentId)}/waive`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

// Forward Networks (generic user-scope saved networks; used by capacity tooling)

export async function createUserScopeForwardNetwork(
	userId: string,
	body: PolicyReportCreateForwardNetworkRequest,
): Promise<PolicyReportForwardNetwork> {
	return apiFetch<PolicyReportForwardNetwork>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listUserScopeForwardNetworks(
	userId: string,
): Promise<PolicyReportListForwardNetworksResponse> {
	return apiFetch<PolicyReportListForwardNetworksResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks`,
	);
}

export async function deleteUserScopeForwardNetwork(
	userId: string,
	networkRef: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}`,
		{ method: "DELETE" },
	);
}

export async function createUserScopePolicyReportForwardNetwork(
	userId: string,
	body: PolicyReportCreateForwardNetworkRequest,
): Promise<PolicyReportForwardNetwork> {
	return apiFetch<PolicyReportForwardNetwork>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/networks`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listUserScopePolicyReportForwardNetworks(
	userId: string,
): Promise<PolicyReportListForwardNetworksResponse> {
	return apiFetch<PolicyReportListForwardNetworksResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/networks`,
	);
}

export async function deleteUserScopePolicyReportForwardNetwork(
	userId: string,
	networkRef: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/networks/${encodeURIComponent(networkRef)}`,
		{ method: "DELETE" },
	);
}

export async function getUserScopePolicyReportForwardNetworkCredentials(
	userId: string,
	forwardNetworkId: string,
): Promise<PolicyReportForwardCredentialsStatus> {
	return apiFetch<PolicyReportForwardCredentialsStatus>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/credentials`,
	);
}

export async function putUserScopePolicyReportForwardNetworkCredentials(
	userId: string,
	forwardNetworkId: string,
	body: PolicyReportPutForwardCredentialsRequest,
): Promise<PolicyReportForwardCredentialsStatus> {
	return apiFetch<PolicyReportForwardCredentialsStatus>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/credentials`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export async function deleteUserScopePolicyReportForwardNetworkCredentials(
	userId: string,
	forwardNetworkId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/credentials`,
		{ method: "DELETE" },
	);
}

export async function createUserScopePolicyReportZone(
	userId: string,
	forwardNetworkId: string,
	body: PolicyReportCreateZoneRequest,
): Promise<PolicyReportZone> {
	return apiFetch<PolicyReportZone>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/zones`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function listUserScopePolicyReportZones(
	userId: string,
	forwardNetworkId: string,
): Promise<PolicyReportListZonesResponse> {
	return apiFetch<PolicyReportListZonesResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/zones`,
	);
}

export async function updateUserScopePolicyReportZone(
	userId: string,
	forwardNetworkId: string,
	zoneId: string,
	body: PolicyReportUpdateZoneRequest,
): Promise<PolicyReportZone> {
	return apiFetch<PolicyReportZone>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/zones/${encodeURIComponent(zoneId)}`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export async function deleteUserScopePolicyReportZone(
	userId: string,
	forwardNetworkId: string,
	zoneId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/zones/${encodeURIComponent(zoneId)}`,
		{ method: "DELETE" },
	);
}

export async function createUserScopePolicyReportPreset(
	userId: string,
	body: PolicyReportCreatePresetRequest,
): Promise<PolicyReportPreset> {
	return apiFetch<PolicyReportPreset>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/presets`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function listUserScopePolicyReportPresets(
	userId: string,
	forwardNetworkId?: string,
	enabled?: boolean,
	limit?: number,
): Promise<PolicyReportListPresetsResponse> {
	const qs = new URLSearchParams();
	if (forwardNetworkId) qs.set("forwardNetworkId", forwardNetworkId);
	if (typeof enabled === "boolean")
		qs.set("enabled", enabled ? "true" : "false");
	if (typeof limit === "number") qs.set("limit", String(limit));
	const q = qs.toString();
	return apiFetch<PolicyReportListPresetsResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/presets${q ? `?${q}` : ""}`,
	);
}

export async function deleteUserScopePolicyReportPreset(
	userId: string,
	presetId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/presets/${encodeURIComponent(presetId)}`,
		{ method: "DELETE" },
	);
}

export async function runUserScopePolicyReportPreset(
	userId: string,
	presetId: string,
): Promise<PolicyReportRunPresetResponse> {
	return apiFetch<PolicyReportRunPresetResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/presets/${encodeURIComponent(presetId)}/run`,
		{ method: "POST", body: "{}" },
	);
}

export async function runUserScopePolicyReportPathsEnforcementBypass(
	userId: string,
	body: PolicyReportPathsEnforcementBypassRequest,
): Promise<PolicyReportNQEResponse> {
	return apiFetch<PolicyReportNQEResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/paths/enforcement-bypass`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function storeUserScopePolicyReportPathsEnforcementBypass(
	userId: string,
	body: PolicyReportPathsEnforcementBypassStoreRequest,
): Promise<PolicyReportPathsEnforcementBypassStoreResponse> {
	return apiFetch<PolicyReportPathsEnforcementBypassStoreResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/paths/enforcement-bypass/store`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function createUserScopePolicyReportRun(
	userId: string,
	body: PolicyReportCreateRunRequest,
): Promise<PolicyReportCreateRunResponse> {
	return apiFetch<PolicyReportCreateRunResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/runs`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function createUserScopePolicyReportCustomRun(
	userId: string,
	body: PolicyReportCreateCustomRunRequest,
): Promise<PolicyReportCreateCustomRunResponse> {
	return apiFetch<PolicyReportCreateCustomRunResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/runs/custom`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function listUserScopePolicyReportRuns(
	userId: string,
	forwardNetworkId?: string,
	packId?: string,
	status?: string,
	limit?: number,
): Promise<PolicyReportListRunsResponse> {
	const qs = new URLSearchParams();
	if (forwardNetworkId) qs.set("forwardNetworkId", forwardNetworkId);
	if (packId) qs.set("packId", packId);
	if (status) qs.set("status", status);
	if (typeof limit === "number") qs.set("limit", String(limit));
	return apiFetch<PolicyReportListRunsResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/runs?${qs.toString()}`,
	);
}

export async function getUserScopePolicyReportRun(
	userId: string,
	runId: string,
): Promise<PolicyReportGetRunResponse> {
	return apiFetch<PolicyReportGetRunResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/runs/${encodeURIComponent(runId)}`,
	);
}

export async function listUserScopePolicyReportRunFindings(
	userId: string,
	runId: string,
	checkId?: string,
	limit?: number,
): Promise<PolicyReportListRunFindingsResponse> {
	const qs = new URLSearchParams();
	if (checkId) qs.set("checkId", checkId);
	if (typeof limit === "number") qs.set("limit", String(limit));
	const q = qs.toString();
	return apiFetch<PolicyReportListRunFindingsResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/runs/${encodeURIComponent(runId)}/findings${q ? `?${q}` : ""}`,
	);
}

export async function listUserScopePolicyReportFindings(
	userId: string,
	forwardNetworkId?: string,
	checkId?: string,
	status?: string,
	limit?: number,
): Promise<PolicyReportListFindingsResponse> {
	const qs = new URLSearchParams();
	if (forwardNetworkId) qs.set("forwardNetworkId", forwardNetworkId);
	if (checkId) qs.set("checkId", checkId);
	if (status) qs.set("status", status);
	if (typeof limit === "number") qs.set("limit", String(limit));
	return apiFetch<PolicyReportListFindingsResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/findings?${qs.toString()}`,
	);
}

export async function createUserScopePolicyReportException(
	userId: string,
	body: PolicyReportCreateExceptionRequest,
): Promise<PolicyReportException> {
	return apiFetch<PolicyReportException>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/governance/exceptions`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listUserScopePolicyReportExceptions(
	userId: string,
	forwardNetworkId?: string,
	status?: string,
	limit?: number,
): Promise<PolicyReportListExceptionsResponse> {
	const qs = new URLSearchParams();
	if (forwardNetworkId) qs.set("forwardNetworkId", forwardNetworkId);
	if (status) qs.set("status", status);
	if (typeof limit === "number") qs.set("limit", String(limit));
	return apiFetch<PolicyReportListExceptionsResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/governance/exceptions?${qs.toString()}`,
	);
}

export async function approveUserScopePolicyReportException(
	userId: string,
	exceptionId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/governance/exceptions/${encodeURIComponent(exceptionId)}/approve`,
		{ method: "POST", body: "{}" },
	);
}

export async function rejectUserScopePolicyReportException(
	userId: string,
	exceptionId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/governance/exceptions/${encodeURIComponent(exceptionId)}/reject`,
		{ method: "POST", body: "{}" },
	);
}

export async function simulateUserScopePolicyReportChangePlanning(
	userId: string,
	body: PolicyReportChangePlanningRequest,
): Promise<PolicyReportChangePlanningResponse> {
	return apiFetch<PolicyReportChangePlanningResponse>(
		`/api/users/${encodeURIComponent(userId)}/policy-reports/change-planning/simulate`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}
