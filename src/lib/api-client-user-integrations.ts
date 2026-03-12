import { apiFetch } from "./http";
import type { ISO8601, ListForwardCollectorsResponse } from "./api-client-user-shared";

export type UserServiceNowConfigResponse = {
	configured: boolean;
	globalConfigured: boolean;
	instanceUrl?: string;
	adminUsername?: string;
	hasAdminPassword: boolean;
	forwardCredentialSetId?: string;
	tenantUsername?: string;
	tenantProvisioned: boolean;
	updatedAt?: ISO8601;
	lastInstallStatus?: string;
	lastInstallError?: string;
	lastInstallStartedAt?: ISO8601;
	lastInstallFinishedAt?: ISO8601;
};

export type PutUserServiceNowConfigRequest = {
	forwardCredentialSetId?: string;
};

export type RotateUserServiceNowTenantResponse = {
	config?: UserServiceNowConfigResponse;
};

export type InstallUserServiceNowDemoResponse = {
	installed: boolean;
	status: string;
	message?: string;
};

export type ConfigureForwardServiceNowTicketingResponse = {
	configured: boolean;
	message?: string;
};

export type ServiceNowPdiStatusResponse = {
	status: string;
	httpStatus?: number;
	detail?: string;
	checkedAt?: ISO8601;
};

export type ServiceNowSchemaStatusResponse = {
	status: "ok" | "missing" | "error" | string;
	missing?: string[];
	detail?: string;
	checkedAt?: ISO8601;
};

export type UserInfobloxStatusResponse = {
	vmName?: string;
	namespace?: string;
	runStrategy?: string;
	printableStatus?: string;
	phase?: string;
	serviceReady?: boolean;
	ready: boolean;
	checkedAt?: ISO8601;
};

export type WakeUserInfobloxResponse = {
	vmName?: string;
	namespace?: string;
	runStrategy?: string;
	printableStatus?: string;
	phase?: string;
	serviceReady?: boolean;
	ready: boolean;
	woken: boolean;
	message?: string;
	checkedAt?: ISO8601;
};

export type ServiceNowSetupStepResult = {
	step: string;
	status: string;
	detail?: string;
	updatedAt?: ISO8601;
};

export type ServiceNowSetupStatusResponse = {
	runId?: string;
	status: string;
	currentStep?: string;
	steps?: ServiceNowSetupStepResult[];
	remediation?: string[];
	lastError?: string;
	ticketingIntegrationSupported?: boolean;
	ticketingCheckedAt?: ISO8601;
	startedAt?: ISO8601;
	updatedAt?: ISO8601;
	finishedAt?: ISO8601;
};

export type UserTeamsConfigResponse = {
	configured: boolean;
	globalConfigured: boolean;
	enabled: boolean;
	displayName?: string;
	callbackUrl?: string;
	teamsUserRef?: string;
	hasOutboundWebhook: boolean;
	forwardCredentialSetId?: string;
	defaultNetworkId?: string;
	updatedAt?: ISO8601;
};

export type PutUserTeamsConfigRequest = {
	enabled: boolean;
	teamsUserRef?: string;
	outboundWebhookUrl?: string;
	forwardCredentialSetId?: string;
	defaultNetworkId?: string;
};

export type UserTeamsTestOutgoingRequest = {
	text?: string;
};

export type UserTeamsTestOutgoingResponse = {
	sent: boolean;
	message?: string;
};

export async function listForwardCollectors(): Promise<ListForwardCollectorsResponse> {
	return apiFetch<ListForwardCollectorsResponse>("/api/forward/collectors");
}

export async function getUserServiceNowConfig(): Promise<UserServiceNowConfigResponse> {
	return apiFetch<UserServiceNowConfigResponse>("/api/integrations/servicenow");
}

export async function putUserServiceNowConfig(
	payload: PutUserServiceNowConfigRequest,
): Promise<UserServiceNowConfigResponse> {
	return apiFetch<UserServiceNowConfigResponse>("/api/integrations/servicenow", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function installUserServiceNowDemo(): Promise<InstallUserServiceNowDemoResponse> {
	return apiFetch<InstallUserServiceNowDemoResponse>(
		"/api/integrations/servicenow/install",
		{ method: "POST", body: "{}" },
	);
}

export async function getUserServiceNowPdiStatus(): Promise<ServiceNowPdiStatusResponse> {
	return apiFetch<ServiceNowPdiStatusResponse>(
		"/api/integrations/servicenow/pdiStatus",
	);
}

export async function getUserServiceNowSchemaStatus(): Promise<ServiceNowSchemaStatusResponse> {
	return apiFetch<ServiceNowSchemaStatusResponse>(
		"/api/integrations/servicenow/schemaStatus",
	);
}

export async function wakeUserServiceNowPdi(): Promise<ServiceNowPdiStatusResponse> {
	return apiFetch<ServiceNowPdiStatusResponse>(
		"/api/integrations/servicenow/wake",
		{ method: "POST", body: "{}" },
	);
}

export async function getUserInfobloxStatus(): Promise<UserInfobloxStatusResponse> {
	return apiFetch<UserInfobloxStatusResponse>("/api/integrations/infoblox/status");
}

export async function wakeUserInfoblox(): Promise<WakeUserInfobloxResponse> {
	return apiFetch<WakeUserInfobloxResponse>("/api/integrations/infoblox/wake", {
		method: "POST",
		body: "{}",
	});
}

export async function configureForwardServiceNowTicketing(): Promise<ConfigureForwardServiceNowTicketingResponse> {
	return apiFetch<ConfigureForwardServiceNowTicketingResponse>(
		"/api/integrations/servicenow/configureForwardTicketing",
		{ method: "POST", body: "{}" },
	);
}

export async function getUserServiceNowSetupStatus(): Promise<ServiceNowSetupStatusResponse> {
	return apiFetch<ServiceNowSetupStatusResponse>(
		"/api/integrations/servicenow/setup/status",
	);
}

export async function startUserServiceNowSetup(payload?: {
	resume?: boolean;
}): Promise<ServiceNowSetupStatusResponse> {
	return apiFetch<ServiceNowSetupStatusResponse>(
		"/api/integrations/servicenow/setup",
		{ method: "POST", body: JSON.stringify(payload ?? {}) },
	);
}

export async function cancelUserServiceNowSetup(): Promise<{
	canceled: boolean;
}> {
	return apiFetch<{ canceled: boolean }>(
		"/api/integrations/servicenow/setup/cancel",
		{ method: "POST", body: "{}" },
	);
}

export async function rotateUserServiceNowTenant(): Promise<RotateUserServiceNowTenantResponse> {
	return apiFetch<RotateUserServiceNowTenantResponse>(
		"/api/integrations/servicenow/tenant/reset",
		{ method: "POST", body: "{}" },
	);
}

export async function getUserTeamsConfig(): Promise<UserTeamsConfigResponse> {
	return apiFetch<UserTeamsConfigResponse>("/api/integrations/teams");
}

export async function putUserTeamsConfig(
	payload: PutUserTeamsConfigRequest,
): Promise<UserTeamsConfigResponse> {
	return apiFetch<UserTeamsConfigResponse>("/api/integrations/teams", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function testUserTeamsOutgoing(
	payload?: UserTeamsTestOutgoingRequest,
): Promise<UserTeamsTestOutgoingResponse> {
	return apiFetch<UserTeamsTestOutgoingResponse>(
		"/api/integrations/teams/test/outgoing",
		{ method: "POST", body: JSON.stringify(payload ?? {}) },
	);
}
