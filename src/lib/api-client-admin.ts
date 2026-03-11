import type { ResourceEstimateSummary } from "./api-client-deployments-actions";
import type { ISO8601, JSONMap } from "./api-client-user-user-scope";
import { apiFetch } from "./http";
import type { components, operations } from "./openapi.gen";
import { setRuntimeAuthMode, setRuntimeAuthProvider } from "./skyforge-config";

export type AdminEffectiveConfigResponse =
	operations["GET:skyforge.GetAdminEffectiveConfig"]["responses"][200]["content"]["application/json"];
export async function getAdminEffectiveConfig(): Promise<AdminEffectiveConfigResponse> {
	return apiFetch<AdminEffectiveConfigResponse>("/api/admin/config");
}

export type AdminAuthProviderStatus = {
	id: string;
	label: string;
	implemented: boolean;
	selectable: boolean;
	configured: boolean;
	healthy: boolean;
};

export type AdminAuthSettingsResponse = {
	primaryProvider: "local" | "okta" | string;
	configuredProvider: "local" | "okta" | string;
	breakGlassEnabled: boolean;
	breakGlassLabel: string;
	providers: AdminAuthProviderStatus[];
	mode: "local" | "oidc" | string;
	configured: "local" | "oidc" | string;
	oidcAvailable: boolean;
};

export type PutAdminAuthSettingsRequest = {
	primaryProvider: "local" | "okta";
	breakGlassEnabled?: boolean;
	breakGlassLabel?: string;
};

export async function getAdminAuthSettings(): Promise<AdminAuthSettingsResponse> {
	return apiFetch<AdminAuthSettingsResponse>("/api/admin/auth/settings");
}

export async function putAdminAuthSettings(
	body: PutAdminAuthSettingsRequest,
): Promise<AdminAuthSettingsResponse> {
	return apiFetch<AdminAuthSettingsResponse>("/api/admin/auth/settings", {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export type AdminOIDCSettingsResponse = {
	enabled: boolean;
	issuerUrl: string;
	discoveryUrl?: string;
	clientId: string;
	redirectUrl: string;
	hasClientSecret: boolean;
};

export type PutAdminOIDCSettingsRequest = {
	enabled: boolean;
	issuerUrl: string;
	discoveryUrl?: string;
	clientId: string;
	clientSecret?: string;
	redirectUrl: string;
};

export async function getAdminOIDCSettings(): Promise<AdminOIDCSettingsResponse> {
	return apiFetch<AdminOIDCSettingsResponse>("/api/admin/auth/oidc-settings");
}

export async function putAdminOIDCSettings(
	body: PutAdminOIDCSettingsRequest,
): Promise<AdminOIDCSettingsResponse> {
	return apiFetch<AdminOIDCSettingsResponse>("/api/admin/auth/oidc-settings", {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export type AdminAuditResponse =
	operations["GET:authn.GetAdminAudit"]["responses"][200]["content"]["application/json"];
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
	operations["GET:authn.GetAdminImpersonateStatus"]["responses"][200]["content"]["application/json"];
export async function getAdminImpersonateStatus(): Promise<AdminImpersonateStatusResponse> {
	return apiFetch<AdminImpersonateStatusResponse>(
		"/api/admin/impersonate/status",
	);
}

export type AdminImpersonateStartRequest = NonNullable<
	operations["POST:authn.AdminImpersonateStart"]["requestBody"]
>["content"]["application/json"];
export type AdminImpersonateStartResponse =
	operations["POST:authn.AdminImpersonateStart"]["responses"][200]["content"]["application/json"];
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
	operations["POST:authn.AdminImpersonateStop"]["responses"][200]["content"]["application/json"];
export async function adminImpersonateStop(): Promise<AdminImpersonateStopResponse> {
	return apiFetch<AdminImpersonateStopResponse>("/api/admin/impersonate/stop", {
		method: "POST",
		body: "{}",
	});
}

export type AdminUserRolesResponse =
	operations["GET:skyforge.ListAdminUserRoles"]["responses"][200]["content"]["application/json"];
export type AdminUserRoleRecord = AdminUserRolesResponse["users"][number];
export async function getAdminUserRoles(): Promise<AdminUserRolesResponse> {
	return apiFetch<AdminUserRolesResponse>("/api/admin/rbac/users");
}

export type AdminAPICatalogEntry = {
	service: string;
	endpoint: string;
	method: string;
	path: string;
	tags?: string[];
	summary?: string;
};

export type AdminAPICatalogResponse = {
	entries: AdminAPICatalogEntry[];
	generatedAt: ISO8601;
};

export type AdminUserAPIPermission = {
	service: string;
	endpoint: string;
	method: string;
	decision: "allow" | "deny" | string;
};

export type AdminUserAPIPermissionsResponse = {
	username: string;
	permissions: AdminUserAPIPermission[];
	generatedAt: ISO8601;
};

export type PutAdminUserAPIPermissionsRequest = {
	permissions: AdminUserAPIPermission[];
};

export type PutAdminUserAPIPermissionsResponse = {
	username: string;
	permissions: AdminUserAPIPermission[];
	updatedAt: ISO8601;
};

export async function getAdminAPICatalog(): Promise<AdminAPICatalogResponse> {
	return apiFetch<AdminAPICatalogResponse>("/api/admin/rbac/api-catalog");
}

export async function getAdminUserAPIPermissions(
	username: string,
): Promise<AdminUserAPIPermissionsResponse> {
	return apiFetch<AdminUserAPIPermissionsResponse>(
		`/api/admin/rbac/users/${encodeURIComponent(username)}/api-permissions`,
	);
}

export async function putAdminUserAPIPermissions(
	username: string,
	body: PutAdminUserAPIPermissionsRequest,
): Promise<PutAdminUserAPIPermissionsResponse> {
	return apiFetch<PutAdminUserAPIPermissionsResponse>(
		`/api/admin/rbac/users/${encodeURIComponent(username)}/api-permissions`,
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export type UpsertAdminUserRoleRequest = NonNullable<
	operations["POST:skyforge.UpsertAdminUserRole"]["requestBody"]
>["content"]["application/json"];
export type UpsertAdminUserRoleResponse =
	operations["POST:skyforge.UpsertAdminUserRole"]["responses"][200]["content"]["application/json"];
export async function upsertAdminUserRole(
	username: string,
	body: UpsertAdminUserRoleRequest,
): Promise<UpsertAdminUserRoleResponse> {
	return apiFetch<UpsertAdminUserRoleResponse>(
		`/api/admin/rbac/users/${encodeURIComponent(username)}/roles`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export type DeleteAdminUserRoleResponse =
	operations["DELETE:skyforge.DeleteAdminUserRole"]["responses"][200]["content"]["application/json"];
export async function deleteAdminUserRole(
	username: string,
	role: string,
): Promise<DeleteAdminUserRoleResponse> {
	return apiFetch<DeleteAdminUserRoleResponse>(
		`/api/admin/rbac/users/${encodeURIComponent(username)}/roles/${encodeURIComponent(role)}`,
		{
			method: "DELETE",
		},
	);
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

export type AdminWorkspacePodCleanupRequest = {
	userScopeId?: string;
	namespace?: string;
	dryRun?: boolean;
};

export type AdminWorkspacePodCleanupNamespaceResult = {
	namespace: string;
	topologiesFound: number;
	topologyOwnersFound: number;
	topologiesDeleted: number;
	orphanCleanupAttempts: number;
	errors?: string[];
};

export type AdminWorkspacePodCleanupResponse = {
	status: string;
	dryRun: boolean;
	userScopeId?: string;
	namespace?: string;
	namespacesConsidered: number;
	topologyOwnersFound: number;
	topologiesFound: number;
	topologiesDeleted: number;
	orphanCleanupAttempts: number;
	namespaceResults: AdminWorkspacePodCleanupNamespaceResult[];
	errors?: string[];
};

export async function adminCleanupWorkspacePods(
	body: AdminWorkspacePodCleanupRequest,
): Promise<AdminWorkspacePodCleanupResponse> {
	return apiFetch<AdminWorkspacePodCleanupResponse>(
		"/api/admin/tasks/workspace-pods/cleanup",
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

export type CreateAdminUserRequest = {
	username: string;
	role?: string;
};
export type CreateAdminUserResponse = {
	status: string;
	username: string;
	role?: string;
};
export async function createAdminUser(
	body: CreateAdminUserRequest,
): Promise<CreateAdminUserResponse> {
	return apiFetch<CreateAdminUserResponse>("/api/admin/users", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export type DeleteAdminUserResponse = {
	status: string;
	username: string;
};
export async function deleteAdminUser(
	username: string,
): Promise<DeleteAdminUserResponse> {
	return apiFetch<DeleteAdminUserResponse>(
		`/api/admin/users/${encodeURIComponent(username)}`,
		{
			method: "DELETE",
		},
	);
}

export type AdminQuickDeployCatalogResponse = {
	templates: QuickDeployTemplate[];
	repo?: string;
	branch?: string;
	dir?: string;
	options?: string[];
	source: "default" | "custom" | string;
	retrievedAt: string;
};

export type UpdateAdminQuickDeployCatalogRequest = {
	templates: QuickDeployTemplate[];
};

export type UpdateAdminQuickDeployCatalogResponse = {
	status: "ok";
	templates: QuickDeployTemplate[];
	updatedAt: string;
};

export async function getAdminQuickDeployCatalog(): Promise<AdminQuickDeployCatalogResponse> {
	return apiFetch<AdminQuickDeployCatalogResponse>(
		"/api/admin/quick-deploy/catalog",
	);
}

export async function updateAdminQuickDeployCatalog(
	body: UpdateAdminQuickDeployCatalogRequest,
): Promise<UpdateAdminQuickDeployCatalogResponse> {
	return apiFetch<UpdateAdminQuickDeployCatalogResponse>(
		"/api/admin/quick-deploy/catalog",
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export type AdminQuickDeployTemplateOptionsResponse = {
	repo: string;
	branch: string;
	dir: string;
	templates: string[];
	retrievedAt: string;
};

export async function getAdminQuickDeployTemplateOptions(): Promise<AdminQuickDeployTemplateOptionsResponse> {
	return apiFetch<AdminQuickDeployTemplateOptionsResponse>(
		"/api/admin/quick-deploy/template-options",
	);
}

export async function runDeploymentAction(
	userId: string,
	deploymentId: string,
	action: "create" | "start" | "stop" | "destroy" | "export",
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/action`,
		{
			method: "POST",
			body: JSON.stringify({ action }),
		},
	);
}

export type QuickDeployTemplate = {
	id: string;
	name: string;
	description: string;
	template: string;
	estimate?: ResourceEstimateSummary;
};

export type QuickDeployCatalogResponse = {
	templates: QuickDeployTemplate[];
	leaseOptions: number[];
	defaultLeaseHours: number;
};

export type QuickDeployRunRequest = {
	template: string;
	leaseHours?: number;
	name?: string;
};

export type QuickDeployRunResponse = {
	userId: string;
	deploymentId: string;
	deploymentName: string;
	noOp?: boolean;
	reason?: string;
};

export async function getQuickDeployCatalog(): Promise<QuickDeployCatalogResponse> {
	return apiFetch<QuickDeployCatalogResponse>("/api/quick-deploy/catalog");
}

export async function runQuickDeploy(
	body: QuickDeployRunRequest,
): Promise<QuickDeployRunResponse> {
	return apiFetch<QuickDeployRunResponse>("/api/quick-deploy/deploy", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export type DeploymentAction =
	| "create"
	| "start"
	| "stop"
	| "destroy"
	| "export";

export type PreflightDeploymentActionResponse =
	operations["POST:skyforge.PreflightUserScopeDeploymentAction"]["responses"][200]["content"]["application/json"];

export async function preflightDeploymentAction(
	userId: string,
	deploymentId: string,
	action: "create" | "start" | "stop" | "destroy",
): Promise<PreflightDeploymentActionResponse> {
	return apiFetch<PreflightDeploymentActionResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/preflight`,
		{
			method: "POST",
			body: JSON.stringify({ action }),
		},
	);
}

export type DeploymentLeaseInfo = {
	userId: string;
	deploymentId: string;
	enabled: boolean;
	hours: number;
	expiresAt?: ISO8601;
	stoppedAt?: ISO8601;
	stopTaskId?: number;
	status: "disabled" | "active" | "expired" | "stopped" | string;
};

export type DeploymentLeaseUpdateRequest = {
	enabled: boolean;
	hours: number;
};

export type DeploymentLifetimePolicyResponse = {
	managedFamilies: string[];
	allowedHours: number[];
	defaultHours: number;
	maxHoursNonAdmin: number;
	allowNoExpiry: boolean;
	expiryActions: Record<string, string>;
};

export async function getDeploymentLifetimePolicy(): Promise<DeploymentLifetimePolicyResponse> {
	return apiFetch<DeploymentLifetimePolicyResponse>(
		"/api/deployment-lifetime/policy",
	);
}

export async function getDeploymentLease(
	userId: string,
	deploymentId: string,
): Promise<DeploymentLeaseInfo> {
	return apiFetch<DeploymentLeaseInfo>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/lease`,
	);
}

export async function updateDeploymentLease(
	userId: string,
	deploymentId: string,
	body: DeploymentLeaseUpdateRequest,
): Promise<DeploymentLeaseInfo> {
	return apiFetch<DeploymentLeaseInfo>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/lease`,
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteDeployment(
	userId: string,
	deploymentId: string,
	params?: { forwardDelete?: boolean },
): Promise<JSONMap> {
	const qs = new URLSearchParams();
	if (params?.forwardDelete) qs.set("forward_delete", "true");
	const suffix = qs.toString();
	return apiFetch<JSONMap>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}${
			suffix ? `?${suffix}` : ""
		}`,
		{
			method: "DELETE",
		},
	);
}

export type UIConfigResponse =
	operations["GET:authn.GetUIConfig"]["responses"][200]["content"]["application/json"] & {
		authMode?: "oidc" | "local" | string;
		auth?: {
			primaryProvider?: "local" | "okta" | string;
			breakGlassEnabled?: boolean;
			breakGlassLabel?: string;
		};
		netboxBaseUrl?: string;
		nautobotBaseUrl?: string;
		jiraBaseUrl?: string;
		infobloxBaseUrl?: string;
		rapid7BaseUrl?: string;
		elkBaseUrl?: string;
		features?: operations["GET:authn.GetUIConfig"]["responses"][200]["content"]["application/json"]["features"] & {
			jiraEnabled?: boolean;
			infobloxEnabled?: boolean;
			rapid7Enabled?: boolean;
			elkEnabled?: boolean;
			forwardGrafanaEnabled?: boolean;
			forwardPrometheusEnabled?: boolean;
		};
	};
export async function getUIConfig(): Promise<UIConfigResponse> {
	const config = await apiFetch<UIConfigResponse>("/api/ui/config");
	setRuntimeAuthProvider(config.auth?.primaryProvider);
	setRuntimeAuthMode(config.authMode);
	return config;
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
	userId: string,
): Promise<JSONMap> {
	const qs = new URLSearchParams();
	if (userId) qs.set("user_id", userId);
	return apiFetch<JSONMap>(
		`/api/runs/${encodeURIComponent(String(taskId))}/cancel${qs.toString() ? `?${qs.toString()}` : ""}`,
		{
			method: "POST",
			body: "{}",
		},
	);
}

export type UserScopeVariableGroup =
	components["schemas"]["skyforge.UserScopeVariableGroup"];
export type UserScopeVariableGroupListResponse =
	operations["GET:skyforge.ListUserScopeVariableGroups"]["responses"][200]["content"]["application/json"];
export type UserScopeVariableGroupUpsertRequest = NonNullable<
	operations["POST:skyforge.CreateUserScopeVariableGroup"]["requestBody"]
>["content"]["application/json"];

export async function listUserScopeVariableGroups(
	userId: string,
): Promise<UserScopeVariableGroupListResponse> {
	return apiFetch<UserScopeVariableGroupListResponse>(
		`/api/users/${encodeURIComponent(userId)}/variable-groups`,
	);
}

export async function createUserScopeVariableGroup(
	userId: string,
	body: UserScopeVariableGroupUpsertRequest,
): Promise<UserScopeVariableGroup> {
	return apiFetch<UserScopeVariableGroup>(
		`/api/users/${encodeURIComponent(userId)}/variable-groups`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function updateUserScopeVariableGroup(
	userId: string,
	groupId: number,
	body: UserScopeVariableGroupUpsertRequest,
): Promise<UserScopeVariableGroup> {
	return apiFetch<UserScopeVariableGroup>(
		`/api/users/${encodeURIComponent(userId)}/variable-groups/${encodeURIComponent(groupId)}`,
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteUserScopeVariableGroup(
	userId: string,
	groupId: number,
): Promise<UserScopeVariableGroupListResponse> {
	return apiFetch<UserScopeVariableGroupListResponse>(
		`/api/users/${encodeURIComponent(userId)}/variable-groups/${encodeURIComponent(groupId)}`,
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
	return apiFetch<UserVariableGroupListResponse>("/api/variable-groups");
}

export async function createUserVariableGroup(
	body: UserVariableGroupUpsertRequest,
): Promise<UserVariableGroup> {
	return apiFetch<UserVariableGroup>("/api/variable-groups", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function updateUserVariableGroup(
	groupId: number,
	body: UserVariableGroupUpsertRequest,
): Promise<UserVariableGroup> {
	return apiFetch<UserVariableGroup>(
		`/api/variable-groups/${encodeURIComponent(groupId)}`,
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
		`/api/variable-groups/${encodeURIComponent(groupId)}`,
		{
			method: "DELETE",
		},
	);
}
