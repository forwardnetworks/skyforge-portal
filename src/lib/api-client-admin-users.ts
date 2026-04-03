import { apiFetch } from "./http";

export type CreateAdminUserRequest = {
	username: string;
	role?: string;
	provisionDefaultUserScope?: boolean;
};
export type CreateAdminUserResponse = {
	status: string;
	username: string;
	role?: string;
	provisionedUserScopeId?: string;
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
