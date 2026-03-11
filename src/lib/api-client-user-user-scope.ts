import { apiFetch } from "./http";
import type { components, operations } from "./openapi.gen";

export type ISO8601 = string;

const RESOURCE_ESTIMATE_TIMEOUT_MS = 8_000;

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
export type SkyforgeUserScope = components["schemas"]["skyforge.UserScope"];
export type NotificationRecord =
	components["schemas"]["skyforge.NotificationRecord"];

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

// NOTE: OpenAPI schema may lag behind the live dashboard/deployment view (e.g. activeTaskId/queueDepth).
// This type reflects the fields Skyforge currently emits in the dashboard snapshot and related APIs.
export type UserScopeDeployment = {
	id: string;
	userId: string;
	name: string;
	family: "terraform" | "c9s" | "byos" | string;
	engine: "terraform" | "netlab" | "containerlab" | "eve_ng" | string;
	config: JSONMap;
	lifecycleState?: string;
	primaryAction?: "bring_up" | "shut_down" | "none" | string;
	actionReason?: string;
	syncState?: "idle" | "syncing" | "synced" | "sync_failed" | string;
	lastSyncAt?: ISO8601;
	lastSyncStatus?: string;
	lastSyncError?: string;
	autoSyncOnBringUp?: boolean;
	createdBy?: string;
	createdAt?: ISO8601;
	updatedAt?: ISO8601;
	lastTaskUserScopeId?: number;
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
	userId: string;
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
	userId: string;
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
	userScopes: SkyforgeUserScope[];
	deployments: UserScopeDeployment[];
	runs: JSONMap[];
	templatesIndexUpdatedAt?: ISO8601;
	awsSsoStatus?: {
		configured: boolean;
		connected: boolean;
		expiresAt?: ISO8601;
		lastAuthenticatedAt?: ISO8601;
	};
};

export type GetUserScopesResponse =
	operations["GET:skyforge.GetUserScopes"]["responses"][200]["content"]["application/json"];

export async function getUserScopes(): Promise<GetUserScopesResponse> {
	return apiFetch<GetUserScopesResponse>("/api/users");
}

export async function listUserScopes(): Promise<SkyforgeUserScope[]> {
	const resp = await getUserScopes();
	const payload = resp as unknown as {
		userScopes?: SkyforgeUserScope[];
	};
	const userScopes = payload.userScopes;
	if (Array.isArray(userScopes)) return userScopes;
	return [];
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

export type UserScopeNetlabServerConfig = {
	id: string;
	name: string;
	apiUrl: string;
	apiInsecure: boolean;
	apiUser?: string;
	hasPassword?: boolean;
};

export type UserScopeNetlabServersResponse = {
	userId: string;
	servers: UserScopeNetlabServerConfig[];
};

export async function listUserScopeNetlabServers(
	userId: string,
): Promise<UserScopeNetlabServersResponse> {
	void userId;
	return apiFetch<UserScopeNetlabServersResponse>(
		"/api/byos/me/netlab/servers",
	);
}

export async function upsertUserScopeNetlabServer(
	userId: string,
	payload: Partial<UserScopeNetlabServerConfig> & {
		name: string;
		apiUrl: string;
		apiInsecure: boolean;
		apiPassword?: string;
		apiToken?: string;
	},
): Promise<UserScopeNetlabServerConfig> {
	void userId;
	return apiFetch<UserScopeNetlabServerConfig>("/api/byos/me/netlab/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserScopeNetlabServer(
	userId: string,
	serverId: string,
): Promise<void> {
	void userId;
	await apiFetch<void>(
		`/api/byos/me/netlab/servers/${encodeURIComponent(serverId)}`,
		{
			method: "DELETE",
		},
	);
}

export type UserScopeEveServerConfig = {
	id: string;
	name: string;
	apiUrl: string;
	webUrl?: string;
	skipTlsVerify: boolean;
	apiUser?: string;
	hasPassword?: boolean;
};

export type UserScopeEveServersResponse = {
	userId: string;
	servers: UserScopeEveServerConfig[];
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

export type UserScopeEveLabsResponse = {
	userId: string;
	server: string;
	labs: EveLabSummary[];
	folders?: EveFolderInfo[];
};

export type UserScopeEveImportRequest = {
	server?: string;
	labPath: string;
	deploymentName?: string;
};

export type UserScopeEveConvertRequest = {
	server?: string;
	labPath: string;
	outputDir?: string;
	outputFile?: string;
	createDeployment?: boolean;
	containerlabServer?: string;
};

export type UserScopeEveConvertResponse = {
	userId: string;
	path: string;
	deployment?: UserScopeDeployment;
	warnings?: string[];
};

export async function listUserScopeEveServers(
	userId: string,
): Promise<UserScopeEveServersResponse> {
	void userId;
	return apiFetch<UserScopeEveServersResponse>("/api/byos/me/eve/servers");
}

export async function listUserScopeEveLabs(
	userId: string,
	params?: { server?: string; path?: string; recursive?: boolean },
): Promise<UserScopeEveLabsResponse> {
	const qs = new URLSearchParams();
	if (params?.server) qs.set("server", params.server);
	if (params?.path) qs.set("path", params.path);
	if (params?.recursive) qs.set("recursive", "true");
	const suffix = qs.toString();
	return apiFetch<UserScopeEveLabsResponse>(
		`/api/byos/users/${encodeURIComponent(userId)}/eve/labs${suffix ? `?${suffix}` : ""}`,
	);
}

export async function importUserScopeEveLab(
	userId: string,
	payload: UserScopeEveImportRequest,
): Promise<UserScopeDeployment> {
	return apiFetch<UserScopeDeployment>(
		`/api/byos/users/${encodeURIComponent(userId)}/eve/import`,
		{ method: "POST", body: JSON.stringify(payload) },
	);
}

export async function convertUserScopeEveLab(
	userId: string,
	payload: UserScopeEveConvertRequest,
): Promise<UserScopeEveConvertResponse> {
	return apiFetch<UserScopeEveConvertResponse>(
		`/api/byos/users/${encodeURIComponent(userId)}/eve/convert`,
		{ method: "POST", body: JSON.stringify(payload) },
	);
}

export async function upsertUserScopeEveServer(
	userId: string,
	payload: Partial<UserScopeEveServerConfig> & {
		name: string;
		apiUrl: string;
		webUrl?: string;
		skipTlsVerify: boolean;
		apiUser?: string;
		apiPassword?: string;
	},
): Promise<UserScopeEveServerConfig> {
	void userId;
	return apiFetch<UserScopeEveServerConfig>("/api/byos/me/eve/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserScopeEveServer(
	userId: string,
	serverId: string,
): Promise<void> {
	void userId;
	await apiFetch<void>(
		`/api/byos/me/eve/servers/${encodeURIComponent(serverId)}`,
		{
			method: "DELETE",
		},
	);
}

export async function listForwardCollectors(): Promise<ListForwardCollectorsResponse> {
	return apiFetch<ListForwardCollectorsResponse>("/api/forward/collectors");
}

export async function getUserServiceNowConfig(): Promise<UserServiceNowConfigResponse> {
	return apiFetch<UserServiceNowConfigResponse>("/api/integrations/servicenow");
}

export async function putUserServiceNowConfig(
	payload: PutUserServiceNowConfigRequest,
): Promise<UserServiceNowConfigResponse> {
	return apiFetch<UserServiceNowConfigResponse>(
		"/api/integrations/servicenow",
		{
			method: "PUT",
			body: JSON.stringify(payload),
		},
	);
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
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function getUserInfobloxStatus(): Promise<UserInfobloxStatusResponse> {
	return apiFetch<UserInfobloxStatusResponse>(
		"/api/integrations/infoblox/status",
	);
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
	return apiFetch<UserGitCredentialsResponse>("/api/git-credentials");
}

export async function updateUserGitCredentials(payload: {
	httpsUsername?: string;
	httpsToken?: string;
	clearToken?: boolean;
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
	updatedAt?: string;
};

export async function getUserSettings(): Promise<UserSettingsResponse> {
	return apiFetch<UserSettingsResponse>("/api/settings");
}

export async function putUserSettings(payload: {
	defaultForwardCollectorConfigId?: string;
	defaultEnv?: Array<{ key: string; value: string }>;
	externalTemplateRepos?: ExternalTemplateRepo[];
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
	return apiFetch<UserNetlabServersResponse>("/api/byos/me/netlab/servers");
}

export async function upsertUserNetlabServer(
	payload: UserNetlabServerConfig,
): Promise<UserNetlabServerConfig> {
	return apiFetch<UserNetlabServerConfig>("/api/byos/me/netlab/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserNetlabServer(serverId: string): Promise<void> {
	await apiFetch<void>(
		`/api/byos/me/netlab/servers/${encodeURIComponent(serverId)}`,
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
	return apiFetch<UserEveServersResponse>("/api/byos/me/eve/servers");
}

export async function upsertUserEveServer(
	payload: UserEveServerConfig,
): Promise<UserEveServerConfig> {
	return apiFetch<UserEveServerConfig>("/api/byos/me/eve/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserEveServer(serverId: string): Promise<void> {
	await apiFetch<void>(
		`/api/byos/me/eve/servers/${encodeURIComponent(serverId)}`,
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
		"/api/byos/me/containerlab/servers",
	);
}

export async function upsertUserContainerlabServer(
	payload: UserContainerlabServerConfig,
): Promise<UserContainerlabServerConfig> {
	return apiFetch<UserContainerlabServerConfig>(
		"/api/byos/me/containerlab/servers",
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
		`/api/byos/me/containerlab/servers/${encodeURIComponent(serverId)}`,
		{ method: "DELETE" },
	);
}
