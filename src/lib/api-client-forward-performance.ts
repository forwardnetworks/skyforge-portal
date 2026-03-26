import { apiFetch } from "./http";

export type ForwardPerformanceSnapshotSummary = {
	id: string;
	name?: string;
	state?: string;
};

export type ForwardPerformanceNetworkSummary = {
	tenantKind?: string;
	id: string;
	userScopeId: string;
	forwardNetworkId: string;
	name: string;
	description?: string;
	collectorConfigId?: string;
	credentialSource?: string;
	latestProcessedSnapshotId?: string;
	latestProcessedSnapshotName?: string;
	latestProcessedSnapshotState?: string;
	processedSnapshots?: ForwardPerformanceSnapshotSummary[];
	defaultGenerationIntervalMins: number;
	defaultHealthyDeviceOdds: number;
	defaultHealthyInterfaceOdds: number;
	status?: string;
	error?: string;
};

export type ForwardPerformanceNetworksResponse = {
	tenantKind?: string;
	userScopeId: string;
	networks: ForwardPerformanceNetworkSummary[];
};

export type ForwardPerformanceGenerateRequest = {
	snapshotId?: string;
	generationIntervalMins?: number;
	healthyDeviceOdds?: number;
	healthyInterfaceOdds?: number;
};

export type ForwardPerformanceGenerateResponse = {
	tenantKind?: string;
	userScopeId: string;
	forwardNetworkId: string;
	snapshotId?: string;
	status: string;
	numDevices?: number;
	numInterfaces?: number;
};

export type ForwardSnapshotDataFileInjectRequest = {
	snapshotId?: string;
	dataFileId?: string;
	pricingSourceUrl?: string;
	dataFileName: string;
	nqeName?: string;
	description?: string;
	storedFileName?: string;
	fileTypeProto?: string;
	schemaFields?: string[];
	content: string;
	snapshotNote?: string;
};

export type ForwardSnapshotDataFileInjectResponse = {
	tenantKind?: string;
	forwardNetworkId: string;
	sourceSnapshotId: string;
	injectedSnapshotId: string;
	dataFileId: string;
	dataFileName: string;
	nqeName: string;
	status: string;
};

export type ManagedForwardTenantKind = "primary" | "demo";

export async function listUserScopeForwardPerformanceNetworks(
	userId: string,
): Promise<ForwardPerformanceNetworksResponse> {
	return apiFetch<ForwardPerformanceNetworksResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-network-performance`,
	);
}

export async function generateUserScopeForwardNetworkPerformance(
	userId: string,
	networkRef: string,
	body: ForwardPerformanceGenerateRequest,
): Promise<ForwardPerformanceGenerateResponse> {
	return apiFetch<ForwardPerformanceGenerateResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-network-performance/${encodeURIComponent(networkRef)}/generate`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

function tenantPerformanceBasePath(tenantKind: ManagedForwardTenantKind): string {
	return tenantKind === "demo"
		? "/api/forward/demo-org/performance-networks"
		: "/api/forward/org/performance-networks";
}

export async function listManagedForwardTenantPerformanceNetworks(
	tenantKind: ManagedForwardTenantKind,
): Promise<ForwardPerformanceNetworksResponse> {
	return apiFetch<ForwardPerformanceNetworksResponse>(
		tenantPerformanceBasePath(tenantKind),
	);
}

export async function generateManagedForwardTenantPerformance(
	tenantKind: ManagedForwardTenantKind,
	networkRef: string,
	body: ForwardPerformanceGenerateRequest,
): Promise<ForwardPerformanceGenerateResponse> {
	return apiFetch<ForwardPerformanceGenerateResponse>(
		`${tenantPerformanceBasePath(tenantKind)}/${encodeURIComponent(networkRef)}/generate`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function injectManagedForwardTenantSnapshotDataFile(
	tenantKind: ManagedForwardTenantKind,
	networkRef: string,
	body: ForwardSnapshotDataFileInjectRequest,
): Promise<ForwardSnapshotDataFileInjectResponse> {
	return apiFetch<ForwardSnapshotDataFileInjectResponse>(
		`${tenantPerformanceBasePath(tenantKind)}/${encodeURIComponent(networkRef)}/inject-data-file`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}
