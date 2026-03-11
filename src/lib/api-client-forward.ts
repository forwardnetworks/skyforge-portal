import type { ISO8601, JSONMap } from "./api-client-user-user-scope";
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
	configured: boolean;
	orgId?: string;
	orgName?: string;
	username?: string;
	email?: string;
	password?: string;
	updatedAt?: ISO8601;
	lastRotatedAt?: ISO8601;
	source?: string;
};

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

export async function listUserForwardCollectorConfigs(): Promise<ListUserForwardCollectorConfigsResponse> {
	return apiFetch<ListUserForwardCollectorConfigsResponse>(
		"/api/forward/collector-configs",
	);
}

export async function getCurrentUserForwardTenantCredential(): Promise<ForwardTenantCredentialResponse> {
	return apiFetch<ForwardTenantCredentialResponse>(
		"/api/forward/tenant-credential",
	);
}

export async function resetCurrentUserForwardTenantCredential(): Promise<ForwardTenantCredentialResponse> {
	return apiFetch<ForwardTenantCredentialResponse>(
		"/api/forward/tenant-credential/reset",
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function createUserForwardCollectorConfig(
	body: CreateUserForwardCollectorConfigRequest,
): Promise<UserForwardCollectorConfigSummary> {
	return apiFetch<UserForwardCollectorConfigSummary>(
		"/api/forward/collector-configs",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteUserForwardCollectorConfig(
	id: string,
): Promise<DeleteUserForwardCollectorConfigResponse> {
	return apiFetch<DeleteUserForwardCollectorConfigResponse>(
		`/api/forward/collector-configs/${encodeURIComponent(id)}`,
		{
			method: "DELETE",
		},
	);
}

export async function getUserForwardCollectorConfigRuntime(
	id: string,
): Promise<CollectorRuntimeStatus> {
	return apiFetch<CollectorRuntimeStatus>(
		`/api/forward/collector-configs/${encodeURIComponent(id)}/runtime`,
	);
}

export type UserCollectorConfigLogsResponse = {
	logs?: string;
};

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
		{
			method: "POST",
			body: "{}",
		},
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
		{
			method: "POST",
			body: "{}",
		},
	);
}

export type UpdateUserScopeSettingsRequest = NonNullable<
	operations["PUT:skyforge.UpdateUserScopeSettings"]["requestBody"]
>["content"]["application/json"];
export type UpdateUserScopeSettingsResponse =
	operations["PUT:skyforge.UpdateUserScopeSettings"]["responses"][200]["content"]["application/json"];
export async function updateUserScopeSettings(
	userId: string,
	body: UpdateUserScopeSettingsRequest,
): Promise<UpdateUserScopeSettingsResponse> {
	return apiFetch<UpdateUserScopeSettingsResponse>(
		`/api/users/${encodeURIComponent(userId)}/settings`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type GetUserScopeForwardConfigResponse =
	operations["GET:skyforge.GetUserScopeForwardConfig"]["responses"][200]["content"]["application/json"];
export async function getUserScopeForwardConfig(
	userId: string,
): Promise<GetUserScopeForwardConfigResponse> {
	return apiFetch<GetUserScopeForwardConfigResponse>(
		`/api/users/${encodeURIComponent(userId)}/integrations/forward`,
	);
}

export type PutUserScopeForwardConfigRequest = NonNullable<
	operations["PUT:skyforge.PutUserScopeForwardConfig"]["requestBody"]
>["content"]["application/json"];
export type PutUserScopeForwardConfigResponse =
	operations["PUT:skyforge.PutUserScopeForwardConfig"]["responses"][200]["content"]["application/json"];
export async function putUserScopeForwardConfig(
	userId: string,
	body: PutUserScopeForwardConfigRequest,
): Promise<PutUserScopeForwardConfigResponse> {
	return apiFetch<PutUserScopeForwardConfigResponse>(
		`/api/users/${encodeURIComponent(userId)}/integrations/forward`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type ListUserScopeForwardCollectorsResponse =
	operations["GET:skyforge.GetUserScopeForwardCollectors"]["responses"][200]["content"]["application/json"];
export async function listUserScopeForwardCollectors(
	userId: string,
): Promise<ListUserScopeForwardCollectorsResponse> {
	return apiFetch<ListUserScopeForwardCollectorsResponse>(
		`/api/users/${encodeURIComponent(userId)}/integrations/forward/collectors`,
	);
}

export type ListUserScopeArtifactsResponse =
	operations["GET:skyforge.ListUserScopeArtifacts"]["responses"][200]["content"]["application/json"];
export async function listUserScopeArtifacts(
	userId: string,
	params?: { prefix?: string; limit?: string },
): Promise<ListUserScopeArtifactsResponse> {
	const qs = new URLSearchParams();
	if (params?.prefix) qs.set("prefix", params.prefix);
	if (params?.limit) qs.set("limit", params.limit);
	const suffix = qs.toString();
	return apiFetch<ListUserScopeArtifactsResponse>(
		`/api/users/${encodeURIComponent(userId)}/artifacts${suffix ? `?${suffix}` : ""}`,
	);
}

export type DownloadUserScopeArtifactResponse =
	operations["GET:skyforge.DownloadUserScopeArtifact"]["responses"][200]["content"]["application/json"];
export async function downloadUserScopeArtifact(
	userId: string,
	key: string,
): Promise<DownloadUserScopeArtifactResponse> {
	const qs = new URLSearchParams({ key });
	return apiFetch<DownloadUserScopeArtifactResponse>(
		`/api/users/${encodeURIComponent(userId)}/artifacts/download?${qs.toString()}`,
	);
}

export async function putUserScopeArtifactObject(
	userId: string,
	body: { key: string; contentBase64: string; contentType?: string },
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/users/${encodeURIComponent(userId)}/artifacts/object`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteUserScopeArtifactObject(
	userId: string,
	key: string,
): Promise<JSONMap> {
	const qs = new URLSearchParams({ key });
	return apiFetch<JSONMap>(
		`/api/users/${encodeURIComponent(userId)}/artifacts/object?${qs.toString()}`,
		{
			method: "DELETE",
		},
	);
}

export async function createUserScopeArtifactFolder(
	userId: string,
	prefix: string,
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/users/${encodeURIComponent(userId)}/artifacts/folder`,
		{
			method: "POST",
			body: JSON.stringify({ prefix }),
		},
	);
}

export type StorageListResponse =
	operations["GET:storage.List"]["responses"][200]["content"]["application/json"];

export async function listStorageFiles(): Promise<StorageListResponse> {
	return apiFetch<StorageListResponse>("/storage.List");
}

export type ListWebhookEventsResponse =
	operations["GET:skyforge.ListWebhookEvents"]["responses"][200]["content"]["application/json"];
export async function listWebhookEvents(params?: {
	limit?: string;
	before_id?: string;
}): Promise<ListWebhookEventsResponse> {
	const qs = new URLSearchParams();
	if (params?.limit) qs.set("limit", params.limit);
	if (params?.before_id) qs.set("before_id", params.before_id);
	const suffix = qs.toString();
	return apiFetch<ListWebhookEventsResponse>(
		`/api/webhooks/events${suffix ? `?${suffix}` : ""}`,
	);
}

export type ListSyslogEventsResponse =
	operations["GET:skyforge.ListSyslogEvents"]["responses"][200]["content"]["application/json"];
export async function listSyslogEvents(params?: {
	limit?: string;
	before_id?: string;
	source_ip?: string;
	unassigned?: string;
}): Promise<ListSyslogEventsResponse> {
	const qs = new URLSearchParams();
	if (params?.limit) qs.set("limit", params.limit);
	if (params?.before_id) qs.set("before_id", params.before_id);
	if (params?.source_ip) qs.set("source_ip", params.source_ip);
	if (params?.unassigned) qs.set("unassigned", params.unassigned);
	const suffix = qs.toString();
	return apiFetch<ListSyslogEventsResponse>(
		`/api/syslog/events${suffix ? `?${suffix}` : ""}`,
	);
}

export type ListSnmpTrapEventsResponse =
	operations["GET:skyforge.ListSnmpTrapEvents"]["responses"][200]["content"]["application/json"];
export async function listSnmpTrapEvents(params?: {
	limit?: string;
	before_id?: string;
}): Promise<ListSnmpTrapEventsResponse> {
	const qs = new URLSearchParams();
	if (params?.limit) qs.set("limit", params.limit);
	if (params?.before_id) qs.set("before_id", params.before_id);
	const suffix = qs.toString();
	return apiFetch<ListSnmpTrapEventsResponse>(
		`/api/snmp/traps/events${suffix ? `?${suffix}` : ""}`,
	);
}

export type NotificationSettingsResponse =
	operations["GET:skyforge.GetNotificationSettings"]["responses"][200]["content"]["application/json"];
export async function getNotificationSettings(): Promise<NotificationSettingsResponse> {
	return apiFetch<NotificationSettingsResponse>(
		"/system/settings/notifications",
	);
}

export type UpdateNotificationSettingsRequest = NonNullable<
	operations["PUT:skyforge.UpdateNotificationSettings"]["requestBody"]
>["content"]["application/json"];
export type UpdateNotificationSettingsResponse =
	operations["PUT:skyforge.UpdateNotificationSettings"]["responses"][200]["content"]["application/json"];
export async function updateNotificationSettings(
	body: UpdateNotificationSettingsRequest,
): Promise<UpdateNotificationSettingsResponse> {
	return apiFetch<UpdateNotificationSettingsResponse>(
		"/system/settings/notifications",
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export type ObservabilityEndpointSummary = {
	endpointKey: string;
	count: number;
	errorCount: number;
	p50Ms: number;
	p95Ms: number;
	p99Ms: number;
	topCause?: string;
};

export type ObservabilityAdvisory = {
	level: "ok" | "warn" | "crit" | string;
	metric: string;
	value: number;
	threshold: number;
	message: string;
};

export type ObservabilitySummaryResponse = {
	generatedAt: ISO8601;
	endpoints: ObservabilityEndpointSummary[];
	queueQueued: number;
	queueRunning: number;
	queueOldestSec: number;
	workerHeartbeatSec: number;
	nodeCpuActiveP95: number;
	nodeMemUsedP95: number;
	advisories?: ObservabilityAdvisory[];
};

export type ObservabilitySeriesPoint = {
	timestamp: ISO8601;
	value: number;
};

export type ObservabilitySeriesResponse = {
	metric: string;
	window: string;
	points: ObservabilitySeriesPoint[];
};

export type ObservabilitySlowRequest = {
	collectedAt: ISO8601;
	endpointKey: string;
	statusCode: number;
	totalMs: number;
	phaseDbMs: number;
	phaseEnrichMs: number;
	queueOldestSec: number;
	workerHeartbeatSec: number;
	causeCode: string;
};

export type ObservabilitySlowRequestsResponse = {
	window: string;
	requests: ObservabilitySlowRequest[];
};

export async function getObservabilitySummary(): Promise<ObservabilitySummaryResponse> {
	return apiFetch<ObservabilitySummaryResponse>(
		"/api/admin/observability/summary",
	);
}

export async function getObservabilitySeries(params: {
	metric: string;
	window?: string;
}): Promise<ObservabilitySeriesResponse> {
	const qs = new URLSearchParams();
	qs.set("metric", params.metric);
	if (params.window) qs.set("window", params.window);
	return apiFetch<ObservabilitySeriesResponse>(
		`/api/admin/observability/series?${qs.toString()}`,
	);
}

export async function getObservabilitySlowRequests(params?: {
	window?: string;
	endpoint?: string;
	limit?: number;
}): Promise<ObservabilitySlowRequestsResponse> {
	const qs = new URLSearchParams();
	if (params?.window) qs.set("window", params.window);
	if (params?.endpoint) qs.set("endpoint", params.endpoint);
	if (typeof params?.limit === "number" && params.limit > 0) {
		qs.set("limit", String(params.limit));
	}
	const suffix = qs.toString();
	return apiFetch<ObservabilitySlowRequestsResponse>(
		`/api/admin/observability/slow-requests${suffix ? `?${suffix}` : ""}`,
	);
}

export type ForwardObservabilitySummary = {
	namespace: string;
	sourceStatus: "ok" | "degraded" | "missing" | string;
	prometheusService: boolean;
	grafanaService: boolean;
	prometheusReachable: boolean;
	prometheusUpSum?: number;
	prometheusTargetCount?: number;
	error?: string;
	checkedAt: ISO8601;
};

export type UserObservabilitySummaryResponse = {
	generatedAt: ISO8601;
	scope: "user" | "admin" | string;
	skyforge: ObservabilitySummaryResponse;
	forward: ForwardObservabilitySummary;
};

export type UserObservabilitySeriesResponse = {
	scope: "user" | "admin" | string;
	metric: string;
	window: string;
	points: ObservabilitySeriesPoint[];
};

export async function getUserObservabilitySummary(): Promise<UserObservabilitySummaryResponse> {
	return apiFetch<UserObservabilitySummaryResponse>(
		"/api/observability/summary",
	);
}

export async function getUserObservabilitySeries(params: {
	metric: string;
	window?: string;
}): Promise<UserObservabilitySeriesResponse> {
	const qs = new URLSearchParams();
	qs.set("metric", params.metric);
	if (params.window) qs.set("window", params.window);
	return apiFetch<UserObservabilitySeriesResponse>(
		`/api/observability/series?${qs.toString()}`,
	);
}
