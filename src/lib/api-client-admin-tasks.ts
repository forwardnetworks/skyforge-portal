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

export type AdminTenantPodCleanupRequest = {
	userScopeId?: string;
	namespace?: string;
	dryRun?: boolean;
};

export type AdminTenantPodCleanupNamespaceResult = {
	namespace: string;
	topologiesFound: number;
	topologyOwnersFound: number;
	topologiesDeleted: number;
	orphanCleanupAttempts: number;
	errors?: string[];
};

export type AdminTenantPodCleanupResponse = {
	status: string;
	dryRun: boolean;
	userScopeId?: string;
	namespace?: string;
	namespacesConsidered: number;
	topologyOwnersFound: number;
	topologiesFound: number;
	topologiesDeleted: number;
	orphanCleanupAttempts: number;
	namespaceResults: AdminTenantPodCleanupNamespaceResult[];
	errors?: string[];
};

export async function adminCleanupTenantPods(
	body: AdminTenantPodCleanupRequest,
): Promise<AdminTenantPodCleanupResponse> {
	return apiFetch<AdminTenantPodCleanupResponse>(
		"/api/admin/tasks/tenant-pods/cleanup",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export type AdminEphemeralRuntimeResourceCounts = {
	pods: number;
	services: number;
	jobs: number;
	configMaps: number;
	topologies: number;
	virtualMachines: number;
	virtualMachineInstances: number;
};

export type AdminEphemeralRuntimeNamespaceRecord = {
	namespace: string;
	phase: string;
	purpose: string;
	owner?: string;
	userScopeId?: string;
	deploymentId?: string;
	topologyName?: string;
	createdAt?: string;
	expiresAt?: string;
	deletionTimestamp?: string;
	finalizers?: string[];
	active: boolean;
	expired: boolean;
	eligibleForCleanup: boolean;
	eligibleForForceFinalize: boolean;
	resourceCounts: AdminEphemeralRuntimeResourceCounts;
	errors?: string[];
};

export type AdminEphemeralRuntimeNamespacesResponse = {
	status: string;
	total: number;
	active: number;
	inactive: number;
	expired: number;
	eligibleForCleanup: number;
	eligibleForForceFinalize: number;
	terminating: number;
	resourceTotals: AdminEphemeralRuntimeResourceCounts;
	items: AdminEphemeralRuntimeNamespaceRecord[];
};

export async function adminListEphemeralRuntimes(): Promise<AdminEphemeralRuntimeNamespacesResponse> {
	return apiFetch<AdminEphemeralRuntimeNamespacesResponse>(
		"/api/admin/tasks/ephemeral-runtimes",
		{
			method: "GET",
		},
	);
}

export type AdminEphemeralRuntimeCleanupRequest = {
	namespaces?: string[];
	dryRun?: boolean;
};

export type AdminEphemeralRuntimeCleanupNamespaceResult = {
	namespace: string;
	active: boolean;
	eligibleForCleanup: boolean;
	eligibleForForceFinalize: boolean;
	topologiesFound: number;
	topologyOwnersFound: number;
	topologiesDeleted: number;
	orphanCleanupAttempts: number;
	errors?: string[];
};

export type AdminEphemeralRuntimeCleanupResponse = {
	status: string;
	dryRun: boolean;
	namespacesSelected: number;
	namespacesConsidered: number;
	namespacesCleaned: number;
	skippedActive: number;
	skippedIneligible: number;
	namespaceResults: AdminEphemeralRuntimeCleanupNamespaceResult[];
	errors?: string[];
};

export async function adminCleanupEphemeralRuntimes(
	body: AdminEphemeralRuntimeCleanupRequest,
): Promise<AdminEphemeralRuntimeCleanupResponse> {
	return apiFetch<AdminEphemeralRuntimeCleanupResponse>(
		"/api/admin/tasks/ephemeral-runtimes/cleanup",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export type AdminEphemeralRuntimeFinalizeRequest = {
	namespaces?: string[];
};

export type AdminEphemeralRuntimeFinalizeNamespaceResult = {
	namespace: string;
	eligibleForForceFinalize: boolean;
	finalized: boolean;
	errors?: string[];
};

export type AdminEphemeralRuntimeFinalizeResponse = {
	status: string;
	namespacesSelected: number;
	namespacesConsidered: number;
	namespacesFinalized: number;
	skippedIneligible: number;
	namespaceResults: AdminEphemeralRuntimeFinalizeNamespaceResult[];
	errors?: string[];
};

export async function adminForceFinalizeEphemeralRuntimes(
	body: AdminEphemeralRuntimeFinalizeRequest,
): Promise<AdminEphemeralRuntimeFinalizeResponse> {
	return apiFetch<AdminEphemeralRuntimeFinalizeResponse>(
		"/api/admin/tasks/ephemeral-runtimes/finalize",
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
