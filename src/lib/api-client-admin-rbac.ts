import type { ISO8601 } from "./api-client-user-user-scope";

import type { operations } from "./openapi.gen";

import { apiFetch } from "./http";

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
