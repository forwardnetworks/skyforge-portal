import type { ISO8601, JSONMap } from "./api-client-user-user-scope";

import type { operations } from "./openapi.gen";

import { apiFetch } from "./http";

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
	maxHours: number;
	allowDisable: boolean;
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

export type RunDetailResponse = {
	task_id: number;
	userId: string;
	task: JSONMap;
	user: string;
};

export async function getRunDetail(
	taskId: string | number,
): Promise<RunDetailResponse> {
	return apiFetch<RunDetailResponse>(
		`/api/runs/${encodeURIComponent(String(taskId))}`,
	);
}

export type RecentRunsResponse = {
	user: string;
	tasks: JSONMap[];
};

export async function getRecentRuns(limit = 50): Promise<RecentRunsResponse> {
	const qs = new URLSearchParams();
	if (Number.isFinite(limit) && limit > 0) {
		qs.set("limit", String(Math.trunc(limit)));
	}
	return apiFetch<RecentRunsResponse>(
		`/api/recent-runs${qs.toString() ? `?${qs.toString()}` : ""}`,
	);
}
