import { apiFetch } from "./http";
import type { operations } from "./openapi.gen";

export type DeploymentSourceShare =
	operations["GET:skyforge.ListDeploymentSourceShares"]["responses"][200]["content"]["application/json"]["shares"][number];

export type DeploymentSourceSharesResponse =
	operations["GET:skyforge.ListDeploymentSourceShares"]["responses"][200]["content"]["application/json"];

export type PutDeploymentSourceShareRequest = NonNullable<
	operations["POST:skyforge.PutDeploymentSourceShare"]["requestBody"]
>["content"]["application/json"];

export type SharedDeploymentSource =
	operations["GET:skyforge.ListSharedDeploymentSources"]["responses"][200]["content"]["application/json"]["sources"][number];

export type SharedDeploymentSourcesResponse =
	operations["GET:skyforge.ListSharedDeploymentSources"]["responses"][200]["content"]["application/json"];

export type AssignableUsersResponse =
	operations["GET:skyforge.ListAssignableUsers"]["responses"][200]["content"]["application/json"];

export async function listDeploymentSourceShares(
	userId: string,
	deploymentId: string,
): Promise<DeploymentSourceSharesResponse> {
	return apiFetch<DeploymentSourceSharesResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/source-shares`,
	);
}

export async function putDeploymentSourceShare(
	userId: string,
	deploymentId: string,
	body: PutDeploymentSourceShareRequest,
): Promise<DeploymentSourceShare> {
	return apiFetch<DeploymentSourceShare>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/source-shares`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function deleteDeploymentSourceShare(
	userId: string,
	deploymentId: string,
	username: string,
): Promise<DeploymentSourceSharesResponse> {
	return apiFetch<DeploymentSourceSharesResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/source-shares/${encodeURIComponent(username)}`,
		{ method: "DELETE" },
	);
}

export async function listSharedDeploymentSources(): Promise<SharedDeploymentSourcesResponse> {
	return apiFetch<SharedDeploymentSourcesResponse>(
		"/api/deployments/shared-sources",
	);
}

export async function listAssignableUsers(): Promise<AssignableUsersResponse> {
	return apiFetch<AssignableUsersResponse>("/users/assignable");
}
