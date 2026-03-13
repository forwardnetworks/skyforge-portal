import { apiFetch } from "./http";

export type UserScopeNetlabServerConfig = {
	id: string;
	name: string;
	apiUrl: string;
	apiInsecure: boolean;
	apiUser?: string;
	hasPassword?: boolean;
};

export type UserScopeNetlabServersResponse = {
	userId: string;
	servers: UserScopeNetlabServerConfig[];
};

export async function listUserScopeNetlabServers(
	userId: string,
): Promise<UserScopeNetlabServersResponse> {
	void userId;
	return apiFetch<UserScopeNetlabServersResponse>(
		"/api/byos/me/netlab/servers",
	);
}

export async function upsertUserScopeNetlabServer(
	userId: string,
	payload: Partial<UserScopeNetlabServerConfig> & {
		name: string;
		apiUrl: string;
		apiInsecure: boolean;
		apiPassword?: string;
		apiToken?: string;
	},
): Promise<UserScopeNetlabServerConfig> {
	void userId;
	return apiFetch<UserScopeNetlabServerConfig>("/api/byos/me/netlab/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserScopeNetlabServer(
	userId: string,
	serverId: string,
): Promise<void> {
	void userId;
	await apiFetch<void>(
		`/api/byos/me/netlab/servers/${encodeURIComponent(serverId)}`,
		{ method: "DELETE" },
	);
}

export type UserNetlabServerConfig = {
	id?: string;
	name: string;
	apiUrl: string;
	apiInsecure: boolean;
	apiUser?: string;
	apiPassword?: string;
	apiToken?: string;
	hasPassword?: boolean;
};
export type UserNetlabServersResponse = { servers: UserNetlabServerConfig[] };

export async function listUserNetlabServers(): Promise<UserNetlabServersResponse> {
	return apiFetch<UserNetlabServersResponse>("/api/byos/me/netlab/servers");
}

export async function upsertUserNetlabServer(
	payload: UserNetlabServerConfig,
): Promise<UserNetlabServerConfig> {
	return apiFetch<UserNetlabServerConfig>("/api/byos/me/netlab/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserNetlabServer(serverId: string): Promise<void> {
	await apiFetch<void>(
		`/api/byos/me/netlab/servers/${encodeURIComponent(serverId)}`,
		{ method: "DELETE" },
	);
}

export type UserContainerlabServerConfig = {
	id?: string;
	name: string;
	apiUrl: string;
	apiInsecure: boolean;
	apiUser?: string;
	apiPassword?: string;
	apiToken?: string;
	hasPassword?: boolean;
};
export type UserContainerlabServersResponse = {
	servers: UserContainerlabServerConfig[];
};

export async function listUserContainerlabServers(): Promise<UserContainerlabServersResponse> {
	return apiFetch<UserContainerlabServersResponse>(
		"/api/byos/me/containerlab/servers",
	);
}

export async function upsertUserContainerlabServer(
	payload: UserContainerlabServerConfig,
): Promise<UserContainerlabServerConfig> {
	return apiFetch<UserContainerlabServerConfig>(
		"/api/byos/me/containerlab/servers",
		{ method: "PUT", body: JSON.stringify(payload) },
	);
}

export async function deleteUserContainerlabServer(
	serverId: string,
): Promise<void> {
	await apiFetch<void>(
		`/api/byos/me/containerlab/servers/${encodeURIComponent(serverId)}`,
		{ method: "DELETE" },
	);
}

export type UserFixiaServerConfig = {
	id?: string;
	name: string;
	apiUrl: string;
	apiInsecure: boolean;
	apiUser?: string;
	apiPassword?: string;
	apiToken?: string;
	hasPassword?: boolean;
};
export type UserFixiaServersResponse = {
	servers: UserFixiaServerConfig[];
};

export async function listUserFixiaServers(): Promise<UserFixiaServersResponse> {
	return apiFetch<UserFixiaServersResponse>("/api/byos/me/fixia/servers");
}

export async function upsertUserFixiaServer(
	payload: UserFixiaServerConfig,
): Promise<UserFixiaServerConfig> {
	return apiFetch<UserFixiaServerConfig>("/api/byos/me/fixia/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserFixiaServer(serverId: string): Promise<void> {
	await apiFetch<void>(`/api/byos/me/fixia/servers/${encodeURIComponent(serverId)}`, {
		method: "DELETE",
	});
}
