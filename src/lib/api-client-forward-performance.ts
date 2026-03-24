import { apiFetch } from "./http";

export type ForwardPerformanceNetworkSummary = {
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
	defaultGenerationIntervalMins: number;
	defaultHealthyDeviceOdds: number;
	defaultHealthyInterfaceOdds: number;
	status?: string;
	error?: string;
};

export type ForwardPerformanceNetworksResponse = {
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
	userScopeId: string;
	forwardNetworkId: string;
	snapshotId?: string;
	status: string;
	numDevices?: number;
	numInterfaces?: number;
};

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
