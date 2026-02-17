import { apiFetch } from "./http";
import type { components, operations } from "./openapi.gen";
import {
	SKYFORGE_API,
	SKYFORGE_PROXY_ROOT,
	buildLoginUrl,
} from "./skyforge-config";

export type ISO8601 = string;

export type JSONValue =
	| null
	| boolean
	| number
	| string
	| JSONValue[]
	| { [key: string]: JSONValue };
export type JSONMap = Record<string, JSONValue>;

export type ExternalTemplateRepo =
	components["schemas"]["skyforge.ExternalTemplateRepo"];
export type SkyforgeUserContext = {
	id: string;
	slug: string;
	name: string;
	description?: string;
	createdAt?: ISO8601;
	createdBy?: string;
	isPublic?: boolean;
	[key: string]: unknown;
};
export type NotificationRecord =
	components["schemas"]["skyforge.NotificationRecord"];

export type UserServiceNowConfigResponse = {
	configured: boolean;
	instanceUrl?: string;
	adminUsername?: string;
	hasAdminPassword: boolean;
	forwardCollectorConfigId?: string;
	forwardCredentialId?: string;
	forwardUsername?: string;
	hasForwardPassword: boolean;
	updatedAt?: ISO8601;
	lastInstallStatus?: string;
	lastInstallError?: string;
	lastInstallStartedAt?: ISO8601;
	lastInstallFinishedAt?: ISO8601;
};

export type PutUserServiceNowConfigRequest = {
	instanceUrl: string;
	adminUsername: string;
	adminPassword: string;
	forwardCollectorConfigId?: string;
	forwardCredentialId?: string;
	forwardUsername?: string;
	forwardPassword?: string;
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

// NOTE: OpenAPI schema may lag behind the live dashboard/deployment view (e.g. activeTaskId/queueDepth).
// This type reflects the fields Skyforge currently emits in the dashboard snapshot and related APIs.
export type UserContextDeployment = {
	id: string;
	userContextId: string;
	name: string;
	type:
		| "terraform"
		| "netlab"
		| "netlab-c9s"
		| "eve_ng"
		| "containerlab"
		| "clabernetes"
		| string;
	config: JSONMap;
	createdBy?: string;
	createdAt?: ISO8601;
	updatedAt?: ISO8601;
	lastTaskUserContextId?: number;
	lastTaskId?: number;
	lastStatus?: string;
	lastStartedAt?: ISO8601;
	lastFinishedAt?: ISO8601;
	activeTaskId?: number;
	activeTaskStatus?: string;
	queueDepth?: number;
};

export type DeploymentTopology = {
	generatedAt: ISO8601;
	source: string;
	artifactKey?: string;
	nodes: Array<{
		id: string;
		label: string;
		kind?: string;
		mgmtIp?: string; // pod IP (ping/debug)
		mgmtHost?: string; // service DNS (SSH/HTTPS/SNMP)
		pingIp?: string;
		status?: string;
	}>;
	edges: Array<{
		id: string;
		source: string;
		target: string;
		sourceIf?: string;
		targetIf?: string;
		label?: string;
	}>;
};

export type LinkImpairmentRequest = {
	edgeId: string;
	action: "set" | "clear";
	delayMs?: number;
	jitterMs?: number;
	lossPct?: number;
	dupPct?: number;
	corruptPct?: number;
	reorderPct?: number;
	rateKbps?: number;
};

export type LinkImpairmentResponse = {
	appliedAt: ISO8601;
	edge: DeploymentTopology["edges"][number];
	results: Array<{
		node: string;
		namespace: string;
		pod: string;
		container: string;
		ifName: string;
		command: string;
		stdout?: string;
		stderr?: string;
		error?: string;
	}>;
};

export type LinkAdminRequest = {
	edgeId: string;
	action: "up" | "down";
};

export type LinkAdminResponse = {
	appliedAt: ISO8601;
	action: string;
	edgeId: string;
	results: Array<{
		node: string;
		namespace: string;
		pod: string;
		container: string;
		ifName: string;
		command: string;
		stdout?: string;
		stderr?: string;
		error?: string;
	}>;
};

export type LinkCaptureRequest = {
	edgeId: string;
	side?: "source" | "target";
	durationSeconds?: number;
	maxPackets?: number;
	snaplen?: number;
	maxBytes?: number;
};

export type LinkCaptureResponse = {
	capturedAt: ISO8601;
	edgeId: string;
	side: string;
	node: string;
	ifName: string;
	artifactKey: string;
	sizeBytes: number;
	stderr?: string;
};

export type DeploymentNodeInterfacesResponse = {
	namespace?: string;
	podName?: string;
	node?: string;
	generatedAt?: ISO8601;
	interfaces: Array<{
		ifName: string;
		operState?: string;
		rxBytes?: number;
		txBytes?: number;
		rxPackets?: number;
		txPackets?: number;
		rxDropped?: number;
		txDropped?: number;
		peerNode?: string;
		peerIf?: string;
		edgeId?: string;
	}>;
};

export type DeploymentInventoryResponse = {
	generatedAt: ISO8601;
	userContextId: string;
	deploymentId: string;
	format: string;
	nodes?: Array<{
		id: string;
		kind?: string;
		mgmtIp?: string;
		sshPort?: number;
	}>;
	csv?: string;
};

export type DeploymentUIEvent = {
	id: number;
	createdAt: ISO8601;
	createdBy?: string;
	eventType: string;
	payload?: unknown;
};

export type DeploymentUIEventsResponse = {
	userContextId: string;
	deploymentId: string;
	events: DeploymentUIEvent[];
};

export type ForwardCollectorSummary = {
	id: string;
	name: string;
	username: string;
};

export type ListForwardCollectorsResponse = {
	collectors: ForwardCollectorSummary[];
};

// Dashboard snapshot is delivered via SSE (`/api/dashboard/events`) and is not described in OpenAPI.
export type DashboardSnapshot = {
	refreshedAt: ISO8601;
	userContexts?: SkyforgeUserContext[];
	deployments: UserContextDeployment[];
	runs: JSONMap[];
	templatesIndexUpdatedAt?: ISO8601;
	awsSsoStatus?: {
		configured: boolean;
		connected: boolean;
		expiresAt?: ISO8601;
		lastAuthenticatedAt?: ISO8601;
	};
};

export { buildLoginUrl, SKYFORGE_API, SKYFORGE_PROXY_ROOT };

export type SessionResponseEnvelope =
	operations["GET:skyforge.Session"]["responses"][200]["content"]["application/json"] & {
		authProvider?: string;
	};

export async function getSession(): Promise<SessionResponseEnvelope> {
	return apiFetch<SessionResponseEnvelope>("/api/session");
}

export async function logout(): Promise<void> {
	const resp = await fetch(`${SKYFORGE_PROXY_ROOT}/auth/logout`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: "{}",
	});
	if (!resp.ok) {
		const text = await resp.text().catch(() => "");
		throw new Error(`logout failed (${resp.status}): ${text}`);
	}
}

export type GetUserContextsResponse = {
	userContexts: SkyforgeUserContext[];
};

export function extractUserContexts(
	payload:
		| {
				userContexts?: SkyforgeUserContext[];
		  }
		| null
		| undefined,
): SkyforgeUserContext[] {
	if (Array.isArray(payload?.userContexts)) return payload.userContexts;
	return [];
}

export async function getUserContexts(): Promise<GetUserContextsResponse> {
	const payload = await apiFetch<{
		userContexts?: SkyforgeUserContext[];
	}>("/api/user-contexts");
	return { userContexts: extractUserContexts(payload) };
}

export function toUserContextId(
	payload:
		| {
				userContextId?: unknown;
		  }
		| null
		| undefined,
): string {
	return String(payload?.userContextId ?? "").trim();
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
	return apiFetch<DashboardSnapshot>("/api/dashboard/snapshot");
}

export type GetUserNotificationsResponse =
	operations["GET:skyforge.GetUserNotifications"]["responses"][200]["content"]["application/json"];
export async function getUserNotifications(
	userID: string,
	params?: { include_read?: string; limit?: string },
): Promise<GetUserNotificationsResponse> {
	const qs = new URLSearchParams();
	if (params?.include_read) qs.set("include_read", params.include_read);
	if (params?.limit) qs.set("limit", params.limit);
	const suffix = qs.toString();
	return apiFetch<GetUserNotificationsResponse>(
		`/notifications/for-user/${encodeURIComponent(userID)}${suffix ? `?${suffix}` : ""}`,
	);
}

export type MarkAllNotificationsAsReadResponse =
	operations["PUT:skyforge.MarkAllNotificationsAsRead"]["responses"][200]["content"]["application/json"];
export async function markAllNotificationsAsRead(
	userID: string,
): Promise<MarkAllNotificationsAsReadResponse> {
	return apiFetch<MarkAllNotificationsAsReadResponse>(
		`/notifications/for-user/${encodeURIComponent(userID)}/read-all`,
		{ method: "PUT" },
	);
}

export type MarkNotificationAsReadResponse =
	operations["PUT:skyforge.MarkNotificationAsRead"]["responses"][200]["content"]["application/json"];
export async function markNotificationAsRead(
	id: string,
): Promise<MarkNotificationAsReadResponse> {
	return apiFetch<MarkNotificationAsReadResponse>(
		`/notifications/single/${encodeURIComponent(id)}/read`,
		{ method: "PUT" },
	);
}

export type DeleteNotificationResponse =
	operations["DELETE:skyforge.DeleteNotification"]["responses"][200]["content"]["application/json"];
export async function deleteNotification(
	id: string,
): Promise<DeleteNotificationResponse> {
	return apiFetch<DeleteNotificationResponse>(
		`/notifications/single/${encodeURIComponent(id)}`,
		{ method: "DELETE" },
	);
}

export type EveLabSummary = {
	name: string;
	path: string;
	folder?: string;
	mtime?: string;
	umtime?: number;
	shared?: number;
	lock?: boolean;
};

export type EveFolderInfo = {
	name: string;
	path: string;
	mtime?: string;
};

export type UserContextEveLabsResponse = {
	userContextId: string;
	server: string;
	labs: EveLabSummary[];
	folders?: EveFolderInfo[];
};

export type UserContextEveImportRequest = {
	server?: string;
	labPath: string;
	deploymentName?: string;
};

export type UserContextEveConvertRequest = {
	server?: string;
	labPath: string;
	outputDir?: string;
	outputFile?: string;
	createDeployment?: boolean;
	containerlabServer?: string;
};

export type UserContextEveConvertResponse = {
	userContextId: string;
	path: string;
	deployment?: UserContextDeployment;
	warnings?: string[];
};

export async function listUserContextEveLabs(
	userContextId: string,
	params?: { server?: string; path?: string; recursive?: boolean },
): Promise<UserContextEveLabsResponse> {
	const qs = new URLSearchParams();
	if (params?.server) qs.set("server", params.server);
	if (params?.path) qs.set("path", params.path);
	if (params?.recursive) qs.set("recursive", "true");
	const suffix = qs.toString();
	return apiFetch<UserContextEveLabsResponse>(
		`/api/personal/eve/labs${suffix ? `?${suffix}` : ""}`,
	);
}

export async function importUserContextEveLab(
	userContextId: string,
	payload: UserContextEveImportRequest,
): Promise<UserContextDeployment> {
	return apiFetch<UserContextDeployment>(`/api/personal/eve/import`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function convertUserContextEveLab(
	userContextId: string,
	payload: UserContextEveConvertRequest,
): Promise<UserContextEveConvertResponse> {
	return apiFetch<UserContextEveConvertResponse>(`/api/personal/eve/convert`, {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export async function listForwardCollectors(): Promise<ListForwardCollectorsResponse> {
	return apiFetch<ListForwardCollectorsResponse>("/api/forward/collectors");
}

export async function getUserServiceNowConfig(): Promise<UserServiceNowConfigResponse> {
	return apiFetch<UserServiceNowConfigResponse>(
		"/api/personal/integrations/servicenow",
	);
}

export async function putUserServiceNowConfig(
	payload: PutUserServiceNowConfigRequest,
): Promise<UserServiceNowConfigResponse> {
	return apiFetch<UserServiceNowConfigResponse>(
		"/api/personal/integrations/servicenow",
		{
			method: "PUT",
			body: JSON.stringify(payload),
		},
	);
}

export async function installUserServiceNowDemo(): Promise<InstallUserServiceNowDemoResponse> {
	return apiFetch<InstallUserServiceNowDemoResponse>(
		"/api/personal/integrations/servicenow/install",
		{ method: "POST", body: "{}" },
	);
}

export async function getUserServiceNowPdiStatus(): Promise<ServiceNowPdiStatusResponse> {
	return apiFetch<ServiceNowPdiStatusResponse>(
		"/api/personal/integrations/servicenow/pdiStatus",
	);
}

export async function getUserServiceNowSchemaStatus(): Promise<ServiceNowSchemaStatusResponse> {
	return apiFetch<ServiceNowSchemaStatusResponse>(
		"/api/personal/integrations/servicenow/schemaStatus",
	);
}

export async function wakeUserServiceNowPdi(): Promise<ServiceNowPdiStatusResponse> {
	return apiFetch<ServiceNowPdiStatusResponse>(
		"/api/personal/integrations/servicenow/wake",
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function configureForwardServiceNowTicketing(): Promise<ConfigureForwardServiceNowTicketingResponse> {
	return apiFetch<ConfigureForwardServiceNowTicketingResponse>(
		"/api/personal/integrations/servicenow/configureForwardTicketing",
		{ method: "POST", body: "{}" },
	);
}

export type UserElasticConfigResponse = {
	enabled: boolean;
	configured: boolean;
	url?: string;
	indexPrefix?: string;
	authType?: "none" | "api_key" | "basic" | string;
	hasApiKey: boolean;
	basicUsername?: string;
	hasBasicPassword: boolean;
	verifyTls: boolean;
	updatedAt?: string;
	defaultUrl?: string;
	defaultIndexPrefix?: string;
};

export type PutUserElasticConfigRequest = {
	url: string;
	indexPrefix: string;
	authType: "none" | "api_key" | "basic";
	apiKey: string;
	basicUsername: string;
	basicPassword: string;
	verifyTls?: boolean;
};

export type UserElasticTestResponse = {
	status: "ok" | "error" | string;
	detail?: string;
	checkedAt?: string;
};

export async function getUserElasticConfig(): Promise<UserElasticConfigResponse> {
	return apiFetch<UserElasticConfigResponse>(
		"/api/personal/integrations/elastic",
	);
}

export async function putUserElasticConfig(
	payload: PutUserElasticConfigRequest,
): Promise<UserElasticConfigResponse> {
	return apiFetch<UserElasticConfigResponse>(
		"/api/personal/integrations/elastic",
		{
			method: "PUT",
			body: JSON.stringify(payload),
		},
	);
}

export async function clearUserElasticConfig(): Promise<void> {
	await apiFetch<void>("/api/personal/integrations/elastic/clear", {
		method: "POST",
		body: "{}",
	});
}

export async function testUserElasticConfig(): Promise<UserElasticTestResponse> {
	return apiFetch<UserElasticTestResponse>(
		"/api/personal/integrations/elastic/test",
		{
			method: "POST",
			body: "{}",
		},
	);
}

// Legacy endpoints used by the labs/designer UI. These are deterministic validators/autofixers
// and do not call any AI provider.
export type UserAIValidateRequest = {
	kind: "netlab" | "containerlab";
	content: string;
	environment?: Record<string, unknown>;
	setOverrides?: string[];
};

export type UserAIValidateResponse = {
	userContextId: string;
	task: {
		id?: number;
		ok?: boolean;
		errors?: unknown;
	} & Record<string, unknown>;
};

export async function validateUserAITemplate(
	payload: UserAIValidateRequest,
): Promise<UserAIValidateResponse> {
	return apiFetch<UserAIValidateResponse>("/api/personal/ai/validate", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export type UserAIAutofixRequest = {
	kind: "containerlab";
	content: string;
	maxIterations?: number;
};

export type UserAIAutofixResponse = {
	kind: string;
	content: string;
	ok: boolean;
	errors?: string[];
	iterations: number;
	warnings?: string[];
	lastValidated: string;
};

export async function autofixUserAITemplate(
	payload: UserAIAutofixRequest,
): Promise<UserAIAutofixResponse> {
	return apiFetch<UserAIAutofixResponse>("/api/personal/ai/autofix", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export type ElasticToolServiceStatus = {
	id: "elasticsearch" | "kibana" | string;
	kind: "statefulset" | "deployment" | string;
	desiredReplicas: number;
	availableReplicas: number;
};

export type ElasticToolsStatusResponse = {
	enabled: boolean;
	autosleepEnabled: boolean;
	idleMinutes: number;
	now: string;
	lastActivityAt?: string;
	services: ElasticToolServiceStatus[];
};

export async function getElasticToolsStatus(): Promise<ElasticToolsStatusResponse> {
	return apiFetch<ElasticToolsStatusResponse>(
		"/api/system/elastic/tools/status",
	);
}

export async function wakeElasticTools(): Promise<{
	status: ElasticToolsStatusResponse;
}> {
	return apiFetch<{ status: ElasticToolsStatusResponse }>(
		"/api/system/elastic/tools/wake",
		{
			method: "POST",
			body: "{}",
		},
	);
}

export type UserGitCredentialsResponse = {
	username: string;
	sshPublicKey: string;
	hasSshKey: boolean;
	httpsUsername?: string;
	hasHttpsToken: boolean;
};

export async function getUserGitCredentials(): Promise<UserGitCredentialsResponse> {
	return apiFetch<UserGitCredentialsResponse>("/api/personal/git-credentials");
}

export async function updateUserGitCredentials(payload: {
	httpsUsername?: string;
	httpsToken?: string;
	clearToken?: boolean;
}): Promise<UserGitCredentialsResponse> {
	return apiFetch<UserGitCredentialsResponse>("/api/personal/git-credentials", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function rotateUserGitDeployKey(): Promise<UserGitCredentialsResponse> {
	return apiFetch<UserGitCredentialsResponse>(
		"/api/personal/git-credentials/rotate",
		{
			method: "POST",
			body: "{}",
		},
	);
}

export type UserSettingsResponse = {
	defaultForwardCollectorConfigId?: string;
	defaultForwardCredentialId?: string;
	defaultForwardNetworkId?: string;
	defaultEnv?: Array<{ key: string; value: string }>;
	externalTemplateRepos?: ExternalTemplateRepo[];
	updatedAt?: string;
};

export async function getUserSettings(): Promise<UserSettingsResponse> {
	return apiFetch<UserSettingsResponse>("/api/personal/settings");
}

export async function putUserSettings(payload: {
	defaultForwardCollectorConfigId?: string;
	defaultForwardCredentialId?: string;
	defaultForwardNetworkId?: string;
	defaultEnv?: Array<{ key: string; value: string }>;
	externalTemplateRepos?: ExternalTemplateRepo[];
}): Promise<UserSettingsResponse> {
	return apiFetch<UserSettingsResponse>("/api/personal/settings", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export type ListForwardNetworksResponse = {
	networks: Array<{ id: string; name?: string }>;
};

export type ForwardOnPremRBACStatus = {
	canGetDeployments: boolean;
	canPatchDeployments: boolean;
	canGetStatefulSets: boolean;
	canPatchStatefulSets: boolean;
};

export type ForwardOnPremWorkloadStatus = {
	kind: string;
	name: string;
	optional: boolean;
	desired: number;
	ready: number;
	available: number;
	error?: string;
};

export type ForwardOnPremStatusResponse = {
	enabled: boolean;
	phase: "idle" | "waking" | "ready" | "error" | string;
	idleTimeoutSeconds: number;
	wakeTimeoutSeconds: number;
	lastRequestAt?: string;
	lastWakeAt?: string;
	lastError?: string;
	lastErrorAt?: string;
	proxyPrefix: string;
	rbac: ForwardOnPremRBACStatus;
	workloads: ForwardOnPremWorkloadStatus[];
};

export async function listForwardNetworks(params?: {
	credentialId?: string;
}): Promise<ListForwardNetworksResponse> {
	const qs = new URLSearchParams();
	if (params?.credentialId) qs.set("credentialId", params.credentialId);
	const suffix = qs.toString();
	return apiFetch<ListForwardNetworksResponse>(
		`/api/forward/networks${suffix ? `?${suffix}` : ""}`,
	);
}

export async function getForwardOnPremStatus(): Promise<ForwardOnPremStatusResponse> {
	return apiFetch<ForwardOnPremStatusResponse>("/api/forward/onprem/status");
}

export async function wakeForwardOnPremAdmin(): Promise<void> {
	await apiFetch<void>("/api/admin/forward/onprem/wake", {
		method: "POST",
		body: "{}",
	});
}

export type UserAPIToken = {
	id: string;
	name: string;
	prefix: string;
	usedCount: number;
	createdAt: ISO8601;
	lastUsedAt?: ISO8601;
	revokedAt?: ISO8601;
};

export type ListUserAPITokensResponse = {
	tokens: UserAPIToken[];
};

export type CreateUserAPITokenResponse = {
	token: UserAPIToken;
	secret: string;
};

export async function listUserApiTokens(): Promise<ListUserAPITokensResponse> {
	return apiFetch<ListUserAPITokensResponse>("/api/personal/api-tokens");
}

export async function createUserApiToken(payload: {
	name?: string;
}): Promise<CreateUserAPITokenResponse> {
	return apiFetch<CreateUserAPITokenResponse>("/api/personal/api-tokens", {
		method: "POST",
		body: JSON.stringify(payload ?? {}),
	});
}

export async function revokeUserApiToken(tokenId: string): Promise<void> {
	await apiFetch<void>(
		`/api/personal/api-tokens/${encodeURIComponent(tokenId)}`,
		{
			method: "DELETE",
		},
	);
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
	connected: boolean;
	user: string;
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
	return apiFetch<UserAWSStaticCredentialsGetResponse>(
		"/api/personal/cloud/aws-static",
	);
}

export async function putUserAWSStaticCredentials(payload: {
	accessKeyId: string;
	secretAccessKey: string;
}): Promise<UserAWSStaticCredentialsGetResponse> {
	return apiFetch<UserAWSStaticCredentialsGetResponse>(
		"/api/personal/cloud/aws-static",
		{
			method: "PUT",
			body: JSON.stringify(payload),
		},
	);
}

export async function deleteUserAWSStaticCredentials(): Promise<void> {
	await apiFetch<void>("/api/personal/cloud/aws-static", { method: "DELETE" });
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
	return apiFetch<UserAWSSSOCredentialsResponse>("/api/personal/cloud/aws-sso");
}

export async function putUserAWSSSOCredentials(payload: {
	startUrl: string;
	region: string;
	accountId: string;
	roleName: string;
}): Promise<UserAWSSSOCredentialsResponse> {
	return apiFetch<UserAWSSSOCredentialsResponse>(
		"/api/personal/cloud/aws-sso",
		{
			method: "PUT",
			body: JSON.stringify(payload),
		},
	);
}

export async function deleteUserAWSSSOCredentials(): Promise<void> {
	await apiFetch<void>("/api/personal/cloud/aws-sso", { method: "DELETE" });
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
	return apiFetch<UserAzureCredentialsResponse>("/api/personal/cloud/azure");
}

export async function putUserAzureCredentials(payload: {
	tenantId: string;
	clientId: string;
	clientSecret: string;
	subscriptionId?: string;
}): Promise<UserAzureCredentialsResponse> {
	return apiFetch<UserAzureCredentialsResponse>("/api/personal/cloud/azure", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserAzureCredentials(): Promise<void> {
	await apiFetch<void>("/api/personal/cloud/azure", { method: "DELETE" });
}

export type UserGCPCredentialsResponse = {
	configured: boolean;
	projectId?: string;
	hasServiceAccountJSON: boolean;
	updatedAt?: ISO8601;
};

export async function getUserGCPCredentials(): Promise<UserGCPCredentialsResponse> {
	return apiFetch<UserGCPCredentialsResponse>("/api/personal/cloud/gcp");
}

export async function putUserGCPCredentials(payload: {
	projectId: string;
	serviceAccountJSON: string;
}): Promise<UserGCPCredentialsResponse> {
	return apiFetch<UserGCPCredentialsResponse>("/api/personal/cloud/gcp", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserGCPCredentials(): Promise<void> {
	await apiFetch<void>("/api/personal/cloud/gcp", { method: "DELETE" });
}

export type UserIBMCredentialsResponse = {
	configured: boolean;
	region?: string;
	resourceGroupId?: string;
	hasApiKey: boolean;
	updatedAt?: ISO8601;
};

export async function getUserIBMCredentials(): Promise<UserIBMCredentialsResponse> {
	return apiFetch<UserIBMCredentialsResponse>("/api/personal/cloud/ibm");
}

export async function putUserIBMCredentials(payload: {
	apiKey: string;
	region: string;
	resourceGroupId?: string;
}): Promise<UserIBMCredentialsResponse> {
	return apiFetch<UserIBMCredentialsResponse>("/api/personal/cloud/ibm", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserIBMCredentials(): Promise<void> {
	await apiFetch<void>("/api/personal/cloud/ibm", { method: "DELETE" });
}

export type UserNetlabServerConfig = {
	id?: string;
	name: string;
	apiUrl: string;
	apiInsecure: boolean;
	apiUser?: string;
	apiPassword?: string;
	apiToken?: string;
	hasPassword?: boolean;
};
export type UserNetlabServersResponse = { servers: UserNetlabServerConfig[] };

export async function listUserNetlabServers(): Promise<UserNetlabServersResponse> {
	return apiFetch<UserNetlabServersResponse>("/api/personal/netlab/servers");
}

export async function upsertUserNetlabServer(
	payload: UserNetlabServerConfig,
): Promise<UserNetlabServerConfig> {
	return apiFetch<UserNetlabServerConfig>("/api/personal/netlab/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserNetlabServer(serverId: string): Promise<void> {
	await apiFetch<void>(
		`/api/personal/netlab/servers/${encodeURIComponent(serverId)}`,
		{
			method: "DELETE",
		},
	);
}

export type UserEveServerConfig = {
	id?: string;
	name: string;
	apiUrl: string;
	webUrl?: string;
	skipTlsVerify: boolean;
	apiUser?: string;
	apiPassword?: string;
	sshHost?: string;
	sshUser?: string;
	sshKey?: string;
	hasPassword?: boolean;
};
export type UserEveServersResponse = { servers: UserEveServerConfig[] };

export async function listUserEveServers(): Promise<UserEveServersResponse> {
	return apiFetch<UserEveServersResponse>("/api/personal/eve/servers");
}

export async function upsertUserEveServer(
	payload: UserEveServerConfig,
): Promise<UserEveServerConfig> {
	return apiFetch<UserEveServerConfig>("/api/personal/eve/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserEveServer(serverId: string): Promise<void> {
	await apiFetch<void>(
		`/api/personal/eve/servers/${encodeURIComponent(serverId)}`,
		{
			method: "DELETE",
		},
	);
}

export type UserContainerlabServerConfig = {
	id?: string;
	name: string;
	apiUrl: string;
	apiInsecure: boolean;
	apiUser?: string;
	apiPassword?: string;
	apiToken?: string;
	hasPassword?: boolean;
};
export type UserContainerlabServersResponse = {
	servers: UserContainerlabServerConfig[];
};

export async function listUserContainerlabServers(): Promise<UserContainerlabServersResponse> {
	return apiFetch<UserContainerlabServersResponse>(
		"/api/personal/containerlab/servers",
	);
}

export async function upsertUserContainerlabServer(
	payload: UserContainerlabServerConfig,
): Promise<UserContainerlabServerConfig> {
	return apiFetch<UserContainerlabServerConfig>(
		"/api/personal/containerlab/servers",
		{
			method: "PUT",
			body: JSON.stringify(payload),
		},
	);
}

export async function deleteUserContainerlabServer(
	serverId: string,
): Promise<void> {
	await apiFetch<void>(
		`/api/personal/containerlab/servers/${encodeURIComponent(serverId)}`,
		{ method: "DELETE" },
	);
}

export type UpdateDeploymentForwardConfigRequest = {
	enabled: boolean;
	collectorConfigId?: string;
	collectorUsername?: string;
};

export type UpdateDeploymentForwardConfigResponse = {
	userContextId: string;
	deploymentId: string;
	enabled: boolean;
	collectorConfigId?: string;
	collectorUsername?: string;
	forwardNetworkId?: string;
	forwardSnapshotUrl?: string;
};

export async function updateDeploymentForwardConfig(
	userContextId: string,
	deploymentId: string,
	body: UpdateDeploymentForwardConfigRequest,
): Promise<UpdateDeploymentForwardConfigResponse> {
	return apiFetch<UpdateDeploymentForwardConfigResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/forward`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type SyncDeploymentForwardResponse = {
	userContextId: string;
	deploymentId: string;
	run: JSONMap;
};

export async function syncDeploymentForward(
	userContextId: string,
	deploymentId: string,
): Promise<SyncDeploymentForwardResponse> {
	return apiFetch<SyncDeploymentForwardResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/forward/sync`,
		{ method: "POST", body: "{}" },
	);
}

export type CapacityRollupRow = {
	objectType: string;
	objectId: string;
	metric: string;
	window: string;
	periodEnd: string;
	samples: number;
	avg?: number;
	p95?: number;
	p99?: number;
	max?: number;
	slopePerDay?: number;
	forecastCrossingTs?: string;
	threshold?: number;
	details?: JSONMap;
	createdAt?: string;
	forwardNetworkId?: string;
	deploymentId?: string;
	userContextId?: string;
};

export type DeploymentCapacitySummaryResponse = {
	userContextId: string;
	deploymentId: string;
	forwardNetworkId: string;
	asOf?: string;
	rollups: CapacityRollupRow[];
	stale: boolean;
};

export type DeploymentCapacityRefreshResponse = {
	userContextId: string;
	deploymentId: string;
	run: JSONMap;
};

export type CapacityPerfProxyResponse = {
	body: unknown;
};

export async function getDeploymentCapacitySummary(
	userContextId: string,
	deploymentId: string,
): Promise<DeploymentCapacitySummaryResponse> {
	return apiFetch<DeploymentCapacitySummaryResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/capacity/summary`,
	);
}

export async function refreshDeploymentCapacityRollups(
	userContextId: string,
	deploymentId: string,
): Promise<DeploymentCapacityRefreshResponse> {
	return apiFetch<DeploymentCapacityRefreshResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/capacity/rollups/refresh`,
		{ method: "POST", body: "{}" },
	);
}

export type ForwardNetworkCapacitySummaryResponse = {
	userContextId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOf?: string;
	rollups: CapacityRollupRow[];
	stale: boolean;
};

export type ForwardNetworkCapacityRefreshResponse = {
	userContextId: string;
	networkRef: string;
	run: JSONMap;
};

export type ForwardAssuranceFailureReason = {
	kind: string;
	key: string;
	count: number;
};

export type ForwardAssuranceSnapshotTile = {
	snapshotId: string;
	processedAt?: string;
	state?: string;
	ageSeconds?: number;
	sourceImportItemId?: number;
};

export type ForwardAssuranceCollectionHealthTile = {
	numSuccessfulDevices?: number;
	numCollectionFailureDevices?: number;
	numProcessingFailureDevices?: number;
	numSuccessfulEndpoints?: number;
	numCollectionFailureEndpoints?: number;
	numProcessingFailureEndpoints?: number;
	collectionDurationMs?: number;
	processingDurationMs?: number;
	topFailureReasons?: ForwardAssuranceFailureReason[];
	sourceImportItemId?: number;
};

export type ForwardAssuranceIndexingHealthTile = {
	pathSearchIndexingStatus?: string;
	searchIndexingStatus?: string;
	l2IndexingStatus?: string;
	hostComputationStatus?: string;
	ipLocationIndexingStatus?: string;
	overall: string;
	sourceImportItemId?: number;
};

export type ForwardAssuranceVulnerabilitiesTile = {
	total?: number;
	offset?: number;
	limitUsed: number;
	bySeverity?: Record<string, number>;
	knownExploitCount?: number;
	indexCreatedAt?: string;
	partial: boolean;
	sourceImportItemId?: number;
};

export type ForwardAssuranceCapacityTile = {
	asOf?: string;
	stale: boolean;
	hotInterfaces: number;
	maxUtilMax?: number;
	source: string;
};

export type ForwardAssuranceLiveSignalsTile = {
	windowMinutes: number;
	syslog: { total: number; critical: number };
	snmpTraps: { total: number };
	webhooks: { total: number };
};

export type ForwardAssuranceEvidence = {
	importItemIdsByKind?: Record<string, number>;
	importId?: string;
};

export type ForwardAssuranceSummaryResponse = {
	userContextId: string;
	networkRef: string;
	forwardNetworkId: string;
	generatedAt: string;
	snapshot: ForwardAssuranceSnapshotTile;
	collectionHealth: ForwardAssuranceCollectionHealthTile;
	indexingHealth: ForwardAssuranceIndexingHealthTile;
	vulnerabilities: ForwardAssuranceVulnerabilitiesTile;
	capacity: ForwardAssuranceCapacityTile;
	liveSignals: ForwardAssuranceLiveSignalsTile;
	evidence: ForwardAssuranceEvidence;
	warnings?: string[];
	missing?: string[];
};

export type ForwardAssuranceHistoryItem = {
	id: number;
	generatedAt: string;
	snapshotId?: string;
	summary: ForwardAssuranceSummaryResponse;
};

export type ForwardAssuranceHistoryResponse = {
	items: ForwardAssuranceHistoryItem[];
};

export async function getForwardNetworkCapacitySummary(
	userContextId: string,
	networkRef: string,
): Promise<ForwardNetworkCapacitySummaryResponse> {
	return apiFetch<ForwardNetworkCapacitySummaryResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/summary`,
	);
}

export async function refreshForwardNetworkCapacityRollups(
	userContextId: string,
	networkRef: string,
): Promise<ForwardNetworkCapacityRefreshResponse> {
	return apiFetch<ForwardNetworkCapacityRefreshResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/rollups/refresh`,
		{ method: "POST", body: "{}" },
	);
}

export async function getForwardNetworkAssuranceSummary(
	userContextId: string,
	networkRef: string,
): Promise<ForwardAssuranceSummaryResponse> {
	return apiFetch<ForwardAssuranceSummaryResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/summary`,
	);
}

export async function refreshForwardNetworkAssurance(
	userContextId: string,
	networkRef: string,
): Promise<ForwardAssuranceSummaryResponse> {
	return apiFetch<ForwardAssuranceSummaryResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/refresh`,
		{ method: "POST", body: "{}" },
	);
}

export async function listForwardNetworkAssuranceHistory(
	userContextId: string,
	networkRef: string,
	limit?: string,
): Promise<ForwardAssuranceHistoryResponse> {
	const qs = new URLSearchParams();
	if (limit) qs.set("limit", limit);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<ForwardAssuranceHistoryResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/summary/history${suffix}`,
	);
}

export type ForwardAssuranceDemoSeedResponse = {
	status: string;
	syslogCidr: string;
	inserted: { syslog: number; snmpTraps: number; webhooks: number };
};

export async function seedForwardNetworkAssuranceDemo(
	userContextId: string,
	networkRef: string,
): Promise<ForwardAssuranceDemoSeedResponse> {
	return apiFetch<ForwardAssuranceDemoSeedResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/demo/seed`,
		{ method: "POST", body: "{}" },
	);
}

export type ForwardNetworkCapacityCoverageResponse = {
	userContextId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOfRollups?: string;
	asOfInventory?: string;
	devicesTotal: number;
	ifacesTotal: number;
	ifacesWithSpeed: number;
	ifacesAdminUp: number;
	ifacesOperUp: number;
	rollupsInterfaceTotal: number;
	rollupsDeviceTotal: number;
	rollupsWithSamples: number;
};

export async function getForwardNetworkCapacityCoverage(
	userContextId: string,
	networkRef: string,
): Promise<ForwardNetworkCapacityCoverageResponse> {
	return apiFetch<ForwardNetworkCapacityCoverageResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/coverage`,
	);
}

export type CapacityRouteScaleDeltaRow = {
	deviceName: string;
	vrf: string;
	ipv4Now: number;
	ipv6Now: number;
	ipv4Prev: number;
	ipv6Prev: number;
	ipv4Delta: number;
	ipv6Delta: number;
};

export type CapacityBgpNeighborDeltaRow = {
	deviceName: string;
	vrf: string;
	neighborsNow: number;
	neighborsPrev: number;
	neighborsDelta: number;
	establishedNow: number;
	establishedPrev: number;
	establishedDelta: number;
};

export type ForwardNetworkCapacitySnapshotDeltaResponse = {
	userContextId: string;
	networkRef: string;
	forwardNetworkId: string;
	latestSnapshotId?: string;
	prevSnapshotId?: string;
	routeDelta: CapacityRouteScaleDeltaRow[];
	bgpDelta: CapacityBgpNeighborDeltaRow[];
	deviceDelta?: Array<{
		deviceName: string;
		changeType: string;
		changes?: string[];
		prev?: CapacityDeviceInventoryRow;
		now?: CapacityDeviceInventoryRow;
	}>;
	interfaceDelta?: Array<{
		deviceName: string;
		interfaceName: string;
		changeType: string;
		changes?: string[];
		prev?: CapacityInterfaceInventoryRow;
		now?: CapacityInterfaceInventoryRow;
	}>;
};

export async function getForwardNetworkCapacitySnapshotDelta(
	userContextId: string,
	networkRef: string,
): Promise<ForwardNetworkCapacitySnapshotDeltaResponse> {
	return apiFetch<ForwardNetworkCapacitySnapshotDeltaResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/snapshot-delta`,
	);
}

export type ForwardNetworkCapacityUpgradeCandidate = {
	targetType: string;
	device: string;
	name: string;
	members?: string[];
	speedMbps: number;
	worstDirection: string;
	p95Util: number;
	maxUtil: number;
	p95Gbps: number;
	maxGbps: number;
	forecastCrossingTs?: string | null;
	requiredSpeedMbps?: number | null;
	recommendedSpeedMbps?: number | null;
	reason?: string;
	worstMemberMaxUtil?: number | null;
};

export type ForwardNetworkCapacityUpgradeCandidatesResponse = {
	userContextId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOf?: string;
	items: ForwardNetworkCapacityUpgradeCandidate[];
};

export async function getForwardNetworkCapacityUpgradeCandidates(
	userContextId: string,
	networkRef: string,
	q: { window?: string } = {},
): Promise<ForwardNetworkCapacityUpgradeCandidatesResponse> {
	const qs = new URLSearchParams();
	if (q.window) qs.set("window", q.window);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<ForwardNetworkCapacityUpgradeCandidatesResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/upgrade-candidates${suffix}`,
	);
}

export type ForwardNetworkCapacityPortfolioItem = {
	networkRef: string;
	forwardNetworkId: string;
	name: string;
	description?: string;
	asOf?: string;
	stale: boolean;
	hotInterfaces: number;
	soonestForecast?: string | null;
	maxUtilMax?: number | null;
	maxUtilP95?: number | null;
};

export type ForwardNetworkCapacityPortfolioResponse = {
	userContextId: string;
	items: ForwardNetworkCapacityPortfolioItem[];
};

export async function getUserContextForwardNetworkCapacityPortfolio(
	userContextId: string,
): Promise<ForwardNetworkCapacityPortfolioResponse> {
	return apiFetch<ForwardNetworkCapacityPortfolioResponse>(
		`/api/fwd/capacity/networks/portfolio`,
	);
}

export type CapacityDeviceInventoryRow = {
	deviceName: string;
	tagNames?: string[];
	groupNames?: string[];
	deviceType?: string;
	vendor?: string;
	os?: string;
	model?: string | null;
	osVersion?: string | null;
	locationName?: string | null;
};

export type CapacityInterfaceInventoryRow = {
	deviceName: string;
	deviceLocationName?: string | null;
	deviceTagNames?: string[];
	deviceGroupNames?: string[];
	interfaceName: string;
	description?: string | null;
	adminStatus?: string;
	operStatus?: string;
	layer?: string;
	interfaceType?: string;
	mtu?: number | null;
	speedMbps?: number | null;
	aggregateId?: string | null;
	aggregationMemberNames?: string[];
	aggregationConfiguredMemberNames?: string[];
};

export type CapacityRouteScaleRow = {
	deviceName: string;
	vrf: string;
	ipv4Routes: number;
	ipv6Routes: number;
};

export type CapacityBgpNeighborRow = {
	deviceName: string;
	vrf: string;
	neighborAddress: string;
	peerDeviceName?: string | null;
	peerVrf?: string | null;
	peerAs: number;
	enabled: boolean;
	sessionState?: string | null;
	receivedPrefixes?: number | null;
	advertisedPrefixes?: number | null;
	sessionDurationSec?: number | null;
};

export type DeploymentCapacityInventoryResponse = {
	userContextId: string;
	deploymentId: string;
	forwardNetworkId: string;
	asOf?: string;
	snapshotId?: string;
	devices: CapacityDeviceInventoryRow[];
	interfaces: CapacityInterfaceInventoryRow[];
	interfaceVrfs?: Array<{
		deviceName: string;
		vrf: string;
		ifaceName: string;
		subIfaceName?: string | null;
	}>;
	hardwareTcam?: Array<{
		deviceName: string;
		vendor?: string;
		os?: string;
		model?: string | null;
		tcamUsed: number;
		tcamTotal: number;
		commandText?: string;
		evidence?: string;
	}>;
	routeScale: CapacityRouteScaleRow[];
	bgpNeighbors: CapacityBgpNeighborRow[];
};

export type ForwardNetworkCapacityInventoryResponse = {
	userContextId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOf?: string;
	snapshotId?: string;
	devices: CapacityDeviceInventoryRow[];
	interfaces: CapacityInterfaceInventoryRow[];
	interfaceVrfs?: Array<{
		deviceName: string;
		vrf: string;
		ifaceName: string;
		subIfaceName?: string | null;
	}>;
	hardwareTcam?: Array<{
		deviceName: string;
		vendor?: string;
		os?: string;
		model?: string | null;
		tcamUsed: number;
		tcamTotal: number;
		commandText?: string;
		evidence?: string;
	}>;
	routeScale: CapacityRouteScaleRow[];
	bgpNeighbors: CapacityBgpNeighborRow[];
};

export async function getDeploymentCapacityInventory(
	userContextId: string,
	deploymentId: string,
): Promise<DeploymentCapacityInventoryResponse> {
	return apiFetch<DeploymentCapacityInventoryResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/capacity/inventory`,
	);
}

export async function getForwardNetworkCapacityInventory(
	userContextId: string,
	networkRef: string,
): Promise<ForwardNetworkCapacityInventoryResponse> {
	return apiFetch<ForwardNetworkCapacityInventoryResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/inventory`,
	);
}

export type DeploymentCapacityGrowthQuery = {
	metric: string;
	window: string;
	objectType?: string;
	compareHours?: number;
	limit?: number;
};

export type CapacityGrowthRow = {
	objectType: string;
	objectId: string;
	metric: string;
	window: string;
	now: CapacityRollupRow;
	prev?: CapacityRollupRow | null;
	deltaP95?: number | null;
	deltaMax?: number | null;
	deltaP95Gbps?: number | null;
};

export type DeploymentCapacityGrowthResponse = {
	userContextId: string;
	deploymentId: string;
	metric: string;
	window: string;
	objectType?: string;
	asOf?: string;
	compareAsOf?: string;
	compareHours: number;
	rows: CapacityGrowthRow[];
};

export type ForwardNetworkCapacityGrowthResponse = {
	userContextId: string;
	networkRef: string;
	forwardNetworkId: string;
	metric: string;
	window: string;
	objectType?: string;
	asOf?: string;
	compareAsOf?: string;
	compareHours: number;
	rows: CapacityGrowthRow[];
};

export async function getDeploymentCapacityGrowth(
	userContextId: string,
	deploymentId: string,
	q: DeploymentCapacityGrowthQuery,
): Promise<DeploymentCapacityGrowthResponse> {
	const qs = new URLSearchParams();
	qs.set("metric", q.metric);
	qs.set("window", q.window);
	if (q.objectType) qs.set("objectType", q.objectType);
	if (q.compareHours) qs.set("compareHours", String(q.compareHours));
	if (q.limit) qs.set("limit", String(q.limit));
	return apiFetch<DeploymentCapacityGrowthResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/capacity/growth?${qs.toString()}`,
	);
}

export async function getForwardNetworkCapacityGrowth(
	userContextId: string,
	networkRef: string,
	q: DeploymentCapacityGrowthQuery,
): Promise<ForwardNetworkCapacityGrowthResponse> {
	const qs = new URLSearchParams();
	qs.set("metric", q.metric);
	qs.set("window", q.window);
	if (q.objectType) qs.set("objectType", q.objectType);
	if (q.compareHours) qs.set("compareHours", String(q.compareHours));
	if (q.limit) qs.set("limit", String(q.limit));
	return apiFetch<ForwardNetworkCapacityGrowthResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/growth?${qs.toString()}`,
	);
}

export type CapacityInterfaceWithDirection = {
	deviceName: string;
	interfaceName: string;
	direction?: string;
};

export type PostCapacityInterfaceMetricsHistoryRequest = {
	type: string;
	days?: number;
	startTime?: string;
	endTime?: string;
	maxSamples?: number;
	interfaces: CapacityInterfaceWithDirection[];
};

export async function postDeploymentCapacityInterfaceMetricsHistory(
	userContextId: string,
	deploymentId: string,
	body: PostCapacityInterfaceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/interface-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function postForwardNetworkCapacityInterfaceMetricsHistory(
	userContextId: string,
	networkRef: string,
	body: PostCapacityInterfaceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/perf/interface-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type PostCapacityDeviceMetricsHistoryRequest = {
	type: string;
	days?: number;
	startTime?: string;
	endTime?: string;
	maxSamples?: number;
	devices: string[];
};

export async function postDeploymentCapacityDeviceMetricsHistory(
	userContextId: string,
	deploymentId: string,
	body: PostCapacityDeviceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/device-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function postForwardNetworkCapacityDeviceMetricsHistory(
	userContextId: string,
	networkRef: string,
	body: PostCapacityDeviceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/perf/device-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type GetCapacityUnhealthyDevicesQuery = {
	snapshotId?: string;
	endTime?: string;
};

export async function getDeploymentCapacityUnhealthyDevices(
	userContextId: string,
	deploymentId: string,
	q: GetCapacityUnhealthyDevicesQuery,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/unhealthy-devices${suffix}`,
	);
}

export async function getForwardNetworkCapacityUnhealthyDevices(
	userContextId: string,
	networkRef: string,
	q: GetCapacityUnhealthyDevicesQuery,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/perf/unhealthy-devices${suffix}`,
	);
}

export type PostCapacityUnhealthyInterfacesRequest = {
	devices: string[];
};

export type GetCapacityUnhealthyInterfacesQuery = {
	snapshotId?: string;
	endTime?: string;
};

export async function postDeploymentCapacityUnhealthyInterfaces(
	userContextId: string,
	deploymentId: string,
	q: GetCapacityUnhealthyInterfacesQuery,
	body: PostCapacityUnhealthyInterfacesRequest,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/unhealthy-interfaces${suffix}`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function postForwardNetworkCapacityUnhealthyInterfaces(
	userContextId: string,
	networkRef: string,
	q: GetCapacityUnhealthyInterfacesQuery,
	body: PostCapacityUnhealthyInterfacesRequest,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/perf/unhealthy-interfaces${suffix}`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type CapacityPathSearchQuery = {
	from?: string;
	srcIp?: string;
	dstIp: string;
	ipProto?: number;
	srcPort?: string;
	dstPort?: string;
	icmpType?: number;
	fin?: number;
	syn?: number;
	rst?: number;
	psh?: number;
	ack?: number;
	urg?: number;
	appId?: string;
	userId?: string;
	userGroupId?: string;
	url?: string;
};

export type ForwardNetworkCapacityPathBottlenecksRequest = {
	window: string;
	snapshotId?: string;
	includeHops?: boolean;
	queries: CapacityPathSearchQuery[];
};

export type ForwardNetworkCapacityPathHop = {
	deviceName?: string;
	ingressInterface?: string;
	egressInterface?: string;
};

export type ForwardNetworkCapacityPathBottleneck = {
	deviceName: string;
	interfaceName: string;
	direction: string;
	source?: string;
	speedMbps?: number | null;
	threshold?: number | null;
	p95Util?: number | null;
	maxUtil?: number | null;
	p95Gbps?: number | null;
	maxGbps?: number | null;
	headroomGbps?: number | null;
	headroomUtil?: number | null;
	forecastCrossingTs?: string | null;
};

export type CapacityNote = {
	code: string;
	message: string;
};

export type ForwardNetworkCapacityPathBottleneckItem = {
	index: number;
	query: CapacityPathSearchQuery;
	timedOut?: boolean;
	totalHits?: number;
	forwardQueryUrl?: string;
	forwardingOutcome?: string;
	securityOutcome?: string;
	bottleneck?: ForwardNetworkCapacityPathBottleneck | null;
	hops?: ForwardNetworkCapacityPathHop[];
	unmatchedHopInterfacesSample?: string[];
	notes?: CapacityNote[];
	error?: string;
};

export type ForwardNetworkCapacityPathBottlenecksCoverage = {
	hopInterfaceKeys: number;
	rollupMatched: number;
	perfFallbackUsed: number;
	unknown: number;
	truncated?: boolean;
	unmatchedHopInterfacesSample?: string[];
};

export type ForwardNetworkCapacityPathBottlenecksResponse = {
	userContextId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOf?: string;
	window: string;
	snapshotId?: string;
	coverage?: ForwardNetworkCapacityPathBottlenecksCoverage | null;
	items: ForwardNetworkCapacityPathBottleneckItem[];
};

export async function postForwardNetworkCapacityPathBottlenecks(
	userContextId: string,
	networkRef: string,
	body: ForwardNetworkCapacityPathBottlenecksRequest,
): Promise<ForwardNetworkCapacityPathBottlenecksResponse> {
	return apiFetch<ForwardNetworkCapacityPathBottlenecksResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/capacity/path-bottlenecks`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function setDeploymentLinkImpairment(
	userContextId: string,
	deploymentId: string,
	body: LinkImpairmentRequest,
): Promise<LinkImpairmentResponse> {
	return apiFetch<LinkImpairmentResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/links/impair`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function setDeploymentLinkAdmin(
	userContextId: string,
	deploymentId: string,
	body: LinkAdminRequest,
): Promise<LinkAdminResponse> {
	return apiFetch<LinkAdminResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/links/admin`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function captureDeploymentLinkPcap(
	userContextId: string,
	deploymentId: string,
	body: LinkCaptureRequest,
): Promise<LinkCaptureResponse> {
	return apiFetch<LinkCaptureResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/links/capture`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function getDeploymentNodeInterfaces(
	userContextId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeInterfacesResponse> {
	return apiFetch<DeploymentNodeInterfacesResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/interfaces`,
	);
}

export type DeploymentNodeRunningConfigResponse = {
	namespace?: string;
	podName?: string;
	container?: string;
	node?: string;
	stdout?: string;
	stderr?: string;
	skipped?: boolean;
	message?: string;
};

export async function getDeploymentNodeRunningConfig(
	userContextId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeRunningConfigResponse> {
	return apiFetch<DeploymentNodeRunningConfigResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/running-config`,
	);
}

export async function getDeploymentInventory(
	userContextId: string,
	deploymentId: string,
	format: "json" | "csv" = "json",
): Promise<DeploymentInventoryResponse> {
	const qs = new URLSearchParams();
	qs.set("format", format);
	return apiFetch<DeploymentInventoryResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/inventory?${qs.toString()}`,
	);
}

export async function listDeploymentUIEvents(
	userContextId: string,
	deploymentId: string,
	params?: { afterId?: number; limit?: number },
): Promise<DeploymentUIEventsResponse> {
	const qs = new URLSearchParams();
	if (params?.afterId) qs.set("after_id", String(params.afterId));
	if (params?.limit) qs.set("limit", String(params.limit));
	const suffix = qs.toString();
	return apiFetch<DeploymentUIEventsResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/ui-events${suffix ? `?${suffix}` : ""}`,
	);
}

export type DeploymentNodeLogsResponse = {
	namespace?: string;
	podName?: string;
	container?: string;
	tail?: number;
	logs?: string;
};

export async function getDeploymentNodeLogs(
	userContextId: string,
	deploymentId: string,
	nodeId: string,
	params?: { tail?: number; container?: string },
): Promise<DeploymentNodeLogsResponse> {
	const qs = new URLSearchParams();
	if (params?.tail) qs.set("tail", String(params.tail));
	if (params?.container) qs.set("container", params.container);
	const suffix = qs.toString();
	return apiFetch<DeploymentNodeLogsResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/logs${suffix ? `?${suffix}` : ""}`,
	);
}

export type DeploymentNodeDescribeResponse = {
	namespace?: string;
	podName?: string;
	nodeName?: string;
	phase?: string;
	podIP?: string;
	hostIP?: string;
	qosClass?: string;
	message?: string;
	containers?: Array<{
		name?: string;
		image?: string;
		ready?: boolean;
		restartCount?: number;
		state?: string;
		reason?: string;
		message?: string;
	}>;
};

export async function getDeploymentNodeDescribe(
	userContextId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeDescribeResponse> {
	return apiFetch<DeploymentNodeDescribeResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/describe`,
	);
}

export type DeploymentNodeSaveConfigResponse = {
	namespace?: string;
	podName?: string;
	container?: string;
	command?: string;
	stdout?: string;
	stderr?: string;
	skipped?: boolean;
	message?: string;
};

export async function saveDeploymentNodeConfig(
	userContextId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeSaveConfigResponse> {
	return apiFetch<DeploymentNodeSaveConfigResponse>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/save-config`,
		{ method: "POST", body: "{}" },
	);
}

export type LinkStatsSnapshot = {
	generatedAt: ISO8601;
	source: string;
	edges: Array<{
		edgeId: string;
		sourceNode: string;
		sourceIf: string;
		sourceRxBytes: number;
		sourceTxBytes: number;
		sourceRxPackets: number;
		sourceTxPackets: number;
		sourceRxDropped: number;
		sourceTxDropped: number;
		targetNode: string;
		targetIf: string;
		targetRxBytes: number;
		targetTxBytes: number;
		targetRxPackets: number;
		targetTxPackets: number;
		targetRxDropped: number;
		targetTxDropped: number;
	}>;
};

export async function getDeploymentLinkStats(
	userContextId: string,
	deploymentId: string,
): Promise<LinkStatsSnapshot> {
	return apiFetch<LinkStatsSnapshot>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/links/stats`,
	);
}

type TemplatesQuery = {
	source?: "user" | "blueprints" | "custom" | "external" | string;
	repo?: string;
	dir?: string;
};

export type UserContextTemplatesResponse = {
	userContextId: string;
	repo: string;
	branch: string;
	dir: string;
	templates: string[];
	headSha?: string;
	cached?: boolean;
	updatedAt?: ISO8601;
};

export async function getUserContextNetlabTemplates(
	userContextId: string,
	query?: TemplatesQuery,
): Promise<UserContextTemplatesResponse> {
	const params = new URLSearchParams();
	if (query?.source) params.set("source", query.source);
	if (query?.repo) params.set("repo", query.repo);
	if (query?.dir) params.set("dir", query.dir);
	const qs = params.toString();
	return apiFetch<UserContextTemplatesResponse>(
		`/api/personal/netlab/templates${qs ? `?${qs}` : ""}`,
	);
}

export type UserContextNetlabTemplateResponse = {
	userContextId: string;
	source: string;
	repo?: string;
	branch?: string;
	dir: string;
	template: string;
	path: string;
	yaml: string;
};

export async function getUserContextNetlabTemplate(
	userContextId: string,
	params: { source?: string; repo?: string; dir?: string; template: string },
): Promise<UserContextNetlabTemplateResponse> {
	const qs = new URLSearchParams();
	if (params.source) qs.set("source", params.source);
	if (params.repo) qs.set("repo", params.repo);
	if (params.dir) qs.set("dir", params.dir);
	qs.set("template", params.template);
	return apiFetch<UserContextNetlabTemplateResponse>(
		`/api/personal/netlab/template?${qs.toString()}`,
	);
}

export type UserContextRunResponse = {
	userContextId: string;
	task: JSONMap;
	user?: string;
};

export type ValidateUserContextNetlabTemplateRequest = {
	source?: string;
	repo?: string;
	dir?: string;
	template: string;
	environment?: JSONMap;
	setOverrides?: string[];
};

export async function validateUserContextNetlabTemplate(
	userContextId: string,
	body: ValidateUserContextNetlabTemplateRequest,
): Promise<UserContextRunResponse> {
	return apiFetch<UserContextRunResponse>(`/api/personal/netlab/validate`, {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function getUserContextContainerlabTemplates(
	userContextId: string,
	query?: TemplatesQuery,
): Promise<UserContextTemplatesResponse> {
	const params = new URLSearchParams();
	if (query?.source) params.set("source", query.source);
	if (query?.repo) params.set("repo", query.repo);
	if (query?.dir) params.set("dir", query.dir);
	const qs = params.toString();
	return apiFetch<UserContextTemplatesResponse>(
		`/api/personal/containerlab/templates${qs ? `?${qs}` : ""}`,
	);
}

export async function getUserContextTerraformTemplates(
	userContextId: string,
	query?: TemplatesQuery,
): Promise<UserContextTemplatesResponse> {
	const params = new URLSearchParams();
	if (query?.source) params.set("source", query.source);
	if (query?.repo) params.set("repo", query.repo);
	if (query?.dir) params.set("dir", query.dir);
	const qs = params.toString();
	return apiFetch<UserContextTemplatesResponse>(
		`/api/personal/terraform/templates${qs ? `?${qs}` : ""}`,
	);
}

export type UserContextContainerlabTemplateResponse = {
	userContextId: string;
	source: string;
	repo?: string;
	branch?: string;
	dir: string;
	file: string;
	path: string;
	yaml: string;
};

export async function getUserContextContainerlabTemplate(
	userContextId: string,
	params: { source?: string; repo?: string; dir?: string; file: string },
): Promise<UserContextContainerlabTemplateResponse> {
	const qs = new URLSearchParams();
	if (params.source) qs.set("source", params.source);
	if (params.repo) qs.set("repo", params.repo);
	if (params.dir) qs.set("dir", params.dir);
	qs.set("file", params.file);
	return apiFetch<UserContextContainerlabTemplateResponse>(
		`/api/personal/containerlab/template?${qs.toString()}`,
	);
}

export async function getUserContextEveNgTemplates(
	userContextId: string,
	query?: TemplatesQuery,
): Promise<UserContextTemplatesResponse> {
	const params = new URLSearchParams();
	if (query?.source) params.set("source", query.source);
	if (query?.repo) params.set("repo", query.repo);
	if (query?.dir) params.set("dir", query.dir);
	const qs = params.toString();
	return apiFetch<UserContextTemplatesResponse>(
		`/api/personal/eve-ng/templates${qs ? `?${qs}` : ""}`,
	);
}

export type CreateUserContextDeploymentRequest = JSONMap;
export type CreateUserContextDeploymentResponse = JSONMap;

export async function createUserContextDeployment(
	userContextId: string,
	body: CreateUserContextDeploymentRequest,
): Promise<CreateUserContextDeploymentResponse> {
	return apiFetch<CreateUserContextDeploymentResponse>(
		`/api/personal/deployments`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type CreateContainerlabDeploymentFromYAMLRequest = {
	name: string;
	netlabServer?: string;
	topologyYAML: string;
	templatesDir?: string;
	template?: string;
	autoDeploy?: boolean;
};

export type CreateContainerlabDeploymentFromYAMLResponse = {
	userContextId: string;
	deployment?: UserContextDeployment;
	run?: JSONMap;
	note?: string;
};

export async function createContainerlabDeploymentFromYAML(
	userContextId: string,
	body: CreateContainerlabDeploymentFromYAMLRequest,
): Promise<CreateContainerlabDeploymentFromYAMLResponse> {
	return apiFetch<CreateContainerlabDeploymentFromYAMLResponse>(
		`/api/personal/deployments-designer/containerlab/from-yaml`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type CreateClabernetesDeploymentFromYAMLRequest = {
	name: string;
	topologyYAML: string;
	templatesDir?: string;
	template?: string;
	autoDeploy?: boolean;
};

export type CreateClabernetesDeploymentFromYAMLResponse = {
	userContextId: string;
	deployment?: UserContextDeployment;
	run?: JSONMap;
	note?: string;
};

export async function createClabernetesDeploymentFromYAML(
	userContextId: string,
	body: CreateClabernetesDeploymentFromYAMLRequest,
): Promise<CreateClabernetesDeploymentFromYAMLResponse> {
	return apiFetch<CreateClabernetesDeploymentFromYAMLResponse>(
		`/api/personal/deployments-designer/clabernetes/from-yaml`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type SaveContainerlabTopologyYAMLRequest = {
	name: string;
	topologyYAML: string;
	templatesDir?: string;
	template?: string;
};

export type SaveContainerlabTopologyYAMLResponse = {
	userContextId: string;
	branch: string;
	templatesDir: string;
	template: string;
	filePath: string;
};

export async function saveContainerlabTopologyYAML(
	userContextId: string,
	body: SaveContainerlabTopologyYAMLRequest,
): Promise<SaveContainerlabTopologyYAMLResponse> {
	return apiFetch<SaveContainerlabTopologyYAMLResponse>(
		`/api/personal/containerlab/topologies`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type CreateDeploymentFromTemplateRequest = {
	name: string;
	templateSource?: string;
	templatesDir?: string;
	template: string;
	autoDeploy?: boolean;
};

export type CreateDeploymentFromTemplateResponse = {
	userContextId: string;
	deployment?: UserContextDeployment;
	run?: JSONMap;
	note?: string;
};

export type CreateContainerlabDeploymentFromTemplateRequest =
	CreateDeploymentFromTemplateRequest & {
		netlabServer?: string;
	};

export async function createClabernetesDeploymentFromTemplate(
	userContextId: string,
	body: CreateDeploymentFromTemplateRequest,
): Promise<CreateDeploymentFromTemplateResponse> {
	return apiFetch<CreateDeploymentFromTemplateResponse>(
		`/api/personal/deployments-designer/clabernetes/from-template`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function createContainerlabDeploymentFromTemplate(
	userContextId: string,
	body: CreateContainerlabDeploymentFromTemplateRequest,
): Promise<CreateDeploymentFromTemplateResponse> {
	return apiFetch<CreateDeploymentFromTemplateResponse>(
		`/api/personal/deployments-designer/containerlab/from-template`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type CreateUserContextRequest = JSONMap;
export type CreateUserContextResponse = SkyforgeUserContext;

export async function createUserContext(
	body: CreateUserContextRequest,
): Promise<CreateUserContextResponse> {
	return apiFetch<CreateUserContextResponse>("/api/user-contexts", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export type UpdateUserContextMembersRequest = JSONMap;
export type UpdateUserContextMembersResponse = SkyforgeUserContext;
export async function updateUserContextMembers(
	userContextId: string,
	body: UpdateUserContextMembersRequest,
): Promise<UpdateUserContextMembersResponse> {
	return apiFetch<UpdateUserContextMembersResponse>(`/api/personal/members`, {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export async function getDeploymentTopology(
	userContextId: string,
	deploymentId: string,
): Promise<DeploymentTopology> {
	return apiFetch<DeploymentTopology>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/topology`,
	);
}

export type RegistryReposResponse = {
	baseUrl?: string;
	repositories: string[];
	filteredCount: number;
	totalCount: number;
};

export type RegistryTagsListResponse = {
	repository: string;
	tags: string[];
};

export async function listRegistryRepositories(params?: {
	q?: string;
	n?: number;
}): Promise<RegistryReposResponse> {
	const qs = new URLSearchParams();
	if (params?.q) qs.set("q", params.q);
	if (params?.n) qs.set("n", String(params.n));
	const suffix = qs.toString();
	return apiFetch<RegistryReposResponse>(
		`/api/registry/repos${suffix ? `?${suffix}` : ""}`,
	);
}

export async function listRegistryTags(
	repo: string,
	params?: { q?: string },
): Promise<RegistryTagsListResponse> {
	const qs = new URLSearchParams();
	if (params?.q) qs.set("q", params.q);
	const suffix = qs.toString();
	return apiFetch<RegistryTagsListResponse>(
		`/api/registry/repos/${encodeURIComponent(repo)}/tags${suffix ? `?${suffix}` : ""}`,
	);
}

export type DeleteUserContextResponse = JSONMap;
export async function deleteUserContext(
	userContextId: string,
	params: { confirm: string; force?: boolean },
): Promise<DeleteUserContextResponse> {
	void userContextId;
	const qs = new URLSearchParams();
	qs.set("confirm", params.confirm);
	if (params.force) qs.set("force", "true");
	return apiFetch<DeleteUserContextResponse>(`/api/personal/?${qs.toString()}`, {
		method: "DELETE",
	});
}

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
	username?: string;
	password?: string;
	setDefault?: boolean;
	sourceCredentialId?: string;
};

export type DeleteUserForwardCollectorConfigResponse = {
	deleted: boolean;
};

export type ForwardCredentialSetSummary = {
	id: string;
	name: string;
	baseUrl?: string;
	skipTlsVerify: boolean;
	username?: string;
	hasPassword: boolean;
	updatedAt?: ISO8601;
};

export type ListForwardCredentialSetsResponse = {
	credentialSets: ForwardCredentialSetSummary[];
};

export type CreateForwardCredentialSetRequest = {
	name: string;
	baseUrl: string;
	skipTlsVerify: boolean;
	username: string;
	password: string;
};

export type UpdateForwardCredentialSetRequest = {
	name: string;
	baseUrl: string;
	skipTlsVerify: boolean;
	username: string;
	password?: string;
};

export type DeleteForwardCredentialSetResponse = {
	deleted: boolean;
};

export async function listUserForwardCollectorConfigs(): Promise<ListUserForwardCollectorConfigsResponse> {
	return apiFetch<ListUserForwardCollectorConfigsResponse>(
		"/api/forward/collector-configs",
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

export async function listUserForwardCredentialSets(): Promise<ListForwardCredentialSetsResponse> {
	return apiFetch<ListForwardCredentialSetsResponse>(
		"/api/forward/credential-sets",
	);
}

export async function createUserForwardCredentialSet(
	body: CreateForwardCredentialSetRequest,
): Promise<ForwardCredentialSetSummary> {
	return apiFetch<ForwardCredentialSetSummary>("/api/forward/credential-sets", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function updateUserForwardCredentialSet(
	id: string,
	body: UpdateForwardCredentialSetRequest,
): Promise<ForwardCredentialSetSummary> {
	return apiFetch<ForwardCredentialSetSummary>(
		`/api/forward/credential-sets/${encodeURIComponent(id)}`,
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteUserForwardCredentialSet(
	id: string,
): Promise<DeleteForwardCredentialSetResponse> {
	return apiFetch<DeleteForwardCredentialSetResponse>(
		`/api/forward/credential-sets/${encodeURIComponent(id)}`,
		{ method: "DELETE" },
	);
}

export type UserForwardCollectorResponse = {
	baseUrl?: string;
	skipTlsVerify?: boolean;
	username?: string;
	collectorId?: string;
	collectorUsername?: string;
	authorizationKey?: string;
	runtime?: {
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
	forwardCollector?: {
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
	updatedAt?: ISO8601;
};

export type PutUserForwardCollectorRequest = {
	baseUrl?: string;
	skipTlsVerify?: boolean;
	username?: string;
	password?: string;
};

export async function getUserForwardCollector(): Promise<UserForwardCollectorResponse> {
	return apiFetch<UserForwardCollectorResponse>("/api/forward/collector");
}

export async function putUserForwardCollector(
	body: PutUserForwardCollectorRequest,
): Promise<UserForwardCollectorResponse> {
	return apiFetch<UserForwardCollectorResponse>("/api/forward/collector", {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export async function resetUserForwardCollector(): Promise<UserForwardCollectorResponse> {
	return apiFetch<UserForwardCollectorResponse>(
		"/api/forward/collector/reset",
		{ method: "POST", body: "{}" },
	);
}

export async function clearUserForwardCollector(): Promise<void> {
	await apiFetch<unknown>("/api/forward/collector", { method: "DELETE" });
}

export type UserCollectorRuntimeResponse = {
	runtime?: {
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
	};
};

export async function getUserCollectorRuntime(): Promise<UserCollectorRuntimeResponse> {
	return apiFetch<UserCollectorRuntimeResponse>(
		"/api/forward/collector/runtime",
	);
}

export type UserCollectorLogsResponse = {
	podName?: string;
	logs?: string;
};

export async function getUserCollectorLogs(
	tail?: number,
): Promise<UserCollectorLogsResponse> {
	const qs = new URLSearchParams();
	if (tail && tail > 0) qs.set("tail", String(tail));
	const suffix = qs.toString();
	return apiFetch<UserCollectorLogsResponse>(
		`/api/forward/collector/logs${suffix ? `?${suffix}` : ""}`,
	);
}

export async function restartUserCollector(): Promise<UserCollectorRuntimeResponse> {
	return apiFetch<UserCollectorRuntimeResponse>(
		"/api/forward/collector/restart",
		{ method: "POST", body: "{}" },
	);
}

export type GetUserContextForwardConfigResponse = JSONMap;
export async function getUserContextForwardConfig(
	userContextId: string,
): Promise<GetUserContextForwardConfigResponse> {
	return apiFetch<GetUserContextForwardConfigResponse>(
		`/api/personal/integrations/forward`,
	);
}

export type PutUserContextForwardConfigRequest = JSONMap;
export type PutUserContextForwardConfigResponse = JSONMap;
export async function putUserContextForwardConfig(
	userContextId: string,
	body: PutUserContextForwardConfigRequest,
): Promise<PutUserContextForwardConfigResponse> {
	return apiFetch<PutUserContextForwardConfigResponse>(
		`/api/personal/integrations/forward`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type ApplyUserContextForwardCredentialSetRequest = {
	credentialId: string;
};

export async function applyUserContextForwardCredentialSet(
	userContextId: string,
	body: ApplyUserContextForwardCredentialSetRequest,
): Promise<GetUserContextForwardConfigResponse> {
	return apiFetch<GetUserContextForwardConfigResponse>(
		`/api/personal/integrations/forward/apply-credential-set`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function deleteUserContextForwardConfig(
	userContextId: string,
): Promise<GetUserContextForwardConfigResponse> {
	return apiFetch<GetUserContextForwardConfigResponse>(
		`/api/personal/integrations/forward`,
		{ method: "DELETE" },
	);
}

export type ListUserContextForwardCollectorsResponse = JSONMap;
export async function listUserContextForwardCollectors(
	userContextId: string,
): Promise<ListUserContextForwardCollectorsResponse> {
	return apiFetch<ListUserContextForwardCollectorsResponse>(
		`/api/personal/integrations/forward/collectors`,
	);
}

export type ListUserContextArtifactsResponse = {
	status?: string;
	bucket?: string;
	prefix?: string;
	items: Array<{
		key: string;
		size?: number;
		lastModified?: ISO8601;
	}>;
};
export async function listUserContextArtifacts(
	userContextId: string,
	params?: { prefix?: string; limit?: string },
): Promise<ListUserContextArtifactsResponse> {
	const qs = new URLSearchParams();
	if (params?.prefix) qs.set("prefix", params.prefix);
	if (params?.limit) qs.set("limit", params.limit);
	const suffix = qs.toString();
	return apiFetch<ListUserContextArtifactsResponse>(
		`/api/personal/artifacts${suffix ? `?${suffix}` : ""}`,
	);
}

export type DownloadUserContextArtifactResponse = {
	status?: string;
	bucket?: string;
	key?: string;
	fileData: string;
};
export async function downloadUserContextArtifact(
	userContextId: string,
	key: string,
): Promise<DownloadUserContextArtifactResponse> {
	const qs = new URLSearchParams({ key });
	return apiFetch<DownloadUserContextArtifactResponse>(
		`/api/personal/artifacts/download?${qs.toString()}`,
	);
}

export async function putUserContextArtifactObject(
	userContextId: string,
	body: { key: string; contentBase64: string; contentType?: string },
): Promise<JSONMap> {
	return apiFetch<JSONMap>(`/api/personal/artifacts/object`, {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function deleteUserContextArtifactObject(
	userContextId: string,
	key: string,
): Promise<JSONMap> {
	const qs = new URLSearchParams({ key });
	return apiFetch<JSONMap>(`/api/personal/artifacts/object?${qs.toString()}`, {
		method: "DELETE",
	});
}

export async function createUserContextArtifactFolder(
	userContextId: string,
	prefix: string,
): Promise<JSONMap> {
	return apiFetch<JSONMap>(`/api/personal/artifacts/folder`, {
		method: "POST",
		body: JSON.stringify({ prefix }),
	});
}

export type StorageListResponse =
	operations["GET:storage.List"]["responses"][200]["content"]["application/json"];

export async function listStorageFiles(): Promise<StorageListResponse> {
	return apiFetch<StorageListResponse>("/storage.List");
}

export type PKIRootResponse =
	operations["GET:skyforge.GetPKIRoot"]["responses"][200]["content"]["application/json"];
export async function getPKIRoot(): Promise<PKIRootResponse> {
	return apiFetch<PKIRootResponse>("/api/pki/root");
}

export type PKISSHRootResponse =
	operations["GET:skyforge.GetPKISSHRoot"]["responses"][200]["content"]["application/json"];
export async function getPKISSHRoot(): Promise<PKISSHRootResponse> {
	return apiFetch<PKISSHRootResponse>("/api/pki/ssh/root");
}

export type PKICertsResponse =
	operations["GET:skyforge.ListPKICerts"]["responses"][200]["content"]["application/json"];
export async function listPKICerts(): Promise<PKICertsResponse> {
	return apiFetch<PKICertsResponse>("/api/pki/certs");
}

export type PKISSHCertsResponse =
	operations["GET:skyforge.ListPKISSHCerts"]["responses"][200]["content"]["application/json"];
export async function listPKISSHCerts(): Promise<PKISSHCertsResponse> {
	return apiFetch<PKISSHCertsResponse>("/api/pki/ssh/certs");
}

export type IssuePKICertRequest = NonNullable<
	operations["POST:skyforge.IssuePKICert"]["requestBody"]
>["content"]["application/json"];
export type IssuePKICertResponse =
	operations["POST:skyforge.IssuePKICert"]["responses"][200]["content"]["application/json"];
export async function issuePKICert(
	body: IssuePKICertRequest,
): Promise<IssuePKICertResponse> {
	return apiFetch<IssuePKICertResponse>("/api/pki/issue", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export type IssuePKISSHCertRequest = NonNullable<
	operations["POST:skyforge.IssuePKISSHCert"]["requestBody"]
>["content"]["application/json"];
export type IssuePKISSHCertResponse =
	operations["POST:skyforge.IssuePKISSHCert"]["responses"][200]["content"]["application/json"];
export async function issuePKISSHCert(
	body: IssuePKISSHCertRequest,
): Promise<IssuePKISSHCertResponse> {
	return apiFetch<IssuePKISSHCertResponse>("/api/pki/ssh/issue", {
		method: "POST",
		body: JSON.stringify(body),
	});
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

export type GovernanceSummaryResponse =
	operations["GET:skyforge.GetGovernanceSummary"]["responses"][200]["content"]["application/json"];
export async function getGovernanceSummary(): Promise<GovernanceSummaryResponse> {
	return apiFetch<GovernanceSummaryResponse>("/api/admin/governance/summary");
}

export type GovernanceResourcesResponse =
	operations["GET:skyforge.ListGovernanceResources"]["responses"][200]["content"]["application/json"];
export async function listGovernanceResources(params?: {
	limit?: string;
}): Promise<GovernanceResourcesResponse> {
	const qs = new URLSearchParams();
	if (params?.limit) qs.set("limit", params.limit);
	const suffix = qs.toString();
	return apiFetch<GovernanceResourcesResponse>(
		`/api/admin/governance/resources${suffix ? `?${suffix}` : ""}`,
	);
}

export type GovernanceCostsResponse =
	operations["GET:skyforge.ListGovernanceCosts"]["responses"][200]["content"]["application/json"];
export async function listGovernanceCosts(params?: {
	limit?: string;
}): Promise<GovernanceCostsResponse> {
	const qs = new URLSearchParams();
	if (params?.limit) qs.set("limit", params.limit);
	const suffix = qs.toString();
	return apiFetch<GovernanceCostsResponse>(
		`/api/admin/governance/costs${suffix ? `?${suffix}` : ""}`,
	);
}

export type GovernanceUsageResponse =
	operations["GET:skyforge.ListGovernanceUsage"]["responses"][200]["content"]["application/json"];
export async function listGovernanceUsage(params?: {
	limit?: string;
}): Promise<GovernanceUsageResponse> {
	const qs = new URLSearchParams();
	if (params?.limit) qs.set("limit", params.limit);
	const suffix = qs.toString();
	return apiFetch<GovernanceUsageResponse>(
		`/api/admin/governance/usage${suffix ? `?${suffix}` : ""}`,
	);
}

export async function syncGovernanceSources(): Promise<void> {
	await apiFetch<unknown>("/api/admin/governance/sync", {
		method: "POST",
		body: "{}",
	});
}

export type AdminEffectiveConfigResponse =
	operations["GET:skyforge.GetAdminEffectiveConfig"]["responses"][200]["content"]["application/json"];
export async function getAdminEffectiveConfig(): Promise<AdminEffectiveConfigResponse> {
	return apiFetch<AdminEffectiveConfigResponse>("/api/admin/config");
}

export type AdminAuditResponse =
	operations["GET:skyforge.GetAdminAudit"]["responses"][200]["content"]["application/json"];
export async function getAdminAudit(params?: {
	limit?: string;
}): Promise<AdminAuditResponse> {
	const qs = new URLSearchParams();
	if (params?.limit) qs.set("limit", params.limit);
	const suffix = qs.toString();
	return apiFetch<AdminAuditResponse>(
		`/api/admin/audit${suffix ? `?${suffix}` : ""}`,
	);
}

export type AdminImpersonateStatusResponse =
	operations["GET:skyforge.GetAdminImpersonateStatus"]["responses"][200]["content"]["application/json"];
export async function getAdminImpersonateStatus(): Promise<AdminImpersonateStatusResponse> {
	return apiFetch<AdminImpersonateStatusResponse>(
		"/api/admin/impersonate/status",
	);
}

export type AdminImpersonateStartRequest = NonNullable<
	operations["POST:skyforge.AdminImpersonateStart"]["requestBody"]
>["content"]["application/json"];
export type AdminImpersonateStartResponse =
	operations["POST:skyforge.AdminImpersonateStart"]["responses"][200]["content"]["application/json"];
export async function adminImpersonateStart(
	body: AdminImpersonateStartRequest,
): Promise<AdminImpersonateStartResponse> {
	return apiFetch<AdminImpersonateStartResponse>(
		"/api/admin/impersonate/start",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export type AdminImpersonateStopResponse =
	operations["POST:skyforge.AdminImpersonateStop"]["responses"][200]["content"]["application/json"];
export async function adminImpersonateStop(): Promise<AdminImpersonateStopResponse> {
	return apiFetch<AdminImpersonateStopResponse>("/api/admin/impersonate/stop", {
		method: "POST",
		body: "{}",
	});
}

export type AdminReconcileQueuedTasksRequest = NonNullable<
	operations["POST:skyforge.ReconcileQueuedTasks"]["requestBody"]
>["content"]["application/json"];
export type AdminReconcileQueuedTasksResponse =
	operations["POST:skyforge.ReconcileQueuedTasks"]["responses"][200]["content"]["application/json"];
export async function reconcileQueuedTasks(
	body: AdminReconcileQueuedTasksRequest,
): Promise<AdminReconcileQueuedTasksResponse> {
	return apiFetch<AdminReconcileQueuedTasksResponse>(
		"/api/admin/tasks/reconcile",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export type AdminReconcileRunningTasksRequest = NonNullable<
	operations["POST:skyforge.ReconcileRunningTasks"]["requestBody"]
>["content"]["application/json"];
export type AdminReconcileRunningTasksResponse =
	operations["POST:skyforge.ReconcileRunningTasks"]["responses"][200]["content"]["application/json"];
export async function reconcileRunningTasks(
	body: AdminReconcileRunningTasksRequest,
): Promise<AdminReconcileRunningTasksResponse> {
	return apiFetch<AdminReconcileRunningTasksResponse>(
		"/api/admin/tasks/reconcile-running",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export type AdminPurgeUserRequest = NonNullable<
	operations["POST:skyforge.PurgeUser"]["requestBody"]
>["content"]["application/json"];
export type AdminPurgeUserResponse =
	operations["POST:skyforge.PurgeUser"]["responses"][200]["content"]["application/json"];
export type AdminPurgeUserResult = AdminPurgeUserResponse & {
	deletedUserContexts: number;
};
export async function adminPurgeUser(
	body: AdminPurgeUserRequest,
): Promise<AdminPurgeUserResult> {
	const resp = await apiFetch<AdminPurgeUserResponse>(
		"/api/admin/users/purge",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
	return {
		...resp,
		deletedUserContexts: Number(
			(resp as { deletedUserContexts?: number }).deletedUserContexts ?? 0,
		),
	};
}

export type GovernancePolicy = {
	maxDeploymentsPerUser: number;
	maxCollectorsPerUser: number;
	allowUserByosNetlabServers?: boolean;
	allowUserByosContainerlabServers?: boolean;
	allowUserExternalTemplateRepos?: boolean;
	allowCustomTemplateRepos?: boolean;
};

export type AdminGovernancePolicyResponse = {
	policy: GovernancePolicy;
	retrievedAt: string;
};

export async function getGovernancePolicy(): Promise<AdminGovernancePolicyResponse> {
	return apiFetch<AdminGovernancePolicyResponse>(
		"/api/admin/governance/policy",
	);
}

export type UpdateGovernancePolicyRequest = {
	policy: GovernancePolicy;
};
export type UpdateGovernancePolicyResponse = {
	status: "ok";
	policy: GovernancePolicy;
	updatedAt: string;
};
export async function updateGovernancePolicy(
	body: UpdateGovernancePolicyRequest,
): Promise<UpdateGovernancePolicyResponse> {
	return apiFetch<UpdateGovernancePolicyResponse>(
		"/api/admin/governance/policy",
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function startDeployment(
	userContextId: string,
	deploymentId: string,
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/start`,
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function stopDeployment(
	userContextId: string,
	deploymentId: string,
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/stop`,
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function destroyDeployment(
	userContextId: string,
	deploymentId: string,
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}/destroy`,
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function deleteDeployment(
	userContextId: string,
	deploymentId: string,
	params?: { forwardDelete?: boolean },
): Promise<JSONMap> {
	const qs = new URLSearchParams();
	if (params?.forwardDelete) qs.set("forward_delete", "true");
	const suffix = qs.toString();
	return apiFetch<JSONMap>(
		`/api/personal/deployments/${encodeURIComponent(deploymentId)}${
			suffix ? `?${suffix}` : ""
		}`,
		{
			method: "DELETE",
		},
	);
}

export type UIConfigResponse =
	operations["GET:skyforge.GetUIConfig"]["responses"][200]["content"]["application/json"];
export async function getUIConfig(): Promise<UIConfigResponse> {
	return apiFetch<UIConfigResponse>("/api/ui/config");
}

export type StatusSummaryResponse =
	operations["GET:skyforge.StatusSummary"]["responses"][200]["content"]["application/json"] & {
		deploymentsTotal?: number;
		deploymentsActive?: number;
	};
export async function getStatusSummary(): Promise<StatusSummaryResponse> {
	return apiFetch<StatusSummaryResponse>("/status/summary");
}

export async function cancelRun(
	taskId: string | number,
	userContextId: string,
): Promise<JSONMap> {
	void userContextId;
	return apiFetch<JSONMap>(
		`/api/runs/${encodeURIComponent(String(taskId))}/cancel`,
		{
			method: "POST",
			body: "{}",
		},
	);
}

export type UserContextVariableGroup = {
	id: number;
	name: string;
	variables: Record<string, string>;
};
export type UserContextVariableGroupListResponse = {
	groups: UserContextVariableGroup[];
};
export type UserContextVariableGroupUpsertRequest = {
	name: string;
	variables: Record<string, string>;
};

export async function listUserContextVariableGroups(
	userContextId: string,
): Promise<UserContextVariableGroupListResponse> {
	return apiFetch<UserContextVariableGroupListResponse>(
		`/api/personal/variable-groups`,
	);
}

export async function createUserContextVariableGroup(
	userContextId: string,
	body: UserContextVariableGroupUpsertRequest,
): Promise<UserContextVariableGroup> {
	return apiFetch<UserContextVariableGroup>(`/api/personal/variable-groups`, {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function updateUserContextVariableGroup(
	userContextId: string,
	groupId: number,
	body: UserContextVariableGroupUpsertRequest,
): Promise<UserContextVariableGroup> {
	return apiFetch<UserContextVariableGroup>(
		`/api/personal/variable-groups/${encodeURIComponent(groupId)}`,
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteUserContextVariableGroup(
	userContextId: string,
	groupId: number,
): Promise<UserContextVariableGroupListResponse> {
	return apiFetch<UserContextVariableGroupListResponse>(
		`/api/personal/variable-groups/${encodeURIComponent(groupId)}`,
		{
			method: "DELETE",
		},
	);
}

export type UserVariableGroup = {
	id: number;
	name: string;
	variables: Record<string, string>;
};

export type UserVariableGroupListResponse = {
	groups: UserVariableGroup[];
};

export type UserVariableGroupUpsertRequest = {
	name: string;
	variables: Record<string, string>;
};

export async function listUserVariableGroups(): Promise<UserVariableGroupListResponse> {
	return apiFetch<UserVariableGroupListResponse>(
		"/api/personal/variable-groups",
	);
}

export async function createUserVariableGroup(
	body: UserVariableGroupUpsertRequest,
): Promise<UserVariableGroup> {
	return apiFetch<UserVariableGroup>("/api/personal/variable-groups", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function updateUserVariableGroup(
	groupId: number,
	body: UserVariableGroupUpsertRequest,
): Promise<UserVariableGroup> {
	return apiFetch<UserVariableGroup>(
		`/api/personal/variable-groups/${encodeURIComponent(groupId)}`,
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteUserVariableGroup(
	groupId: number,
): Promise<UserVariableGroupListResponse> {
	return apiFetch<UserVariableGroupListResponse>(
		`/api/personal/variable-groups/${encodeURIComponent(groupId)}`,
		{
			method: "DELETE",
		},
	);
}

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
	userContextId: string;
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
	userContextId: string;
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
	userContextId: string;
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
	userContextId: string;
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
	credentialId?: string;
	baseUrl: string;
	skipTlsVerify: boolean;
	username: string;
	password?: string;
};

export type PolicyReportZone = {
	id: string;
	userContextId: string;
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
	userContextId: string;
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
	userContextId: string;
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
	userContextId: string;
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

export async function getUserContextPolicyReportChecks(
	userContextId: string,
): Promise<PolicyReportChecksResponse> {
	return apiFetch<PolicyReportChecksResponse>(
		`/api/personal/policy-reports/checks`,
	);
}

export async function getUserContextPolicyReportCheck(
	userContextId: string,
	checkId: string,
): Promise<PolicyReportCheckResponse> {
	return apiFetch<PolicyReportCheckResponse>(
		`/api/personal/policy-reports/checks/${encodeURIComponent(checkId)}`,
	);
}

export async function getUserContextPolicyReportPacks(
	userContextId: string,
): Promise<PolicyReportPacks> {
	return apiFetch<PolicyReportPacks>(`/api/personal/policy-reports/packs`);
}

export async function getUserContextPolicyReportSnapshots(
	userContextId: string,
	networkId: string,
	maxResults?: number,
): Promise<PolicyReportSnapshotsResponse> {
	const qs = new URLSearchParams();
	qs.set("networkId", networkId);
	if (typeof maxResults === "number") {
		qs.set("maxResults", String(maxResults));
	}
	return apiFetch<PolicyReportSnapshotsResponse>(
		`/api/personal/policy-reports/snapshots?${qs.toString()}`,
	);
}

export async function runUserContextPolicyReportCheck(
	userContextId: string,
	body: PolicyReportRunCheckRequest,
): Promise<PolicyReportNQEResponse> {
	return apiFetch<PolicyReportNQEResponse>(
		`/api/personal/policy-reports/checks/run`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function runUserContextPolicyReportPack(
	userContextId: string,
	body: PolicyReportRunPackRequest,
): Promise<PolicyReportRunPackResponse> {
	return apiFetch<PolicyReportRunPackResponse>(
		`/api/personal/policy-reports/packs/run`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function runUserContextPolicyReportPackDelta(
	userContextId: string,
	body: PolicyReportPackDeltaRequest,
): Promise<PolicyReportPackDeltaResponse> {
	return apiFetch<PolicyReportPackDeltaResponse>(
		`/api/personal/policy-reports/packs/delta`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function createUserContextPolicyReportRecertCampaign(
	userContextId: string,
	body: PolicyReportCreateRecertCampaignRequest,
): Promise<PolicyReportRecertCampaignWithCounts> {
	return apiFetch<PolicyReportRecertCampaignWithCounts>(
		`/api/personal/policy-reports/governance/campaigns`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listUserContextPolicyReportRecertCampaigns(
	userContextId: string,
	status?: string,
	limit?: number,
): Promise<PolicyReportListRecertCampaignsResponse> {
	const qs = new URLSearchParams();
	if (status) qs.set("status", status);
	if (typeof limit === "number") qs.set("limit", String(limit));
	return apiFetch<PolicyReportListRecertCampaignsResponse>(
		`/api/personal/policy-reports/governance/campaigns?${qs.toString()}`,
	);
}

export async function getUserContextPolicyReportRecertCampaign(
	userContextId: string,
	campaignId: string,
): Promise<PolicyReportRecertCampaignWithCounts> {
	return apiFetch<PolicyReportRecertCampaignWithCounts>(
		`/api/personal/policy-reports/governance/campaigns/${encodeURIComponent(campaignId)}`,
	);
}

export async function generateUserContextPolicyReportRecertAssignments(
	userContextId: string,
	campaignId: string,
	body: PolicyReportGenerateRecertAssignmentsRequest,
): Promise<PolicyReportGenerateRecertAssignmentsResponse> {
	return apiFetch<PolicyReportGenerateRecertAssignmentsResponse>(
		`/api/personal/policy-reports/governance/campaigns/${encodeURIComponent(campaignId)}/generate`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listUserContextPolicyReportRecertAssignments(
	userContextId: string,
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
		`/api/personal/policy-reports/governance/assignments?${qs.toString()}`,
	);
}

export async function attestUserContextPolicyReportRecertAssignment(
	userContextId: string,
	assignmentId: string,
	body: PolicyReportAttestAssignmentRequest,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/personal/policy-reports/governance/assignments/${encodeURIComponent(assignmentId)}/attest`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function waiveUserContextPolicyReportRecertAssignment(
	userContextId: string,
	assignmentId: string,
	body: PolicyReportAttestAssignmentRequest,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/personal/policy-reports/governance/assignments/${encodeURIComponent(assignmentId)}/waive`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

// Forward Networks (generic user-saved networks; used by capacity tooling)

export async function createUserForwardNetwork(
	body: PolicyReportCreateForwardNetworkRequest,
): Promise<PolicyReportForwardNetwork> {
	return apiFetch<PolicyReportForwardNetwork>(`/api/fwd/networks`, {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function listUserForwardNetworks(): Promise<PolicyReportListForwardNetworksResponse> {
	return apiFetch<PolicyReportListForwardNetworksResponse>(`/api/fwd/networks`);
}

export async function deleteUserForwardNetwork(
	networkRef: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}`,
		{ method: "DELETE" },
	);
}

export async function createUserContextForwardNetwork(
	userContextId: string,
	body: PolicyReportCreateForwardNetworkRequest,
): Promise<PolicyReportForwardNetwork> {
	return apiFetch<PolicyReportForwardNetwork>(`/api/fwd/networks`, {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function listUserContextForwardNetworks(
	userContextId: string,
): Promise<PolicyReportListForwardNetworksResponse> {
	return apiFetch<PolicyReportListForwardNetworksResponse>(`/api/fwd/networks`);
}

export async function deleteUserContextForwardNetwork(
	userContextId: string,
	networkRef: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}`,
		{ method: "DELETE" },
	);
}

export async function createUserContextPolicyReportForwardNetwork(
	userContextId: string,
	body: PolicyReportCreateForwardNetworkRequest,
): Promise<PolicyReportForwardNetwork> {
	return apiFetch<PolicyReportForwardNetwork>(
		`/api/personal/policy-reports/networks`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listUserContextPolicyReportForwardNetworks(
	userContextId: string,
): Promise<PolicyReportListForwardNetworksResponse> {
	return apiFetch<PolicyReportListForwardNetworksResponse>(
		`/api/personal/policy-reports/networks`,
	);
}

export async function deleteUserContextPolicyReportForwardNetwork(
	userContextId: string,
	networkRef: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/personal/policy-reports/networks/${encodeURIComponent(networkRef)}`,
		{ method: "DELETE" },
	);
}

export async function getUserContextPolicyReportForwardNetworkCredentials(
	userContextId: string,
	forwardNetworkId: string,
): Promise<PolicyReportForwardCredentialsStatus> {
	return apiFetch<PolicyReportForwardCredentialsStatus>(
		`/api/personal/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/credentials`,
	);
}

export async function putUserContextPolicyReportForwardNetworkCredentials(
	userContextId: string,
	forwardNetworkId: string,
	body: PolicyReportPutForwardCredentialsRequest,
): Promise<PolicyReportForwardCredentialsStatus> {
	return apiFetch<PolicyReportForwardCredentialsStatus>(
		`/api/personal/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/credentials`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export async function deleteUserContextPolicyReportForwardNetworkCredentials(
	userContextId: string,
	forwardNetworkId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/personal/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/credentials`,
		{ method: "DELETE" },
	);
}

export async function createUserContextPolicyReportZone(
	userContextId: string,
	forwardNetworkId: string,
	body: PolicyReportCreateZoneRequest,
): Promise<PolicyReportZone> {
	return apiFetch<PolicyReportZone>(
		`/api/personal/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/zones`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function listUserContextPolicyReportZones(
	userContextId: string,
	forwardNetworkId: string,
): Promise<PolicyReportListZonesResponse> {
	return apiFetch<PolicyReportListZonesResponse>(
		`/api/personal/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/zones`,
	);
}

export async function updateUserContextPolicyReportZone(
	userContextId: string,
	forwardNetworkId: string,
	zoneId: string,
	body: PolicyReportUpdateZoneRequest,
): Promise<PolicyReportZone> {
	return apiFetch<PolicyReportZone>(
		`/api/personal/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/zones/${encodeURIComponent(zoneId)}`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export async function deleteUserContextPolicyReportZone(
	userContextId: string,
	forwardNetworkId: string,
	zoneId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/personal/policy-reports/networks/${encodeURIComponent(forwardNetworkId)}/zones/${encodeURIComponent(zoneId)}`,
		{ method: "DELETE" },
	);
}

export async function createUserContextPolicyReportPreset(
	userContextId: string,
	body: PolicyReportCreatePresetRequest,
): Promise<PolicyReportPreset> {
	return apiFetch<PolicyReportPreset>(`/api/personal/policy-reports/presets`, {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function listUserContextPolicyReportPresets(
	userContextId: string,
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
		`/api/personal/policy-reports/presets${q ? `?${q}` : ""}`,
	);
}

export async function deleteUserContextPolicyReportPreset(
	userContextId: string,
	presetId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/personal/policy-reports/presets/${encodeURIComponent(presetId)}`,
		{ method: "DELETE" },
	);
}

export async function runUserContextPolicyReportPreset(
	userContextId: string,
	presetId: string,
): Promise<PolicyReportRunPresetResponse> {
	return apiFetch<PolicyReportRunPresetResponse>(
		`/api/personal/policy-reports/presets/${encodeURIComponent(presetId)}/run`,
		{ method: "POST", body: "{}" },
	);
}

export async function runUserContextPolicyReportPathsEnforcementBypass(
	userContextId: string,
	body: PolicyReportPathsEnforcementBypassRequest,
): Promise<PolicyReportNQEResponse> {
	return apiFetch<PolicyReportNQEResponse>(
		`/api/personal/policy-reports/paths/enforcement-bypass`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function storeUserContextPolicyReportPathsEnforcementBypass(
	userContextId: string,
	body: PolicyReportPathsEnforcementBypassStoreRequest,
): Promise<PolicyReportPathsEnforcementBypassStoreResponse> {
	return apiFetch<PolicyReportPathsEnforcementBypassStoreResponse>(
		`/api/personal/policy-reports/paths/enforcement-bypass/store`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function createUserContextPolicyReportRun(
	userContextId: string,
	body: PolicyReportCreateRunRequest,
): Promise<PolicyReportCreateRunResponse> {
	return apiFetch<PolicyReportCreateRunResponse>(
		`/api/personal/policy-reports/runs`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function createUserContextPolicyReportCustomRun(
	userContextId: string,
	body: PolicyReportCreateCustomRunRequest,
): Promise<PolicyReportCreateCustomRunResponse> {
	return apiFetch<PolicyReportCreateCustomRunResponse>(
		`/api/personal/policy-reports/runs/custom`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function listUserContextPolicyReportRuns(
	userContextId: string,
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
		`/api/personal/policy-reports/runs?${qs.toString()}`,
	);
}

export async function getUserContextPolicyReportRun(
	userContextId: string,
	runId: string,
): Promise<PolicyReportGetRunResponse> {
	return apiFetch<PolicyReportGetRunResponse>(
		`/api/personal/policy-reports/runs/${encodeURIComponent(runId)}`,
	);
}

export async function listUserContextPolicyReportRunFindings(
	userContextId: string,
	runId: string,
	checkId?: string,
	limit?: number,
): Promise<PolicyReportListRunFindingsResponse> {
	const qs = new URLSearchParams();
	if (checkId) qs.set("checkId", checkId);
	if (typeof limit === "number") qs.set("limit", String(limit));
	const q = qs.toString();
	return apiFetch<PolicyReportListRunFindingsResponse>(
		`/api/personal/policy-reports/runs/${encodeURIComponent(runId)}/findings${q ? `?${q}` : ""}`,
	);
}

export async function listUserContextPolicyReportFindings(
	userContextId: string,
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
		`/api/personal/policy-reports/findings?${qs.toString()}`,
	);
}

export async function createUserContextPolicyReportException(
	userContextId: string,
	body: PolicyReportCreateExceptionRequest,
): Promise<PolicyReportException> {
	return apiFetch<PolicyReportException>(
		`/api/personal/policy-reports/governance/exceptions`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listUserContextPolicyReportExceptions(
	userContextId: string,
	forwardNetworkId?: string,
	status?: string,
	limit?: number,
): Promise<PolicyReportListExceptionsResponse> {
	const qs = new URLSearchParams();
	if (forwardNetworkId) qs.set("forwardNetworkId", forwardNetworkId);
	if (status) qs.set("status", status);
	if (typeof limit === "number") qs.set("limit", String(limit));
	return apiFetch<PolicyReportListExceptionsResponse>(
		`/api/personal/policy-reports/governance/exceptions?${qs.toString()}`,
	);
}

export async function approveUserContextPolicyReportException(
	userContextId: string,
	exceptionId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/personal/policy-reports/governance/exceptions/${encodeURIComponent(exceptionId)}/approve`,
		{ method: "POST", body: "{}" },
	);
}

export async function rejectUserContextPolicyReportException(
	userContextId: string,
	exceptionId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/personal/policy-reports/governance/exceptions/${encodeURIComponent(exceptionId)}/reject`,
		{ method: "POST", body: "{}" },
	);
}

export async function simulateUserContextPolicyReportChangePlanning(
	userContextId: string,
	body: PolicyReportChangePlanningRequest,
): Promise<PolicyReportChangePlanningResponse> {
	return apiFetch<PolicyReportChangePlanningResponse>(
		`/api/personal/policy-reports/change-planning/simulate`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

// User-centric aliases (user-first naming in portal code)
export type UserDeployment = UserContextDeployment;
export type UserTemplatesResponse = UserContextTemplatesResponse;
export type CreateUserDeploymentRequest = CreateUserContextDeploymentRequest;
export type CreateUserDeploymentResponse = CreateUserContextDeploymentResponse;

export const listUserEveLabs = listUserContextEveLabs;
export const importUserEveLab = importUserContextEveLab;
export const convertUserEveLab = convertUserContextEveLab;
export const getUserForwardNetworkCapacityPortfolio =
	getUserContextForwardNetworkCapacityPortfolio;
export const getUserNetlabTemplates = getUserContextNetlabTemplates;
export const getUserNetlabTemplate = getUserContextNetlabTemplate;
export const validateUserNetlabTemplate = validateUserContextNetlabTemplate;
export const getUserContainerlabTemplates = getUserContextContainerlabTemplates;
export const getUserTerraformTemplates = getUserContextTerraformTemplates;
export const getUserContainerlabTemplate = getUserContextContainerlabTemplate;
export const getUserEveNgTemplates = getUserContextEveNgTemplates;
export const createUserDeployment = createUserContextDeployment;
export const createUserArtifactFolder = createUserContextArtifactFolder;
export const listUserArtifacts = listUserContextArtifacts;
export const downloadUserArtifact = downloadUserContextArtifact;
export const putUserArtifactObject = putUserContextArtifactObject;
export const deleteUserArtifactObject = deleteUserContextArtifactObject;
export const getUserPolicyReportChecks = getUserContextPolicyReportChecks;
export const getUserPolicyReportCheck = getUserContextPolicyReportCheck;
export const getUserPolicyReportPacks = getUserContextPolicyReportPacks;
export const getUserPolicyReportSnapshots = getUserContextPolicyReportSnapshots;
export const runUserPolicyReportCheck = runUserContextPolicyReportCheck;
export const runUserPolicyReportPack = runUserContextPolicyReportPack;
export const runUserPolicyReportPackDelta = runUserContextPolicyReportPackDelta;
export const runUserPolicyReportPathsEnforcementBypass =
	runUserContextPolicyReportPathsEnforcementBypass;
export const storeUserPolicyReportPathsEnforcementBypass =
	storeUserContextPolicyReportPathsEnforcementBypass;
export const createUserPolicyReportRecertCampaign =
	createUserContextPolicyReportRecertCampaign;
export const listUserPolicyReportRecertCampaigns =
	listUserContextPolicyReportRecertCampaigns;
export const getUserPolicyReportRecertCampaign =
	getUserContextPolicyReportRecertCampaign;
export const generateUserPolicyReportRecertAssignments =
	generateUserContextPolicyReportRecertAssignments;
export const listUserPolicyReportRecertAssignments =
	listUserContextPolicyReportRecertAssignments;
export const attestUserPolicyReportRecertAssignment =
	attestUserContextPolicyReportRecertAssignment;
export const waiveUserPolicyReportRecertAssignment =
	waiveUserContextPolicyReportRecertAssignment;
export const createUserPolicyReportForwardNetwork =
	createUserContextPolicyReportForwardNetwork;
export const listUserPolicyReportForwardNetworks =
	listUserContextPolicyReportForwardNetworks;
export const deleteUserPolicyReportForwardNetwork =
	deleteUserContextPolicyReportForwardNetwork;
export const createUserPolicyReportException =
	createUserContextPolicyReportException;
export const listUserPolicyReportExceptions =
	listUserContextPolicyReportExceptions;
export const approveUserPolicyReportException =
	approveUserContextPolicyReportException;
export const rejectUserPolicyReportException =
	rejectUserContextPolicyReportException;
export const createUserPolicyReportCustomRun =
	createUserContextPolicyReportCustomRun;
export const createUserPolicyReportRun = createUserContextPolicyReportRun;
export const listUserPolicyReportRuns = listUserContextPolicyReportRuns;
export const getUserPolicyReportRun = getUserContextPolicyReportRun;
export const listUserPolicyReportRunFindings =
	listUserContextPolicyReportRunFindings;
export const listUserPolicyReportFindings = listUserContextPolicyReportFindings;
export const createUserPolicyReportZone = createUserContextPolicyReportZone;
export const listUserPolicyReportZones = listUserContextPolicyReportZones;
export const updateUserPolicyReportZone = updateUserContextPolicyReportZone;
export const deleteUserPolicyReportZone = deleteUserContextPolicyReportZone;
export const createUserPolicyReportPreset = createUserContextPolicyReportPreset;
export const listUserPolicyReportPresets = listUserContextPolicyReportPresets;
export const deleteUserPolicyReportPreset = deleteUserContextPolicyReportPreset;
export const runUserPolicyReportPreset = runUserContextPolicyReportPreset;
export const getUserPolicyReportForwardNetworkCredentials =
	getUserContextPolicyReportForwardNetworkCredentials;
export const putUserPolicyReportForwardNetworkCredentials =
	putUserContextPolicyReportForwardNetworkCredentials;
export const deleteUserPolicyReportForwardNetworkCredentials =
	deleteUserContextPolicyReportForwardNetworkCredentials;
export const simulateUserPolicyReportChangePlanning =
	simulateUserContextPolicyReportChangePlanning;
