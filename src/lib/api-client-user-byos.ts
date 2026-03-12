import { apiFetch } from "./http";
import type { UserScopeDeployment } from "./api-client-user-shared";

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

export type UserScopeEveServerConfig = {
	id: string;
	name: string;
	apiUrl: string;
	webUrl?: string;
	skipTlsVerify: boolean;
	apiUser?: string;
	hasPassword?: boolean;
};

export type UserScopeEveServersResponse = {
	userId: string;
	servers: UserScopeEveServerConfig[];
};

export type EveLabSummary = {
	name: string;
	path: string;
	folder?: string;
	mtime?: string;
	umtime?: number;
	shared?: number;
	lock?: boolean;
};

export type EveFolderInfo = {
	name: string;
	path: string;
	mtime?: string;
};

export type UserScopeEveLabsResponse = {
	userId: string;
	server: string;
	labs: EveLabSummary[];
	folders?: EveFolderInfo[];
};

export type UserScopeEveImportRequest = {
	server?: string;
	labPath: string;
	deploymentName?: string;
};

export type UserScopeEveConvertRequest = {
	server?: string;
	labPath: string;
	outputDir?: string;
	outputFile?: string;
	createDeployment?: boolean;
	containerlabServer?: string;
};

export type UserScopeEveConvertResponse = {
	userId: string;
	path: string;
	deployment?: UserScopeDeployment;
	warnings?: string[];
};

export async function listUserScopeEveServers(
	userId: string,
): Promise<UserScopeEveServersResponse> {
	void userId;
	return apiFetch<UserScopeEveServersResponse>("/api/byos/me/eve/servers");
}

export async function listUserScopeEveLabs(
	userId: string,
	params?: { server?: string; path?: string; recursive?: boolean },
): Promise<UserScopeEveLabsResponse> {
	const qs = new URLSearchParams();
	if (params?.server) qs.set("server", params.server);
	if (params?.path) qs.set("path", params.path);
	if (params?.recursive) qs.set("recursive", "true");
	const suffix = qs.toString();
	return apiFetch<UserScopeEveLabsResponse>(
		`/api/byos/users/${encodeURIComponent(userId)}/eve/labs${suffix ? `?${suffix}` : ""}`,
	);
}

export async function importUserScopeEveLab(
	userId: string,
	payload: UserScopeEveImportRequest,
): Promise<UserScopeDeployment> {
	return apiFetch<UserScopeDeployment>(
		`/api/byos/users/${encodeURIComponent(userId)}/eve/import`,
		{ method: "POST", body: JSON.stringify(payload) },
	);
}

export async function convertUserScopeEveLab(
	userId: string,
	payload: UserScopeEveConvertRequest,
): Promise<UserScopeEveConvertResponse> {
	return apiFetch<UserScopeEveConvertResponse>(
		`/api/byos/users/${encodeURIComponent(userId)}/eve/convert`,
		{ method: "POST", body: JSON.stringify(payload) },
	);
}

export async function upsertUserScopeEveServer(
	userId: string,
	payload: Partial<UserScopeEveServerConfig> & {
		name: string;
		apiUrl: string;
		webUrl?: string;
		skipTlsVerify: boolean;
		apiUser?: string;
		apiPassword?: string;
	},
): Promise<UserScopeEveServerConfig> {
	void userId;
	return apiFetch<UserScopeEveServerConfig>("/api/byos/me/eve/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserScopeEveServer(
	userId: string,
	serverId: string,
): Promise<void> {
	void userId;
	await apiFetch<void>(
		`/api/byos/me/eve/servers/${encodeURIComponent(serverId)}`,
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

export type UserEveServerConfig = {
	id?: string;
	name: string;
	apiUrl: string;
	webUrl?: string;
	skipTlsVerify: boolean;
	apiUser?: string;
	apiPassword?: string;
	sshHost?: string;
	sshUser?: string;
	sshKey?: string;
	hasPassword?: boolean;
};
export type UserEveServersResponse = { servers: UserEveServerConfig[] };

export async function listUserEveServers(): Promise<UserEveServersResponse> {
	return apiFetch<UserEveServersResponse>("/api/byos/me/eve/servers");
}

export async function upsertUserEveServer(
	payload: UserEveServerConfig,
): Promise<UserEveServerConfig> {
	return apiFetch<UserEveServerConfig>("/api/byos/me/eve/servers", {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

export async function deleteUserEveServer(serverId: string): Promise<void> {
	await apiFetch<void>(
		`/api/byos/me/eve/servers/${encodeURIComponent(serverId)}`,
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
