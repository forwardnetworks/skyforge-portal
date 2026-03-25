import { apiFetch } from "./http";

export type ForwardNetworkDecisionResponse = {
	ok: boolean;
};

export type ForwardAnalyticsNetwork = {
	id: string;
	userScopeId: string;
	forwardNetwork: string;
	name: string;
	description?: string;
	collectorConfigId?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
};

export type ForwardAnalyticsCreateNetworkRequest = {
	forwardNetwork: string;
	name: string;
	description?: string;
	collectorConfigId?: string;
};

export type ForwardAnalyticsListNetworksResponse = {
	networks: ForwardAnalyticsNetwork[];
};

export type ForwardAnalyticsAvailableNetwork = {
	id: string;
	name: string;
};

export type ForwardAnalyticsAvailableNetworksResponse = {
	collectorConfigId?: string;
	credentialSource?: string;
	networks: ForwardAnalyticsAvailableNetwork[];
};

// Saved Forward analytics networks used by capacity tooling and Teams bindings.

export async function createUserScopeForwardNetwork(
	userId: string,
	body: ForwardAnalyticsCreateNetworkRequest,
): Promise<ForwardAnalyticsNetwork> {
	return apiFetch<ForwardAnalyticsNetwork>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listUserScopeForwardNetworks(
	userId: string,
): Promise<ForwardAnalyticsListNetworksResponse> {
	return apiFetch<ForwardAnalyticsListNetworksResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks`,
	);
}

export async function listUserScopeForwardAvailableNetworks(
	userId: string,
	collectorConfigId?: string,
): Promise<ForwardAnalyticsAvailableNetworksResponse> {
	const qs = new URLSearchParams();
	if (collectorConfigId?.trim()) {
		qs.set("collectorConfigId", collectorConfigId.trim());
	}
	const suffix = qs.toString();
	return apiFetch<ForwardAnalyticsAvailableNetworksResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-network-options${suffix ? `?${suffix}` : ""}`,
	);
}

export async function deleteUserScopeForwardNetwork(
	userId: string,
	networkRef: string,
): Promise<ForwardNetworkDecisionResponse> {
	return apiFetch<ForwardNetworkDecisionResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}`,
		{ method: "DELETE" },
	);
}
