import type { JSONMap } from "./api-client-user-user-scope";
import { apiFetch } from "./http";
import type { operations } from "./openapi.gen";

export type UpdateUserScopeSettingsRequest = NonNullable<
	operations["PUT:skyforge.UpdateUserScopeSettings"]["requestBody"]
>["content"]["application/json"];
export type UpdateUserScopeSettingsResponse =
	operations["PUT:skyforge.UpdateUserScopeSettings"]["responses"][200]["content"]["application/json"];

export async function updateUserScopeSettings(
	userId: string,
	body: UpdateUserScopeSettingsRequest,
): Promise<UpdateUserScopeSettingsResponse> {
	return apiFetch<UpdateUserScopeSettingsResponse>(
		`/api/users/${encodeURIComponent(userId)}/settings`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type GetUserScopeForwardConfigResponse =
	operations["GET:skyforge.GetUserScopeForwardConfig"]["responses"][200]["content"]["application/json"];
export async function getUserScopeForwardConfig(
	userId: string,
): Promise<GetUserScopeForwardConfigResponse> {
	return apiFetch<GetUserScopeForwardConfigResponse>(
		`/api/users/${encodeURIComponent(userId)}/integrations/forward`,
	);
}

export type PutUserScopeForwardConfigRequest = NonNullable<
	operations["PUT:skyforge.PutUserScopeForwardConfig"]["requestBody"]
>["content"]["application/json"];
export type PutUserScopeForwardConfigResponse =
	operations["PUT:skyforge.PutUserScopeForwardConfig"]["responses"][200]["content"]["application/json"];
export async function putUserScopeForwardConfig(
	userId: string,
	body: PutUserScopeForwardConfigRequest,
): Promise<PutUserScopeForwardConfigResponse> {
	return apiFetch<PutUserScopeForwardConfigResponse>(
		`/api/users/${encodeURIComponent(userId)}/integrations/forward`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type ListUserScopeForwardCollectorsResponse =
	operations["GET:skyforge.GetUserScopeForwardCollectors"]["responses"][200]["content"]["application/json"];
export async function listUserScopeForwardCollectors(
	userId: string,
): Promise<ListUserScopeForwardCollectorsResponse> {
	return apiFetch<ListUserScopeForwardCollectorsResponse>(
		`/api/users/${encodeURIComponent(userId)}/integrations/forward/collectors`,
	);
}

export type ListUserScopeArtifactsResponse =
	operations["GET:skyforge.ListUserScopeArtifacts"]["responses"][200]["content"]["application/json"];
export async function listUserScopeArtifacts(
	userId: string,
	params?: { prefix?: string; limit?: string },
): Promise<ListUserScopeArtifactsResponse> {
	const qs = new URLSearchParams();
	if (params?.prefix) qs.set("prefix", params.prefix);
	if (params?.limit) qs.set("limit", params.limit);
	const suffix = qs.toString();
	return apiFetch<ListUserScopeArtifactsResponse>(
		`/api/users/${encodeURIComponent(userId)}/artifacts${suffix ? `?${suffix}` : ""}`,
	);
}

export type DownloadUserScopeArtifactResponse =
	operations["GET:skyforge.DownloadUserScopeArtifact"]["responses"][200]["content"]["application/json"];
export async function downloadUserScopeArtifact(
	userId: string,
	key: string,
): Promise<DownloadUserScopeArtifactResponse> {
	const qs = new URLSearchParams({ key });
	return apiFetch<DownloadUserScopeArtifactResponse>(
		`/api/users/${encodeURIComponent(userId)}/artifacts/download?${qs.toString()}`,
	);
}

export async function putUserScopeArtifactObject(
	userId: string,
	body: { key: string; contentBase64: string; contentType?: string },
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/users/${encodeURIComponent(userId)}/artifacts/object`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function deleteUserScopeArtifactObject(
	userId: string,
	key: string,
): Promise<JSONMap> {
	const qs = new URLSearchParams({ key });
	return apiFetch<JSONMap>(
		`/api/users/${encodeURIComponent(userId)}/artifacts/object?${qs.toString()}`,
		{ method: "DELETE" },
	);
}

export async function createUserScopeArtifactFolder(
	userId: string,
	prefix: string,
): Promise<JSONMap> {
	return apiFetch<JSONMap>(
		`/api/users/${encodeURIComponent(userId)}/artifacts/folder`,
		{ method: "POST", body: JSON.stringify({ prefix }) },
	);
}

export type StorageListResponse =
	operations["GET:storage.List"]["responses"][200]["content"]["application/json"];

export async function listStorageFiles(): Promise<StorageListResponse> {
	return apiFetch<StorageListResponse>("/storage.List");
}
