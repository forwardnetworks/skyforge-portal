import type { operations } from "./openapi.gen";

import { apiFetch } from "./http";

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
