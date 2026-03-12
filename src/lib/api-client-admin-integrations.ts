import { apiFetch } from "./http";

export type AdminServiceNowGlobalConfigResponse = {
	configured: boolean;
	instanceUrl?: string;
	adminUsername?: string;
	hasAdminPassword: boolean;
	bootstrapCredentialSet?: string;
	updatedAt?: string;
};

export type PutAdminServiceNowGlobalConfigRequest = {
	instanceUrl: string;
	adminUsername: string;
	adminPassword?: string;
	bootstrapCredentialSet?: string;
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

export async function getAdminServiceNowGlobalConfig(): Promise<AdminServiceNowGlobalConfigResponse> {
	return apiFetch<AdminServiceNowGlobalConfigResponse>(
		"/api/admin/integrations/servicenow/global-config",
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
