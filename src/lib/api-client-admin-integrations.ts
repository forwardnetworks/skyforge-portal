import { apiFetch } from "./http";

export type AdminServiceNowGlobalConfigResponse = {
	configured: boolean;
	instanceUrl?: string;
	adminUsername?: string;
	hasAdminPassword: boolean;
	updatedAt?: string;
};

export type PutAdminServiceNowGlobalConfigRequest = {
	instanceUrl: string;
	adminUsername: string;
	adminPassword?: string;
};

export type AdminServiceNowPushForwardConfigResponse = {
	configured: boolean;
	message?: string;
	updatedAt?: string;
};

export type AdminTeamsGlobalConfigResponse = {
	configured: boolean;
	enabled: boolean;
	displayName?: string;
	publicBaseUrl?: string;
	callbackUrl?: string;
	hasInboundSharedSecret: boolean;
	updatedAt?: string;
};

export type PutAdminTeamsGlobalConfigRequest = {
	enabled: boolean;
	displayName?: string;
	publicBaseUrl: string;
	inboundSharedSecret?: string;
};

export type AdminTeamsTestOutgoingRequest = {
	webhookUrl: string;
	text?: string;
};

export type AdminTeamsTestOutgoingResponse = {
	sent: boolean;
	message?: string;
};

export type AdminForwardSupportCredentialResponse = {
	configured: boolean;
	username?: string;
	hasPassword: boolean;
	password?: string;
	source?: string;
};

export type AdminForwardCustomerBannerReconcileResponse = {
	tenantKind: "customer";
	networkCount: number;
	processedUsers: number;
	succeededUsers: number;
	skippedUsers: number;
	failedUsers: number;
	failedUsernames?: string[];
	requestedBy?: string;
};

export type AdminForwardDemoSeedItem = {
	id: string;
	note: string;
	fileName: string;
	assetPath: string;
	enabled: boolean;
	repeatCount: number;
	order: number;
};

export type AdminForwardDemoSeedCatalogResponse = {
	configured: boolean;
	source: string;
	repo?: string;
	branch?: string;
	manifestPath?: string;
	manifestValid: boolean;
	manifestError?: string;
	retrievedAt?: string;
	lastCommitSha?: string;
	networkName?: string;
	seeds: AdminForwardDemoSeedItem[];
};

export type PutAdminForwardDemoSeedRequest = {
	note: string;
	networkName?: string;
	fileName: string;
	contentBase64: string;
	enabled?: boolean;
};

export type UpdateAdminForwardDemoSeedRequest = {
	note?: string;
	enabled?: boolean;
	repeatCount?: number;
	order?: number;
};

export type UpdateAdminForwardDemoSeedConfigRequest = {
	networkName: string;
};

export async function getAdminServiceNowGlobalConfig(): Promise<AdminServiceNowGlobalConfigResponse> {
	return apiFetch<AdminServiceNowGlobalConfigResponse>(
		"/api/admin/integrations/servicenow/global-config",
	);
}

export async function getAdminForwardDemoSeedCatalog(): Promise<AdminForwardDemoSeedCatalogResponse> {
	return apiFetch<AdminForwardDemoSeedCatalogResponse>(
		"/api/admin/integrations/forward/demo-seeds",
	);
}

export async function putAdminForwardDemoSeed(
	body: PutAdminForwardDemoSeedRequest,
): Promise<AdminForwardDemoSeedCatalogResponse> {
	return apiFetch<AdminForwardDemoSeedCatalogResponse>(
		"/api/admin/integrations/forward/demo-seeds",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function patchAdminForwardDemoSeed(
	seedID: string,
	body: UpdateAdminForwardDemoSeedRequest,
): Promise<AdminForwardDemoSeedCatalogResponse> {
	return apiFetch<AdminForwardDemoSeedCatalogResponse>(
		`/api/admin/integrations/forward/demo-seeds/${encodeURIComponent(seedID)}`,
		{
			method: "PATCH",
			body: JSON.stringify(body),
		},
	);
}

export async function patchAdminForwardDemoSeedConfig(
	body: UpdateAdminForwardDemoSeedConfigRequest,
): Promise<AdminForwardDemoSeedCatalogResponse> {
	return apiFetch<AdminForwardDemoSeedCatalogResponse>(
		"/api/admin/integrations/forward/demo-seed-config",
		{
			method: "PATCH",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteAdminForwardDemoSeed(
	seedID: string,
): Promise<AdminForwardDemoSeedCatalogResponse> {
	return apiFetch<AdminForwardDemoSeedCatalogResponse>(
		`/api/admin/integrations/forward/demo-seeds/${encodeURIComponent(seedID)}`,
		{
			method: "DELETE",
		},
	);
}

export async function putAdminServiceNowGlobalConfig(
	body: PutAdminServiceNowGlobalConfigRequest,
): Promise<AdminServiceNowGlobalConfigResponse> {
	return apiFetch<AdminServiceNowGlobalConfigResponse>(
		"/api/admin/integrations/servicenow/global-config",
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function pushAdminServiceNowForwardConfig(): Promise<AdminServiceNowPushForwardConfigResponse> {
	return apiFetch<AdminServiceNowPushForwardConfigResponse>(
		"/api/admin/integrations/servicenow/push-forward-config",
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function getAdminTeamsGlobalConfig(): Promise<AdminTeamsGlobalConfigResponse> {
	return apiFetch<AdminTeamsGlobalConfigResponse>(
		"/api/admin/integrations/teams/global-config",
	);
}

export async function putAdminTeamsGlobalConfig(
	body: PutAdminTeamsGlobalConfigRequest,
): Promise<AdminTeamsGlobalConfigResponse> {
	return apiFetch<AdminTeamsGlobalConfigResponse>(
		"/api/admin/integrations/teams/global-config",
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function testAdminTeamsOutgoing(
	body: AdminTeamsTestOutgoingRequest,
): Promise<AdminTeamsTestOutgoingResponse> {
	return apiFetch<AdminTeamsTestOutgoingResponse>(
		"/api/admin/integrations/teams/test/outgoing",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function getAdminForwardSupportCredential(): Promise<AdminForwardSupportCredentialResponse> {
	return apiFetch<AdminForwardSupportCredentialResponse>(
		"/api/admin/integrations/forward/support-credential",
	);
}

export async function revealAdminForwardSupportCredentialPassword(): Promise<AdminForwardSupportCredentialResponse> {
	return apiFetch<AdminForwardSupportCredentialResponse>(
		"/api/admin/integrations/forward/support-credential/reveal",
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function reconcileAdminForwardCustomerBannerAllUsers(): Promise<AdminForwardCustomerBannerReconcileResponse> {
	return apiFetch<AdminForwardCustomerBannerReconcileResponse>(
		"/api/admin/integrations/forward/customer-banner/reconcile",
		{
			method: "POST",
			body: "{}",
		},
	);
}
