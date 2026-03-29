import type { ISO8601 } from "./api-client-user-user-scope";
import { apiFetch } from "./http";
import type { operations } from "./openapi.gen";

export type CollectorRuntimeStatus = {
	namespace?: string;
	deploymentName?: string;
	podName?: string;
	podPhase?: string;
	ready?: boolean;
	startTime?: ISO8601;
	image?: string;
	imageId?: string;
	remoteDigest?: string;
	updateAvailable?: boolean;
	updateStatus?: string;
	logsCommandHint?: string;
	restartCount?: number;
	lastExitCode?: number;
	lastReason?: string;
	lastFinishedAt?: ISO8601;
};

export type ForwardCollectorInfo = {
	id?: string;
	name?: string;
	username?: string;
	status?: string;
	connected?: boolean;
	connectedAt?: string;
	lastConnectedAt?: string;
	lastSeenAt?: string;
	updatedAt?: string;
	version?: string;
	updateStatus?: string;
	externalIp?: string;
	internalIps?: string[];
};

export type UserForwardCollectorConfigSummary = {
	id: string;
	name: string;
	baseUrl: string;
	skipTlsVerify: boolean;
	username?: string;
	collectorId?: string;
	collectorUsername?: string;
	isDefault: boolean;
	updatedAt?: ISO8601;
	runtime?: CollectorRuntimeStatus;
	forwardCollector?: ForwardCollectorInfo;
	decryptionFailed?: boolean;
};

export type ListUserForwardCollectorConfigsResponse = {
	collectors: UserForwardCollectorConfigSummary[];
};

export type CreateUserForwardCollectorConfigRequest = {
	name: string;
	baseUrl: string;
	skipTlsVerify: boolean;
	username: string;
	password: string;
	setDefault?: boolean;
};

export type DeleteUserForwardCollectorConfigResponse = {
	deleted: boolean;
};

export type ForwardTenantCredentialResponse = {
	tenantKind?: string;
	configured: boolean;
	orgId?: string;
	orgName?: string;
	username?: string;
	email?: string;
	hasPassword?: boolean;
	password?: string;
	updatedAt?: ISO8601;
	lastRotatedAt?: ISO8601;
	source?: string;
};

export type ForwardTenantKind = "primary" | "demo";

export type ForwardTenantFeatureFlags = {
	predictModeling: boolean;
	nqeEspresso: boolean;
	nqeSecurityRulesPanos: boolean;
	topoLayoutVersioning: boolean;
	networkMaps: boolean;
	aiAllowed: boolean;
	predictAiAssist: boolean;
	aiChats: boolean;
};

export type ForwardTenantFeaturesResponse = {
	features: ForwardTenantFeatureFlags;
};

export type PutCurrentUserForwardTenantFeaturesRequest = {
	features: ForwardTenantFeatureFlags;
};

export type RequestCurrentUserForwardTenantRebuildRequest = {
	mode: string;
	reason?: string;
	metadata?: Record<string, string>;
	tenantKind?: ForwardTenantKind;
};
export type ForwardTenantResetRunsResponse =
	operations["GET:skyforge.ListCurrentUserForwardTenantRebuildRuns"]["responses"][200]["content"]["application/json"];
export type ForwardTenantResetRun =
	ForwardTenantResetRunsResponse["runs"][number];

export type UserForwardCollectorConfigUpdateResponse = {
	id: string;
	deploymentName?: string;
	image?: string;
	imageId?: string;
	remoteDigest?: string;
	updateStatus?: string;
	updateAvailable: boolean;
	upgraded?: boolean;
	updatedImage?: string;
	runtime?: CollectorRuntimeStatus;
	collectorNotFound?: boolean;
};

export type UserCollectorConfigLogsResponse = {
	logs?: string;
};

export async function listUserForwardCollectorConfigs(): Promise<ListUserForwardCollectorConfigsResponse> {
	return apiFetch<ListUserForwardCollectorConfigsResponse>(
		"/api/forward/collector-configs",
	);
}

export async function getCurrentUserForwardTenantCredential(): Promise<ForwardTenantCredentialResponse> {
	return apiFetch<ForwardTenantCredentialResponse>(
		"/api/forward/org-credential",
	);
}

export async function getCurrentUserForwardDemoTenantCredential(): Promise<ForwardTenantCredentialResponse> {
	return apiFetch<ForwardTenantCredentialResponse>(
		"/api/forward/demo-org-credential",
	);
}

export async function resetCurrentUserForwardTenantCredential(): Promise<ForwardTenantCredentialResponse> {
	return apiFetch<ForwardTenantCredentialResponse>(
		"/api/forward/org-credential/reset",
		{ method: "POST", body: "{}" },
	);
}

export async function resetCurrentUserForwardDemoTenantCredential(): Promise<ForwardTenantCredentialResponse> {
	return apiFetch<ForwardTenantCredentialResponse>(
		"/api/forward/demo-org-credential/reset",
		{ method: "POST", body: "{}" },
	);
}

export async function revealCurrentUserForwardTenantCredentialPassword(): Promise<ForwardTenantCredentialResponse> {
	return apiFetch<ForwardTenantCredentialResponse>(
		"/api/forward/org-credential/reveal",
		{ method: "POST", body: "{}" },
	);
}

export async function revealCurrentUserForwardDemoTenantCredentialPassword(): Promise<ForwardTenantCredentialResponse> {
	return apiFetch<ForwardTenantCredentialResponse>(
		"/api/forward/demo-org-credential/reveal",
		{ method: "POST", body: "{}" },
	);
}

export async function getCurrentUserForwardTenantFeatures(): Promise<ForwardTenantFeaturesResponse> {
	return apiFetch<ForwardTenantFeaturesResponse>("/api/forward/org-features");
}

export async function putCurrentUserForwardTenantFeatures(
	body: PutCurrentUserForwardTenantFeaturesRequest,
): Promise<ForwardTenantFeaturesResponse> {
	return apiFetch<ForwardTenantFeaturesResponse>("/api/forward/org-features", {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export async function requestCurrentUserForwardTenantRebuild(
	body: RequestCurrentUserForwardTenantRebuildRequest,
): Promise<ForwardTenantResetRun> {
	return apiFetch<ForwardTenantResetRun>("/api/forward/org/rebuild", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function requestCurrentUserForwardDemoTenantRebuild(
	body: RequestCurrentUserForwardTenantRebuildRequest,
): Promise<ForwardTenantResetRun> {
	return apiFetch<ForwardTenantResetRun>("/api/forward/demo-org/rebuild", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function listCurrentUserForwardTenantRebuildRuns(): Promise<ForwardTenantResetRunsResponse> {
	return apiFetch<ForwardTenantResetRunsResponse>(
		"/api/forward/org/rebuild/runs",
	);
}

export async function listCurrentUserForwardDemoTenantRebuildRuns(): Promise<ForwardTenantResetRunsResponse> {
	return apiFetch<ForwardTenantResetRunsResponse>(
		"/api/forward/demo-org/rebuild/runs",
	);
}

export async function createUserForwardCollectorConfig(
	body: CreateUserForwardCollectorConfigRequest,
): Promise<UserForwardCollectorConfigSummary> {
	return apiFetch<UserForwardCollectorConfigSummary>(
		"/api/forward/collector-configs",
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function deleteUserForwardCollectorConfig(
	id: string,
): Promise<DeleteUserForwardCollectorConfigResponse> {
	return apiFetch<DeleteUserForwardCollectorConfigResponse>(
		`/api/forward/collector-configs/${encodeURIComponent(id)}`,
		{ method: "DELETE" },
	);
}

export async function getUserForwardCollectorConfigRuntime(
	id: string,
): Promise<CollectorRuntimeStatus> {
	return apiFetch<CollectorRuntimeStatus>(
		`/api/forward/collector-configs/${encodeURIComponent(id)}/runtime`,
	);
}

export async function getUserForwardCollectorConfigLogs(
	id: string,
	tail?: number,
): Promise<UserCollectorConfigLogsResponse> {
	const qs = new URLSearchParams();
	if (tail && tail > 0) qs.set("tail", String(tail));
	const suffix = qs.toString();
	return apiFetch<UserCollectorConfigLogsResponse>(
		`/api/forward/collector-configs/${encodeURIComponent(id)}/logs${suffix ? `?${suffix}` : ""}`,
	);
}

export async function restartUserForwardCollectorConfig(
	id: string,
): Promise<CollectorRuntimeStatus> {
	return apiFetch<CollectorRuntimeStatus>(
		`/api/forward/collector-configs/${encodeURIComponent(id)}/restart`,
		{ method: "POST", body: "{}" },
	);
}

export async function getUserForwardCollectorConfigUpdate(
	id: string,
): Promise<UserForwardCollectorConfigUpdateResponse> {
	return apiFetch<UserForwardCollectorConfigUpdateResponse>(
		`/api/forward/collector-configs/${encodeURIComponent(id)}/update`,
	);
}

export async function upgradeUserForwardCollectorConfig(
	id: string,
): Promise<UserForwardCollectorConfigUpdateResponse> {
	return apiFetch<UserForwardCollectorConfigUpdateResponse>(
		`/api/forward/collector-configs/${encodeURIComponent(id)}/upgrade`,
		{ method: "POST", body: "{}" },
	);
}
