import type { components, operations } from "./openapi.gen";

import { apiFetch } from "./http";

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
