import type { JSONMap, UserScopeDeployment } from "./api-client-user-user-scope";
import { apiFetch } from "./http";
import type { operations } from "./openapi.gen";

export type CreateUserScopeDeploymentRequest = {
	name: string;
	family: "terraform" | "c9s" | "byos" | string;
	engine: "terraform" | "netlab" | "containerlab" | "eve_ng" | string;
	config?: JSONMap;
};
export type CreateUserScopeDeploymentResponse = UserScopeDeployment;

export async function createUserScopeDeployment(
	userId: string,
	body: CreateUserScopeDeploymentRequest,
): Promise<CreateUserScopeDeploymentResponse> {
	return apiFetch<CreateUserScopeDeploymentResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type CreateUserScopeRequest = NonNullable<
	operations["POST:skyforge.CreateUserScope"]["requestBody"]
>["content"]["application/json"];

export type CreateUserScopeResponse =
	operations["POST:skyforge.CreateUserScope"]["responses"][200]["content"]["application/json"];

export async function createUserScope(
	body: CreateUserScopeRequest,
): Promise<CreateUserScopeResponse> {
	return apiFetch<CreateUserScopeResponse>("/api/users", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export type UpdateUserScopeMembersRequest = NonNullable<
	operations["PUT:skyforge.UpdateUserScopeMembers"]["requestBody"]
>["content"]["application/json"];
export type UpdateUserScopeMembersResponse =
	operations["PUT:skyforge.UpdateUserScopeMembers"]["responses"][200]["content"]["application/json"];
export async function updateUserScopeMembers(
	userId: string,
	body: UpdateUserScopeMembersRequest,
): Promise<UpdateUserScopeMembersResponse> {
	return apiFetch<UpdateUserScopeMembersResponse>(
		`/api/users/${encodeURIComponent(userId)}/members`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type DeleteUserScopeResponse =
	operations["DELETE:skyforge.DeleteUserScope"]["responses"][200]["content"]["application/json"];
export async function deleteUserScope(
	userId: string,
	params: { confirm: string; force?: boolean },
): Promise<DeleteUserScopeResponse> {
	const qs = new URLSearchParams();
	qs.set("confirm", params.confirm);
	if (params.force) qs.set("force", "true");
	return apiFetch<DeleteUserScopeResponse>(
		`/api/users/${encodeURIComponent(userId)}?${qs.toString()}`,
		{ method: "DELETE" },
	);
}
