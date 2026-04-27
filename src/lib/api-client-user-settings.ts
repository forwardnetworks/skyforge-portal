import type { ExternalTemplateRepo, ISO8601 } from "./api-client-user-shared";
import { apiFetch } from "./http";

export type UserGitCredentialsResponse = {
	username: string;
	sshPublicKey: string;
	authorizedSshPublicKey: string;
	hasSshKey: boolean;
	hasAuthorizedSshKey: boolean;
	httpsUsername?: string;
	hasHttpsToken: boolean;
};

export async function getUserGitCredentials(): Promise<UserGitCredentialsResponse> {
	return apiFetch<UserGitCredentialsResponse>("/api/git-credentials");
}

export async function updateUserGitCredentials(payload: {
	httpsUsername?: string;
	httpsToken?: string;
	clearToken?: boolean;
	authorizedSshPublicKey?: string;
}): Promise<UserGitCredentialsResponse> {
	return apiFetch<UserGitCredentialsResponse>("/api/git-credentials", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function rotateUserGitDeployKey(): Promise<UserGitCredentialsResponse> {
	return apiFetch<UserGitCredentialsResponse>("/api/git-credentials/rotate", {
		method: "POST",
		body: "{}",
	});
}

export type UserSettingsResponse = {
	defaultForwardCollectorConfigId?: string;
	defaultEnv?: Array<{ key: string; value: string }>;
	externalTemplateRepos?: ExternalTemplateRepo[];
	uiExperienceMode?: UIExperienceMode;
	updatedAt?: string;
};

export type UIExperienceMode = "simple" | "advanced";

export async function getUserSettings(): Promise<UserSettingsResponse> {
	return apiFetch<UserSettingsResponse>("/api/settings");
}

export async function putUserSettings(payload: {
	defaultForwardCollectorConfigId?: string;
	defaultEnv?: Array<{ key: string; value: string }>;
	externalTemplateRepos?: ExternalTemplateRepo[];
	uiExperienceMode?: UIExperienceMode;
}): Promise<UserSettingsResponse> {
	return apiFetch<UserSettingsResponse>("/api/settings", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export type AwsSsoConfigResponse = {
	configured: boolean;
	startUrl?: string;
	region?: string;
	accountId?: string;
	roleName?: string;
	user: string;
};

export type AwsSsoStatusResponse = {
	configured: boolean;
	status: string;
	connected: boolean;
	reauthRequired?: boolean;
	statusMessage?: string;
	user: string;
	expiresAt?: ISO8601;
	lastAuthenticatedAt?: ISO8601;
};

export type AwsTerraformReadinessResponse = {
	configured: boolean;
	status: string;
	ready: boolean;
	connected: boolean;
	reauthRequired?: boolean;
	missingAccountRole?: boolean;
	statusMessage?: string;
	user: string;
	accountId?: string;
	roleName?: string;
	expiresAt?: ISO8601;
	lastAuthenticatedAt?: ISO8601;
};

export type AwsSsoStartResponse = {
	requestId: string;
	verificationUriComplete: string;
	userCode: string;
	expiresAt: ISO8601;
	intervalSeconds: number;
};

export type AwsSsoPollResponse = {
	status: string;
	connected?: boolean;
	expiresAt?: ISO8601;
	startUrl?: string;
	region?: string;
	user?: string;
};

export type AwsSsoLogoutResponse = {
	status: string;
};

export async function getAwsSsoConfig(): Promise<AwsSsoConfigResponse> {
	return apiFetch<AwsSsoConfigResponse>("/api/aws/sso/config");
}

export async function getAwsSsoStatus(): Promise<AwsSsoStatusResponse> {
	return apiFetch<AwsSsoStatusResponse>("/api/aws/sso/status");
}

export async function getAwsTerraformReadiness(): Promise<AwsTerraformReadinessResponse> {
	return apiFetch<AwsTerraformReadinessResponse>(
		"/api/cloud/aws/terraform-readiness",
	);
}

export async function startAwsSso(): Promise<AwsSsoStartResponse> {
	return apiFetch<AwsSsoStartResponse>("/api/aws/sso/start", {
		method: "POST",
		body: "{}",
	});
}

export async function pollAwsSso(payload: {
	requestId: string;
}): Promise<AwsSsoPollResponse> {
	return apiFetch<AwsSsoPollResponse>("/api/aws/sso/poll", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function logoutAwsSso(): Promise<AwsSsoLogoutResponse> {
	return apiFetch<AwsSsoLogoutResponse>("/api/aws/sso/logout", {
		method: "POST",
		body: "{}",
	});
}

export type UserAWSStaticCredentialsGetResponse = {
	configured: boolean;
	accessKeyLast4?: string;
	updatedAt?: ISO8601;
};

export async function getUserAWSStaticCredentials(): Promise<UserAWSStaticCredentialsGetResponse> {
	return apiFetch<UserAWSStaticCredentialsGetResponse>("/api/cloud/aws-static");
}

export async function putUserAWSStaticCredentials(payload: {
	accessKeyId: string;
	secretAccessKey: string;
}): Promise<UserAWSStaticCredentialsGetResponse> {
	return apiFetch<UserAWSStaticCredentialsGetResponse>(
		"/api/cloud/aws-static",
		{
			method: "PUT",
			body: JSON.stringify(payload),
		},
	);
}

export async function deleteUserAWSStaticCredentials(): Promise<void> {
	await apiFetch<void>("/api/cloud/aws-static", { method: "DELETE" });
}

export type UserAWSSSOCredentialsResponse = {
	configured: boolean;
	startUrl?: string;
	region?: string;
	accountId?: string;
	roleName?: string;
	updatedAt?: ISO8601;
};

export async function getUserAWSSSOCredentials(): Promise<UserAWSSSOCredentialsResponse> {
	return apiFetch<UserAWSSSOCredentialsResponse>("/api/cloud/aws-sso");
}

export async function putUserAWSSSOCredentials(payload: {
	startUrl: string;
	region: string;
	accountId: string;
	roleName: string;
}): Promise<UserAWSSSOCredentialsResponse> {
	return apiFetch<UserAWSSSOCredentialsResponse>("/api/cloud/aws-sso", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserAWSSSOCredentials(): Promise<void> {
	await apiFetch<void>("/api/cloud/aws-sso", { method: "DELETE" });
}

export type UserAzureCredentialsResponse = {
	configured: boolean;
	tenantId?: string;
	clientId?: string;
	subscriptionId?: string;
	hasClientSecret: boolean;
	updatedAt?: ISO8601;
};

export async function getUserAzureCredentials(): Promise<UserAzureCredentialsResponse> {
	return apiFetch<UserAzureCredentialsResponse>("/api/cloud/azure");
}

export async function putUserAzureCredentials(payload: {
	tenantId: string;
	clientId: string;
	clientSecret: string;
	subscriptionId?: string;
}): Promise<UserAzureCredentialsResponse> {
	return apiFetch<UserAzureCredentialsResponse>("/api/cloud/azure", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserAzureCredentials(): Promise<void> {
	await apiFetch<void>("/api/cloud/azure", { method: "DELETE" });
}

export type UserGCPCredentialsResponse = {
	configured: boolean;
	projectId?: string;
	hasServiceAccountJSON: boolean;
	updatedAt?: ISO8601;
};

export async function getUserGCPCredentials(): Promise<UserGCPCredentialsResponse> {
	return apiFetch<UserGCPCredentialsResponse>("/api/cloud/gcp");
}

export async function putUserGCPCredentials(payload: {
	projectId: string;
	serviceAccountJSON: string;
}): Promise<UserGCPCredentialsResponse> {
	return apiFetch<UserGCPCredentialsResponse>("/api/cloud/gcp", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserGCPCredentials(): Promise<void> {
	await apiFetch<void>("/api/cloud/gcp", { method: "DELETE" });
}

export type UserIBMCredentialsResponse = {
	configured: boolean;
	region?: string;
	resourceGroupId?: string;
	hasApiKey: boolean;
	updatedAt?: ISO8601;
};

export async function getUserIBMCredentials(): Promise<UserIBMCredentialsResponse> {
	return apiFetch<UserIBMCredentialsResponse>("/api/cloud/ibm");
}

export async function putUserIBMCredentials(payload: {
	apiKey: string;
	region: string;
	resourceGroupId?: string;
}): Promise<UserIBMCredentialsResponse> {
	return apiFetch<UserIBMCredentialsResponse>("/api/cloud/ibm", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserIBMCredentials(): Promise<void> {
	await apiFetch<void>("/api/cloud/ibm", { method: "DELETE" });
}
