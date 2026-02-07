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
export type SkyforgeWorkspace =
	components["schemas"]["skyforge.SkyforgeWorkspace"];
export type NotificationRecord =
	components["schemas"]["skyforge.NotificationRecord"];

export type UserServiceNowConfigResponse = {
	configured: boolean;
	instanceUrl?: string;
	adminUsername?: string;
	hasAdminPassword: boolean;
	forwardCollectorConfigId?: string;
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

export type UserGeminiConfigResponse = {
	enabled: boolean;
	aiEnabled: boolean;
	oauthConfigured: boolean;
	vertexConfigured: boolean;
	configured: boolean;
	email?: string;
	scopes?: string;
	hasToken: boolean;
	updatedAt?: ISO8601;
	redirectUrl?: string;
	projectId?: string;
	location?: string;
	model?: string;
	fallbackModel?: string;
};

// NOTE: OpenAPI schema may lag behind the live dashboard/deployment view (e.g. activeTaskId/queueDepth).
// This type reflects the fields Skyforge currently emits in the dashboard snapshot and related APIs.
export type WorkspaceDeployment = {
	id: string;
	workspaceId: string;
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
	lastTaskWorkspaceId?: number;
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
	workspaceId: string;
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
	workspaceId: string;
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
	workspaces: SkyforgeWorkspace[];
	deployments: WorkspaceDeployment[];
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
	operations["GET:skyforge.Session"]["responses"][200]["content"]["application/json"];

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

export type GetWorkspacesResponse =
	operations["GET:skyforge.GetWorkspaces"]["responses"][200]["content"]["application/json"];

export async function getWorkspaces(): Promise<GetWorkspacesResponse> {
	return apiFetch<GetWorkspacesResponse>("/api/workspaces");
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

export type WorkspaceNetlabServerConfig = {
	id: string;
	name: string;
	apiUrl: string;
	apiInsecure: boolean;
	apiUser?: string;
	hasPassword?: boolean;
};

export type WorkspaceNetlabServersResponse = {
	workspaceId: string;
	servers: WorkspaceNetlabServerConfig[];
};

export async function listWorkspaceNetlabServers(
	workspaceId: string,
): Promise<WorkspaceNetlabServersResponse> {
	return apiFetch<WorkspaceNetlabServersResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/netlab/servers`,
	);
}

export async function upsertWorkspaceNetlabServer(
	workspaceId: string,
	payload: Partial<WorkspaceNetlabServerConfig> & {
		name: string;
		apiUrl: string;
		apiInsecure: boolean;
		apiPassword?: string;
		apiToken?: string;
	},
): Promise<WorkspaceNetlabServerConfig> {
	return apiFetch<WorkspaceNetlabServerConfig>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/netlab/servers`,
		{
			method: "PUT",
			body: JSON.stringify(payload),
		},
	);
}

export async function deleteWorkspaceNetlabServer(
	workspaceId: string,
	serverId: string,
): Promise<void> {
	await apiFetch<void>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/netlab/servers/${encodeURIComponent(serverId)}`,
		{
			method: "DELETE",
		},
	);
}

export type WorkspaceEveServerConfig = {
	id: string;
	name: string;
	apiUrl: string;
	webUrl?: string;
	skipTlsVerify: boolean;
	apiUser?: string;
	hasPassword?: boolean;
};

export type WorkspaceEveServersResponse = {
	workspaceId: string;
	servers: WorkspaceEveServerConfig[];
};

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

export type WorkspaceEveLabsResponse = {
	workspaceId: string;
	server: string;
	labs: EveLabSummary[];
	folders?: EveFolderInfo[];
};

export type WorkspaceEveImportRequest = {
	server?: string;
	labPath: string;
	deploymentName?: string;
};

export type WorkspaceEveConvertRequest = {
	server?: string;
	labPath: string;
	outputDir?: string;
	outputFile?: string;
	createDeployment?: boolean;
	containerlabServer?: string;
};

export type WorkspaceEveConvertResponse = {
	workspaceId: string;
	path: string;
	deployment?: WorkspaceDeployment;
	warnings?: string[];
};

export async function listWorkspaceEveServers(
	workspaceId: string,
): Promise<WorkspaceEveServersResponse> {
	return apiFetch<WorkspaceEveServersResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/eve/servers`,
	);
}

export async function listWorkspaceEveLabs(
	workspaceId: string,
	params?: { server?: string; path?: string; recursive?: boolean },
): Promise<WorkspaceEveLabsResponse> {
	const qs = new URLSearchParams();
	if (params?.server) qs.set("server", params.server);
	if (params?.path) qs.set("path", params.path);
	if (params?.recursive) qs.set("recursive", "true");
	const suffix = qs.toString();
	return apiFetch<WorkspaceEveLabsResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/eve/labs${suffix ? `?${suffix}` : ""}`,
	);
}

export async function importWorkspaceEveLab(
	workspaceId: string,
	payload: WorkspaceEveImportRequest,
): Promise<WorkspaceDeployment> {
	return apiFetch<WorkspaceDeployment>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/eve/import`,
		{ method: "POST", body: JSON.stringify(payload) },
	);
}

export async function convertWorkspaceEveLab(
	workspaceId: string,
	payload: WorkspaceEveConvertRequest,
): Promise<WorkspaceEveConvertResponse> {
	return apiFetch<WorkspaceEveConvertResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/eve/convert`,
		{ method: "POST", body: JSON.stringify(payload) },
	);
}

export async function upsertWorkspaceEveServer(
	workspaceId: string,
	payload: Partial<WorkspaceEveServerConfig> & {
		name: string;
		apiUrl: string;
		webUrl?: string;
		skipTlsVerify: boolean;
		apiUser?: string;
		apiPassword?: string;
	},
): Promise<WorkspaceEveServerConfig> {
	return apiFetch<WorkspaceEveServerConfig>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/eve/servers`,
		{
			method: "PUT",
			body: JSON.stringify(payload),
		},
	);
}

export async function deleteWorkspaceEveServer(
	workspaceId: string,
	serverId: string,
): Promise<void> {
	await apiFetch<void>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/eve/servers/${encodeURIComponent(serverId)}`,
		{
			method: "DELETE",
		},
	);
}

export async function listForwardCollectors(): Promise<ListForwardCollectorsResponse> {
	return apiFetch<ListForwardCollectorsResponse>("/api/forward/collectors");
}

export async function getUserServiceNowConfig(): Promise<UserServiceNowConfigResponse> {
	return apiFetch<UserServiceNowConfigResponse>(
		"/api/user/integrations/servicenow",
	);
}

export async function putUserServiceNowConfig(
	payload: PutUserServiceNowConfigRequest,
): Promise<UserServiceNowConfigResponse> {
	return apiFetch<UserServiceNowConfigResponse>(
		"/api/user/integrations/servicenow",
		{
			method: "PUT",
			body: JSON.stringify(payload),
		},
	);
}

export async function installUserServiceNowDemo(): Promise<InstallUserServiceNowDemoResponse> {
	return apiFetch<InstallUserServiceNowDemoResponse>(
		"/api/user/integrations/servicenow/install",
		{ method: "POST", body: "{}" },
	);
}

export async function getUserServiceNowPdiStatus(): Promise<ServiceNowPdiStatusResponse> {
	return apiFetch<ServiceNowPdiStatusResponse>(
		"/api/user/integrations/servicenow/pdiStatus",
	);
}

export async function getUserServiceNowSchemaStatus(): Promise<ServiceNowSchemaStatusResponse> {
	return apiFetch<ServiceNowSchemaStatusResponse>(
		"/api/user/integrations/servicenow/schemaStatus",
	);
}

export async function wakeUserServiceNowPdi(): Promise<ServiceNowPdiStatusResponse> {
	return apiFetch<ServiceNowPdiStatusResponse>(
		"/api/user/integrations/servicenow/wake",
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function configureForwardServiceNowTicketing(): Promise<ConfigureForwardServiceNowTicketingResponse> {
	return apiFetch<ConfigureForwardServiceNowTicketingResponse>(
		"/api/user/integrations/servicenow/configureForwardTicketing",
		{ method: "POST", body: "{}" },
	);
}

export async function getUserGeminiConfig(): Promise<UserGeminiConfigResponse> {
	return apiFetch<UserGeminiConfigResponse>("/api/user/integrations/gemini");
}

export async function disconnectUserGemini(): Promise<void> {
	await apiFetch<void>("/api/user/integrations/gemini/disconnect", {
		method: "POST",
		body: "{}",
	});
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
	return apiFetch<UserElasticConfigResponse>("/api/user/integrations/elastic");
}

export async function putUserElasticConfig(
	payload: PutUserElasticConfigRequest,
): Promise<UserElasticConfigResponse> {
	return apiFetch<UserElasticConfigResponse>("/api/user/integrations/elastic", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function clearUserElasticConfig(): Promise<void> {
	await apiFetch<void>("/api/user/integrations/elastic/clear", {
		method: "POST",
		body: "{}",
	});
}

export async function testUserElasticConfig(): Promise<UserElasticTestResponse> {
	return apiFetch<UserElasticTestResponse>(
		"/api/user/integrations/elastic/test",
		{
			method: "POST",
			body: "{}",
		},
	);
}

export type UserAIGenerateRequest = {
	provider?: "gemini";
	kind: "netlab" | "containerlab";
	prompt: string;
	constraints?: string[];
	seedTemplate?: string;
	maxOutputTokens?: number;
	temperature?: number;
};

export type UserAIGenerateResponse = {
	id: string;
	provider: string;
	kind: string;
	filename: string;
	content: string;
	warnings?: string[];
	createdAt: string;
};

export type UserAIHistoryResponse = {
	items: Array<{
		id: string;
		provider: string;
		kind: string;
		filename: string;
		createdAt: string;
	}>;
};

export async function generateUserAITemplate(
	payload: UserAIGenerateRequest,
	opts?: { signal?: AbortSignal },
): Promise<UserAIGenerateResponse> {
	return apiFetch<UserAIGenerateResponse>("/api/user/ai/generate", {
		method: "POST",
		body: JSON.stringify(payload),
		signal: opts?.signal,
	});
}

export async function getUserAIHistory(): Promise<UserAIHistoryResponse> {
	return apiFetch<UserAIHistoryResponse>("/api/user/ai/history");
}

export type UserAISaveRequest = {
	kind: "netlab" | "containerlab";
	content: string;
	pathHint?: string;
	filename?: string;
	message?: string;
};

export type UserAISaveResponse = {
	workspaceId: string;
	repo: string;
	branch: string;
	path: string;
};

export async function saveUserAITemplate(
	payload: UserAISaveRequest,
): Promise<UserAISaveResponse> {
	return apiFetch<UserAISaveResponse>("/api/user/ai/save", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export type UserAIValidateRequest = {
	kind: "netlab" | "containerlab";
	content: string;
	environment?: Record<string, unknown>;
	setOverrides?: string[];
};

export type UserAIValidateResponse = {
	workspaceId: string;
	task: {
		id?: number;
		ok?: boolean;
		errors?: unknown;
	} & Record<string, unknown>;
};

export async function validateUserAITemplate(
	payload: UserAIValidateRequest,
): Promise<UserAIValidateResponse> {
	return apiFetch<UserAIValidateResponse>("/api/user/ai/validate", {
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
	return apiFetch<UserAIAutofixResponse>("/api/user/ai/autofix", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

export type UserGitCredentialsResponse = {
	username: string;
	sshPublicKey: string;
	hasSshKey: boolean;
	httpsUsername?: string;
	hasHttpsToken: boolean;
};

export async function getUserGitCredentials(): Promise<UserGitCredentialsResponse> {
	return apiFetch<UserGitCredentialsResponse>("/api/user/git-credentials");
}

export async function updateUserGitCredentials(payload: {
	httpsUsername?: string;
	httpsToken?: string;
	clearToken?: boolean;
}): Promise<UserGitCredentialsResponse> {
	return apiFetch<UserGitCredentialsResponse>("/api/user/git-credentials", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function rotateUserGitDeployKey(): Promise<UserGitCredentialsResponse> {
	return apiFetch<UserGitCredentialsResponse>(
		"/api/user/git-credentials/rotate",
		{
			method: "POST",
			body: "{}",
		},
	);
}

export type UserSettingsResponse = {
	defaultForwardCollectorConfigId?: string;
	defaultEnv?: Array<{ key: string; value: string }>;
	externalTemplateRepos?: ExternalTemplateRepo[];
	updatedAt?: string;
};

export async function getUserSettings(): Promise<UserSettingsResponse> {
	return apiFetch<UserSettingsResponse>("/api/user/settings");
}

export async function putUserSettings(payload: {
	defaultForwardCollectorConfigId?: string;
	defaultEnv?: Array<{ key: string; value: string }>;
	externalTemplateRepos?: ExternalTemplateRepo[];
}): Promise<UserSettingsResponse> {
	return apiFetch<UserSettingsResponse>("/api/user/settings", {
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
		"/api/user/cloud/aws-static",
	);
}

export async function putUserAWSStaticCredentials(payload: {
	accessKeyId: string;
	secretAccessKey: string;
}): Promise<UserAWSStaticCredentialsGetResponse> {
	return apiFetch<UserAWSStaticCredentialsGetResponse>(
		"/api/user/cloud/aws-static",
		{
			method: "PUT",
			body: JSON.stringify(payload),
		},
	);
}

export async function deleteUserAWSStaticCredentials(): Promise<void> {
	await apiFetch<void>("/api/user/cloud/aws-static", { method: "DELETE" });
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
	return apiFetch<UserAWSSSOCredentialsResponse>("/api/user/cloud/aws-sso");
}

export async function putUserAWSSSOCredentials(payload: {
	startUrl: string;
	region: string;
	accountId: string;
	roleName: string;
}): Promise<UserAWSSSOCredentialsResponse> {
	return apiFetch<UserAWSSSOCredentialsResponse>("/api/user/cloud/aws-sso", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserAWSSSOCredentials(): Promise<void> {
	await apiFetch<void>("/api/user/cloud/aws-sso", { method: "DELETE" });
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
	return apiFetch<UserAzureCredentialsResponse>("/api/user/cloud/azure");
}

export async function putUserAzureCredentials(payload: {
	tenantId: string;
	clientId: string;
	clientSecret: string;
	subscriptionId?: string;
}): Promise<UserAzureCredentialsResponse> {
	return apiFetch<UserAzureCredentialsResponse>("/api/user/cloud/azure", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserAzureCredentials(): Promise<void> {
	await apiFetch<void>("/api/user/cloud/azure", { method: "DELETE" });
}

export type UserGCPCredentialsResponse = {
	configured: boolean;
	projectId?: string;
	hasServiceAccountJSON: boolean;
	updatedAt?: ISO8601;
};

export async function getUserGCPCredentials(): Promise<UserGCPCredentialsResponse> {
	return apiFetch<UserGCPCredentialsResponse>("/api/user/cloud/gcp");
}

export async function putUserGCPCredentials(payload: {
	projectId: string;
	serviceAccountJSON: string;
}): Promise<UserGCPCredentialsResponse> {
	return apiFetch<UserGCPCredentialsResponse>("/api/user/cloud/gcp", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserGCPCredentials(): Promise<void> {
	await apiFetch<void>("/api/user/cloud/gcp", { method: "DELETE" });
}

export type UserIBMCredentialsResponse = {
	configured: boolean;
	region?: string;
	resourceGroupId?: string;
	hasApiKey: boolean;
	updatedAt?: ISO8601;
};

export async function getUserIBMCredentials(): Promise<UserIBMCredentialsResponse> {
	return apiFetch<UserIBMCredentialsResponse>("/api/user/cloud/ibm");
}

export async function putUserIBMCredentials(payload: {
	apiKey: string;
	region: string;
	resourceGroupId?: string;
}): Promise<UserIBMCredentialsResponse> {
	return apiFetch<UserIBMCredentialsResponse>("/api/user/cloud/ibm", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserIBMCredentials(): Promise<void> {
	await apiFetch<void>("/api/user/cloud/ibm", { method: "DELETE" });
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
	return apiFetch<UserNetlabServersResponse>("/api/user/netlab/servers");
}

export async function upsertUserNetlabServer(
	payload: UserNetlabServerConfig,
): Promise<UserNetlabServerConfig> {
	return apiFetch<UserNetlabServerConfig>("/api/user/netlab/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserNetlabServer(serverId: string): Promise<void> {
	await apiFetch<void>(
		`/api/user/netlab/servers/${encodeURIComponent(serverId)}`,
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
	return apiFetch<UserEveServersResponse>("/api/user/eve/servers");
}

export async function upsertUserEveServer(
	payload: UserEveServerConfig,
): Promise<UserEveServerConfig> {
	return apiFetch<UserEveServerConfig>("/api/user/eve/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserEveServer(serverId: string): Promise<void> {
	await apiFetch<void>(
		`/api/user/eve/servers/${encodeURIComponent(serverId)}`,
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
		"/api/user/containerlab/servers",
	);
}

export async function upsertUserContainerlabServer(
	payload: UserContainerlabServerConfig,
): Promise<UserContainerlabServerConfig> {
	return apiFetch<UserContainerlabServerConfig>(
		"/api/user/containerlab/servers",
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
		`/api/user/containerlab/servers/${encodeURIComponent(serverId)}`,
		{ method: "DELETE" },
	);
}

export type UpdateDeploymentForwardConfigRequest = {
	enabled: boolean;
	collectorConfigId?: string;
	collectorUsername?: string;
};

export type UpdateDeploymentForwardConfigResponse = {
	workspaceId: string;
	deploymentId: string;
	enabled: boolean;
	collectorConfigId?: string;
	collectorUsername?: string;
	forwardNetworkId?: string;
	forwardSnapshotUrl?: string;
};

export async function updateDeploymentForwardConfig(
	workspaceId: string,
	deploymentId: string,
	body: UpdateDeploymentForwardConfigRequest,
): Promise<UpdateDeploymentForwardConfigResponse> {
	return apiFetch<UpdateDeploymentForwardConfigResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/forward`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type SyncDeploymentForwardResponse = {
	workspaceId: string;
	deploymentId: string;
	run: JSONMap;
};

export async function syncDeploymentForward(
	workspaceId: string,
	deploymentId: string,
): Promise<SyncDeploymentForwardResponse> {
	return apiFetch<SyncDeploymentForwardResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/forward/sync`,
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
	workspaceId?: string;
};

export type DeploymentCapacitySummaryResponse = {
	workspaceId: string;
	deploymentId: string;
	forwardNetworkId: string;
	asOf?: string;
	rollups: CapacityRollupRow[];
	stale: boolean;
};

export type DeploymentCapacityRefreshResponse = {
	workspaceId: string;
	deploymentId: string;
	run: JSONMap;
};

export type CapacityPerfProxyResponse = {
	body: unknown;
};

export async function getDeploymentCapacitySummary(
	workspaceId: string,
	deploymentId: string,
): Promise<DeploymentCapacitySummaryResponse> {
	return apiFetch<DeploymentCapacitySummaryResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/summary`,
	);
}

export async function refreshDeploymentCapacityRollups(
	workspaceId: string,
	deploymentId: string,
): Promise<DeploymentCapacityRefreshResponse> {
	return apiFetch<DeploymentCapacityRefreshResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/rollups/refresh`,
		{ method: "POST", body: "{}" },
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
	workspaceId: string;
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
	routeScale: CapacityRouteScaleRow[];
	bgpNeighbors: CapacityBgpNeighborRow[];
};

export async function getDeploymentCapacityInventory(
	workspaceId: string,
	deploymentId: string,
): Promise<DeploymentCapacityInventoryResponse> {
	return apiFetch<DeploymentCapacityInventoryResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/inventory`,
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
	workspaceId: string;
	deploymentId: string;
	metric: string;
	window: string;
	objectType?: string;
	asOf?: string;
	compareAsOf?: string;
	compareHours: number;
	rows: CapacityGrowthRow[];
};

export async function getDeploymentCapacityGrowth(
	workspaceId: string,
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
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/growth?${qs.toString()}`,
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
	workspaceId: string,
	deploymentId: string,
	body: PostCapacityInterfaceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/interface-metrics-history`,
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
	workspaceId: string,
	deploymentId: string,
	body: PostCapacityDeviceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/device-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type GetCapacityUnhealthyDevicesQuery = {
	snapshotId?: string;
	endTime?: string;
};

export async function getDeploymentCapacityUnhealthyDevices(
	workspaceId: string,
	deploymentId: string,
	q: GetCapacityUnhealthyDevicesQuery,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/unhealthy-devices${suffix}`,
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
	workspaceId: string,
	deploymentId: string,
	q: GetCapacityUnhealthyInterfacesQuery,
	body: PostCapacityUnhealthyInterfacesRequest,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/unhealthy-interfaces${suffix}`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function setDeploymentLinkImpairment(
	workspaceId: string,
	deploymentId: string,
	body: LinkImpairmentRequest,
): Promise<LinkImpairmentResponse> {
	return apiFetch<LinkImpairmentResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/links/impair`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function setDeploymentLinkAdmin(
	workspaceId: string,
	deploymentId: string,
	body: LinkAdminRequest,
): Promise<LinkAdminResponse> {
	return apiFetch<LinkAdminResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/links/admin`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function captureDeploymentLinkPcap(
	workspaceId: string,
	deploymentId: string,
	body: LinkCaptureRequest,
): Promise<LinkCaptureResponse> {
	return apiFetch<LinkCaptureResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/links/capture`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function getDeploymentNodeInterfaces(
	workspaceId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeInterfacesResponse> {
	return apiFetch<DeploymentNodeInterfacesResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/interfaces`,
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
	workspaceId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeRunningConfigResponse> {
	return apiFetch<DeploymentNodeRunningConfigResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/running-config`,
	);
}

export async function getDeploymentInventory(
	workspaceId: string,
	deploymentId: string,
	format: "json" | "csv" = "json",
): Promise<DeploymentInventoryResponse> {
	const qs = new URLSearchParams();
	qs.set("format", format);
	return apiFetch<DeploymentInventoryResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/inventory?${qs.toString()}`,
	);
}

export async function listDeploymentUIEvents(
	workspaceId: string,
	deploymentId: string,
	params?: { afterId?: number; limit?: number },
): Promise<DeploymentUIEventsResponse> {
	const qs = new URLSearchParams();
	if (params?.afterId) qs.set("after_id", String(params.afterId));
	if (params?.limit) qs.set("limit", String(params.limit));
	const suffix = qs.toString();
	return apiFetch<DeploymentUIEventsResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/ui-events${suffix ? `?${suffix}` : ""}`,
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
	workspaceId: string,
	deploymentId: string,
	nodeId: string,
	params?: { tail?: number; container?: string },
): Promise<DeploymentNodeLogsResponse> {
	const qs = new URLSearchParams();
	if (params?.tail) qs.set("tail", String(params.tail));
	if (params?.container) qs.set("container", params.container);
	const suffix = qs.toString();
	return apiFetch<DeploymentNodeLogsResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/logs${suffix ? `?${suffix}` : ""}`,
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
	workspaceId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeDescribeResponse> {
	return apiFetch<DeploymentNodeDescribeResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/describe`,
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
	workspaceId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeSaveConfigResponse> {
	return apiFetch<DeploymentNodeSaveConfigResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/save-config`,
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
	workspaceId: string,
	deploymentId: string,
): Promise<LinkStatsSnapshot> {
	return apiFetch<LinkStatsSnapshot>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/links/stats`,
	);
}

type TemplatesQuery = {
	source?: "workspace" | "blueprints" | "custom" | "external" | string;
	repo?: string;
	dir?: string;
};

export type WorkspaceTemplatesResponse = {
	workspaceId: string;
	repo: string;
	branch: string;
	dir: string;
	templates: string[];
	headSha?: string;
	cached?: boolean;
	updatedAt?: ISO8601;
};

export async function getWorkspaceNetlabTemplates(
	workspaceId: string,
	query?: TemplatesQuery,
): Promise<WorkspaceTemplatesResponse> {
	const params = new URLSearchParams();
	if (query?.source) params.set("source", query.source);
	if (query?.repo) params.set("repo", query.repo);
	if (query?.dir) params.set("dir", query.dir);
	const qs = params.toString();
	return apiFetch<WorkspaceTemplatesResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/netlab/templates${qs ? `?${qs}` : ""}`,
	);
}

export type WorkspaceNetlabTemplateResponse = {
	workspaceId: string;
	source: string;
	repo?: string;
	branch?: string;
	dir: string;
	template: string;
	path: string;
	yaml: string;
};

export async function getWorkspaceNetlabTemplate(
	workspaceId: string,
	params: { source?: string; repo?: string; dir?: string; template: string },
): Promise<WorkspaceNetlabTemplateResponse> {
	const qs = new URLSearchParams();
	if (params.source) qs.set("source", params.source);
	if (params.repo) qs.set("repo", params.repo);
	if (params.dir) qs.set("dir", params.dir);
	qs.set("template", params.template);
	return apiFetch<WorkspaceNetlabTemplateResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/netlab/template?${qs.toString()}`,
	);
}

export type WorkspaceRunResponse = {
	workspaceId: string;
	task: JSONMap;
	user?: string;
};

export type ValidateWorkspaceNetlabTemplateRequest = {
	source?: string;
	repo?: string;
	dir?: string;
	template: string;
	environment?: JSONMap;
	setOverrides?: string[];
};

export async function validateWorkspaceNetlabTemplate(
	workspaceId: string,
	body: ValidateWorkspaceNetlabTemplateRequest,
): Promise<WorkspaceRunResponse> {
	return apiFetch<WorkspaceRunResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/netlab/validate`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function getWorkspaceContainerlabTemplates(
	workspaceId: string,
	query?: TemplatesQuery,
): Promise<WorkspaceTemplatesResponse> {
	const params = new URLSearchParams();
	if (query?.source) params.set("source", query.source);
	if (query?.repo) params.set("repo", query.repo);
	if (query?.dir) params.set("dir", query.dir);
	const qs = params.toString();
	return apiFetch<WorkspaceTemplatesResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/containerlab/templates${qs ? `?${qs}` : ""}`,
	);
}

export async function getWorkspaceTerraformTemplates(
	workspaceId: string,
	query?: TemplatesQuery,
): Promise<WorkspaceTemplatesResponse> {
	const params = new URLSearchParams();
	if (query?.source) params.set("source", query.source);
	if (query?.repo) params.set("repo", query.repo);
	if (query?.dir) params.set("dir", query.dir);
	const qs = params.toString();
	return apiFetch<WorkspaceTemplatesResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/terraform/templates${qs ? `?${qs}` : ""}`,
	);
}

export type WorkspaceContainerlabTemplateResponse = {
	workspaceId: string;
	source: string;
	repo?: string;
	branch?: string;
	dir: string;
	file: string;
	path: string;
	yaml: string;
};

export async function getWorkspaceContainerlabTemplate(
	workspaceId: string,
	params: { source?: string; repo?: string; dir?: string; file: string },
): Promise<WorkspaceContainerlabTemplateResponse> {
	const qs = new URLSearchParams();
	if (params.source) qs.set("source", params.source);
	if (params.repo) qs.set("repo", params.repo);
	if (params.dir) qs.set("dir", params.dir);
	qs.set("file", params.file);
	return apiFetch<WorkspaceContainerlabTemplateResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/containerlab/template?${qs.toString()}`,
	);
}

export async function getWorkspaceEveNgTemplates(
	workspaceId: string,
	query?: TemplatesQuery,
): Promise<WorkspaceTemplatesResponse> {
	const params = new URLSearchParams();
	if (query?.source) params.set("source", query.source);
	if (query?.repo) params.set("repo", query.repo);
	if (query?.dir) params.set("dir", query.dir);
	const qs = params.toString();
	return apiFetch<WorkspaceTemplatesResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/eve-ng/templates${qs ? `?${qs}` : ""}`,
	);
}

export type CreateWorkspaceDeploymentRequest = NonNullable<
	operations["POST:skyforge.CreateWorkspaceDeployment"]["requestBody"]
>["content"]["application/json"];
export type CreateWorkspaceDeploymentResponse =
	operations["POST:skyforge.CreateWorkspaceDeployment"]["responses"][200]["content"]["application/json"];

export async function createWorkspaceDeployment(
	workspaceId: string,
	body: CreateWorkspaceDeploymentRequest,
): Promise<CreateWorkspaceDeploymentResponse> {
	return apiFetch<CreateWorkspaceDeploymentResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments`,
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
	workspaceId: string;
	deployment?: WorkspaceDeployment;
	run?: JSONMap;
	note?: string;
};

export async function createContainerlabDeploymentFromYAML(
	workspaceId: string,
	body: CreateContainerlabDeploymentFromYAMLRequest,
): Promise<CreateContainerlabDeploymentFromYAMLResponse> {
	return apiFetch<CreateContainerlabDeploymentFromYAMLResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments-designer/containerlab/from-yaml`,
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
	workspaceId: string;
	deployment?: WorkspaceDeployment;
	run?: JSONMap;
	note?: string;
};

export async function createClabernetesDeploymentFromYAML(
	workspaceId: string,
	body: CreateClabernetesDeploymentFromYAMLRequest,
): Promise<CreateClabernetesDeploymentFromYAMLResponse> {
	return apiFetch<CreateClabernetesDeploymentFromYAMLResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments-designer/clabernetes/from-yaml`,
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
	workspaceId: string;
	branch: string;
	templatesDir: string;
	template: string;
	filePath: string;
};

export async function saveContainerlabTopologyYAML(
	workspaceId: string,
	body: SaveContainerlabTopologyYAMLRequest,
): Promise<SaveContainerlabTopologyYAMLResponse> {
	return apiFetch<SaveContainerlabTopologyYAMLResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/containerlab/topologies`,
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
	workspaceId: string;
	deployment?: WorkspaceDeployment;
	run?: JSONMap;
	note?: string;
};

export type CreateContainerlabDeploymentFromTemplateRequest =
	CreateDeploymentFromTemplateRequest & {
		netlabServer?: string;
	};

export async function createClabernetesDeploymentFromTemplate(
	workspaceId: string,
	body: CreateDeploymentFromTemplateRequest,
): Promise<CreateDeploymentFromTemplateResponse> {
	return apiFetch<CreateDeploymentFromTemplateResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments-designer/clabernetes/from-template`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function createContainerlabDeploymentFromTemplate(
	workspaceId: string,
	body: CreateContainerlabDeploymentFromTemplateRequest,
): Promise<CreateDeploymentFromTemplateResponse> {
	return apiFetch<CreateDeploymentFromTemplateResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments-designer/containerlab/from-template`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type CreateWorkspaceRequest = NonNullable<
	operations["POST:skyforge.CreateWorkspace"]["requestBody"]
>["content"]["application/json"];

export type CreateWorkspaceResponse =
	operations["POST:skyforge.CreateWorkspace"]["responses"][200]["content"]["application/json"];

export async function createWorkspace(
	body: CreateWorkspaceRequest,
): Promise<CreateWorkspaceResponse> {
	return apiFetch<CreateWorkspaceResponse>("/api/workspaces", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export type UpdateWorkspaceMembersRequest = NonNullable<
	operations["PUT:skyforge.UpdateWorkspaceMembers"]["requestBody"]
>["content"]["application/json"];
export type UpdateWorkspaceMembersResponse =
	operations["PUT:skyforge.UpdateWorkspaceMembers"]["responses"][200]["content"]["application/json"];
export async function updateWorkspaceMembers(
	workspaceId: string,
	body: UpdateWorkspaceMembersRequest,
): Promise<UpdateWorkspaceMembersResponse> {
	return apiFetch<UpdateWorkspaceMembersResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/members`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export async function getDeploymentTopology(
	workspaceId: string,
	deploymentId: string,
): Promise<DeploymentTopology> {
	return apiFetch<DeploymentTopology>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/topology`,
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

export type DeleteWorkspaceResponse =
	operations["DELETE:skyforge.DeleteWorkspace"]["responses"][200]["content"]["application/json"];
export async function deleteWorkspace(
	workspaceId: string,
	params: { confirm: string; force?: boolean },
): Promise<DeleteWorkspaceResponse> {
	const qs = new URLSearchParams();
	qs.set("confirm", params.confirm);
	if (params.force) qs.set("force", "true");
	return apiFetch<DeleteWorkspaceResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}?${qs.toString()}`,
		{ method: "DELETE" },
	);
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
	username: string;
	password: string;
	setDefault?: boolean;
};

export type DeleteUserForwardCollectorConfigResponse = {
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

export type UpdateWorkspaceSettingsRequest = NonNullable<
	operations["PUT:skyforge.UpdateWorkspaceSettings"]["requestBody"]
>["content"]["application/json"];
export type UpdateWorkspaceSettingsResponse =
	operations["PUT:skyforge.UpdateWorkspaceSettings"]["responses"][200]["content"]["application/json"];
export async function updateWorkspaceSettings(
	workspaceId: string,
	body: UpdateWorkspaceSettingsRequest,
): Promise<UpdateWorkspaceSettingsResponse> {
	return apiFetch<UpdateWorkspaceSettingsResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/settings`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type GetWorkspaceForwardConfigResponse =
	operations["GET:skyforge.GetWorkspaceForwardConfig"]["responses"][200]["content"]["application/json"];
export async function getWorkspaceForwardConfig(
	workspaceId: string,
): Promise<GetWorkspaceForwardConfigResponse> {
	return apiFetch<GetWorkspaceForwardConfigResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/integrations/forward`,
	);
}

export type PutWorkspaceForwardConfigRequest = NonNullable<
	operations["PUT:skyforge.PutWorkspaceForwardConfig"]["requestBody"]
>["content"]["application/json"];
export type PutWorkspaceForwardConfigResponse =
	operations["PUT:skyforge.PutWorkspaceForwardConfig"]["responses"][200]["content"]["application/json"];
export async function putWorkspaceForwardConfig(
	workspaceId: string,
	body: PutWorkspaceForwardConfigRequest,
): Promise<PutWorkspaceForwardConfigResponse> {
	return apiFetch<PutWorkspaceForwardConfigResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/integrations/forward`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type ListWorkspaceForwardCollectorsResponse =
	operations["GET:skyforge.GetWorkspaceForwardCollectors"]["responses"][200]["content"]["application/json"];
export async function listWorkspaceForwardCollectors(
	workspaceId: string,
): Promise<ListWorkspaceForwardCollectorsResponse> {
	return apiFetch<ListWorkspaceForwardCollectorsResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/integrations/forward/collectors`,
	);
}

export type ListWorkspaceArtifactsResponse =
	operations["GET:skyforge.ListWorkspaceArtifacts"]["responses"][200]["content"]["application/json"];
export async function listWorkspaceArtifacts(
	workspaceId: string,
	params?: { prefix?: string; limit?: string },
): Promise<ListWorkspaceArtifactsResponse> {
	const qs = new URLSearchParams();
	if (params?.prefix) qs.set("prefix", params.prefix);
	if (params?.limit) qs.set("limit", params.limit);
	const suffix = qs.toString();
	return apiFetch<ListWorkspaceArtifactsResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/artifacts${suffix ? `?${suffix}` : ""}`,
	);
}

export type DownloadWorkspaceArtifactResponse =
	operations["GET:skyforge.DownloadWorkspaceArtifact"]["responses"][200]["content"]["application/json"];
export async function downloadWorkspaceArtifact(
	workspaceId: string,
	key: string,
): Promise<DownloadWorkspaceArtifactResponse> {
	const qs = new URLSearchParams({ key });
	return apiFetch<DownloadWorkspaceArtifactResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/artifacts/download?${qs.toString()}`,
	);
}

export async function putWorkspaceArtifactObject(
	workspaceId: string,
	body: { key: string; contentBase64: string; contentType?: string },
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/artifacts/object`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteWorkspaceArtifactObject(
	workspaceId: string,
	key: string,
): Promise<JSONMap> {
	const qs = new URLSearchParams({ key });
	return apiFetch<JSONMap>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/artifacts/object?${qs.toString()}`,
		{
			method: "DELETE",
		},
	);
}

export async function createWorkspaceArtifactFolder(
	workspaceId: string,
	prefix: string,
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/artifacts/folder`,
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
export async function adminPurgeUser(
	body: AdminPurgeUserRequest,
): Promise<AdminPurgeUserResponse> {
	return apiFetch<AdminPurgeUserResponse>("/api/admin/users/purge", {
		method: "POST",
		body: JSON.stringify(body),
	});
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
	workspaceId: string,
	deploymentId: string,
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/start`,
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function stopDeployment(
	workspaceId: string,
	deploymentId: string,
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/stop`,
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function destroyDeployment(
	workspaceId: string,
	deploymentId: string,
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/destroy`,
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function deleteDeployment(
	workspaceId: string,
	deploymentId: string,
	params?: { forwardDelete?: boolean },
): Promise<JSONMap> {
	const qs = new URLSearchParams();
	if (params?.forwardDelete) qs.set("forward_delete", "true");
	const suffix = qs.toString();
	return apiFetch<JSONMap>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}${
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
	workspaceId: string,
): Promise<JSONMap> {
	const qs = new URLSearchParams();
	if (workspaceId) qs.set("workspace_id", workspaceId);
	return apiFetch<JSONMap>(
		`/api/runs/${encodeURIComponent(String(taskId))}/cancel${qs.toString() ? `?${qs.toString()}` : ""}`,
		{
			method: "POST",
			body: "{}",
		},
	);
}

export type WorkspaceVariableGroup =
	components["schemas"]["skyforge.WorkspaceVariableGroup"];
export type WorkspaceVariableGroupListResponse =
	operations["GET:skyforge.ListWorkspaceVariableGroups"]["responses"][200]["content"]["application/json"];
export type WorkspaceVariableGroupUpsertRequest = NonNullable<
	operations["POST:skyforge.CreateWorkspaceVariableGroup"]["requestBody"]
>["content"]["application/json"];

export async function listWorkspaceVariableGroups(
	workspaceId: string,
): Promise<WorkspaceVariableGroupListResponse> {
	return apiFetch<WorkspaceVariableGroupListResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/variable-groups`,
	);
}

export async function createWorkspaceVariableGroup(
	workspaceId: string,
	body: WorkspaceVariableGroupUpsertRequest,
): Promise<WorkspaceVariableGroup> {
	return apiFetch<WorkspaceVariableGroup>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/variable-groups`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function updateWorkspaceVariableGroup(
	workspaceId: string,
	groupId: number,
	body: WorkspaceVariableGroupUpsertRequest,
): Promise<WorkspaceVariableGroup> {
	return apiFetch<WorkspaceVariableGroup>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/variable-groups/${encodeURIComponent(groupId)}`,
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteWorkspaceVariableGroup(
	workspaceId: string,
	groupId: number,
): Promise<WorkspaceVariableGroupListResponse> {
	return apiFetch<WorkspaceVariableGroupListResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/variable-groups/${encodeURIComponent(groupId)}`,
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
	return apiFetch<UserVariableGroupListResponse>("/api/user/variable-groups");
}

export async function createUserVariableGroup(
	body: UserVariableGroupUpsertRequest,
): Promise<UserVariableGroup> {
	return apiFetch<UserVariableGroup>("/api/user/variable-groups", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function updateUserVariableGroup(
	groupId: number,
	body: UserVariableGroupUpsertRequest,
): Promise<UserVariableGroup> {
	return apiFetch<UserVariableGroup>(
		`/api/user/variable-groups/${encodeURIComponent(groupId)}`,
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
		`/api/user/variable-groups/${encodeURIComponent(groupId)}`,
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
	workspaceId: string;
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
	workspaceId: string;
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
	workspaceId: string;
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
	findingId: string;
	checkId: string;
	justification: string;
	ticketUrl?: string;
	expiresAt?: string;
};

export type PolicyReportDecisionResponse = {
	ok: boolean;
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

export async function getWorkspacePolicyReportChecks(
	workspaceId: string,
): Promise<PolicyReportChecksResponse> {
	return apiFetch<PolicyReportChecksResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/checks`,
	);
}

export async function getWorkspacePolicyReportCheck(
	workspaceId: string,
	checkId: string,
): Promise<PolicyReportCheckResponse> {
	return apiFetch<PolicyReportCheckResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/checks/${encodeURIComponent(checkId)}`,
	);
}

export async function getWorkspacePolicyReportPacks(
	workspaceId: string,
): Promise<PolicyReportPacks> {
	return apiFetch<PolicyReportPacks>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/packs`,
	);
}

export async function getWorkspacePolicyReportSnapshots(
	workspaceId: string,
	networkId: string,
	maxResults?: number,
): Promise<PolicyReportSnapshotsResponse> {
	const qs = new URLSearchParams();
	qs.set("networkId", networkId);
	if (typeof maxResults === "number") {
		qs.set("maxResults", String(maxResults));
	}
	return apiFetch<PolicyReportSnapshotsResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/snapshots?${qs.toString()}`,
	);
}

export async function runWorkspacePolicyReportCheck(
	workspaceId: string,
	body: PolicyReportRunCheckRequest,
): Promise<PolicyReportNQEResponse> {
	return apiFetch<PolicyReportNQEResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/checks/run`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function runWorkspacePolicyReportPack(
	workspaceId: string,
	body: PolicyReportRunPackRequest,
): Promise<PolicyReportRunPackResponse> {
	return apiFetch<PolicyReportRunPackResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/packs/run`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function runWorkspacePolicyReportPackDelta(
	workspaceId: string,
	body: PolicyReportPackDeltaRequest,
): Promise<PolicyReportPackDeltaResponse> {
	return apiFetch<PolicyReportPackDeltaResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/packs/delta`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function createWorkspacePolicyReportRecertCampaign(
	workspaceId: string,
	body: PolicyReportCreateRecertCampaignRequest,
): Promise<PolicyReportRecertCampaignWithCounts> {
	return apiFetch<PolicyReportRecertCampaignWithCounts>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/governance/campaigns`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listWorkspacePolicyReportRecertCampaigns(
	workspaceId: string,
	status?: string,
	limit?: number,
): Promise<PolicyReportListRecertCampaignsResponse> {
	const qs = new URLSearchParams();
	if (status) qs.set("status", status);
	if (typeof limit === "number") qs.set("limit", String(limit));
	return apiFetch<PolicyReportListRecertCampaignsResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/governance/campaigns?${qs.toString()}`,
	);
}

export async function getWorkspacePolicyReportRecertCampaign(
	workspaceId: string,
	campaignId: string,
): Promise<PolicyReportRecertCampaignWithCounts> {
	return apiFetch<PolicyReportRecertCampaignWithCounts>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/governance/campaigns/${encodeURIComponent(campaignId)}`,
	);
}

export async function generateWorkspacePolicyReportRecertAssignments(
	workspaceId: string,
	campaignId: string,
	body: PolicyReportGenerateRecertAssignmentsRequest,
): Promise<PolicyReportGenerateRecertAssignmentsResponse> {
	return apiFetch<PolicyReportGenerateRecertAssignmentsResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/governance/campaigns/${encodeURIComponent(campaignId)}/generate`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listWorkspacePolicyReportRecertAssignments(
	workspaceId: string,
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
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/governance/assignments?${qs.toString()}`,
	);
}

export async function attestWorkspacePolicyReportRecertAssignment(
	workspaceId: string,
	assignmentId: string,
	body: PolicyReportAttestAssignmentRequest,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/governance/assignments/${encodeURIComponent(assignmentId)}/attest`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function waiveWorkspacePolicyReportRecertAssignment(
	workspaceId: string,
	assignmentId: string,
	body: PolicyReportAttestAssignmentRequest,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/governance/assignments/${encodeURIComponent(assignmentId)}/waive`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function createWorkspacePolicyReportException(
	workspaceId: string,
	body: PolicyReportCreateExceptionRequest,
): Promise<PolicyReportException> {
	return apiFetch<PolicyReportException>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/governance/exceptions`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listWorkspacePolicyReportExceptions(
	workspaceId: string,
	status?: string,
	limit?: number,
): Promise<PolicyReportListExceptionsResponse> {
	const qs = new URLSearchParams();
	if (status) qs.set("status", status);
	if (typeof limit === "number") qs.set("limit", String(limit));
	return apiFetch<PolicyReportListExceptionsResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/governance/exceptions?${qs.toString()}`,
	);
}

export async function approveWorkspacePolicyReportException(
	workspaceId: string,
	exceptionId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/governance/exceptions/${encodeURIComponent(exceptionId)}/approve`,
		{ method: "POST", body: "{}" },
	);
}

export async function rejectWorkspacePolicyReportException(
	workspaceId: string,
	exceptionId: string,
): Promise<PolicyReportDecisionResponse> {
	return apiFetch<PolicyReportDecisionResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/governance/exceptions/${encodeURIComponent(exceptionId)}/reject`,
		{ method: "POST", body: "{}" },
	);
}

export async function simulateWorkspacePolicyReportChangePlanning(
	workspaceId: string,
	body: PolicyReportChangePlanningRequest,
): Promise<PolicyReportChangePlanningResponse> {
	return apiFetch<PolicyReportChangePlanningResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/policy-reports/change-planning/simulate`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}
