import type {
	DeploymentUIEventsResponse,
	ISO8601,
	UserScopeDeployment,
} from "./api-client-user-user-scope";
import { apiFetch } from "./http";

export type UserScopeDeploymentListResponse = {
	userId: string;
	deployments: UserScopeDeployment[];
};

export async function listUserScopeDeployments(
	userId: string,
): Promise<UserScopeDeploymentListResponse> {
	return apiFetch<UserScopeDeploymentListResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments`,
	);
}

export async function listDeploymentUIEvents(
	userId: string,
	deploymentId: string,
	params?: { afterId?: number; limit?: number },
): Promise<DeploymentUIEventsResponse> {
	const qs = new URLSearchParams();
	if (params?.afterId) qs.set("after_id", String(params.afterId));
	if (params?.limit) qs.set("limit", String(params.limit));
	const suffix = qs.toString();
	return apiFetch<DeploymentUIEventsResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/ui-events${suffix ? `?${suffix}` : ""}`,
	);
}

type TemplatesQuery = {
	source?: "user" | "blueprints" | "custom" | "external" | string;
	repo?: string;
	dir?: string;
};

export type UserScopeTemplatesResponse = {
	userId: string;
	repo: string;
	branch: string;
	dir: string;
	templates: string[];
	headSha?: string;
	cached?: boolean;
	updatedAt?: ISO8601;
};

export type UserScopeNetlabDeviceOptionsResponse = {
	userId: string;
	devices: string[];
	source?: string;
	generatedAt?: ISO8601;
};

export async function getUserScopeNetlabTemplates(
	userId: string,
	query?: TemplatesQuery,
): Promise<UserScopeTemplatesResponse> {
	const params = new URLSearchParams();
	if (query?.source) params.set("source", query.source);
	if (query?.repo) params.set("repo", query.repo);
	if (query?.dir) params.set("dir", query.dir);
	const qs = params.toString();
	return apiFetch<UserScopeTemplatesResponse>(
		`/api/users/${encodeURIComponent(userId)}/netlab/templates${qs ? `?${qs}` : ""}`,
	);
}

export async function getUserScopeNetlabDeviceOptions(
	userId: string,
): Promise<UserScopeNetlabDeviceOptionsResponse> {
	return apiFetch<UserScopeNetlabDeviceOptionsResponse>(
		`/api/users/${encodeURIComponent(userId)}/netlab/device-options`,
	);
}

export async function getUserScopeKNETemplates(
	userId: string,
	query?: TemplatesQuery,
): Promise<UserScopeTemplatesResponse> {
	const params = new URLSearchParams();
	if (query?.source) params.set("source", query.source);
	if (query?.repo) params.set("repo", query.repo);
	if (query?.dir) params.set("dir", query.dir);
	const qs = params.toString();
	return apiFetch<UserScopeTemplatesResponse>(
		`/api/users/${encodeURIComponent(userId)}/kne/templates${qs ? `?${qs}` : ""}`,
	);
}

export async function getUserScopeTerraformTemplates(
	userId: string,
	query?: TemplatesQuery,
): Promise<UserScopeTemplatesResponse> {
	const params = new URLSearchParams();
	if (query?.source) params.set("source", query.source);
	if (query?.repo) params.set("repo", query.repo);
	if (query?.dir) params.set("dir", query.dir);
	const qs = params.toString();
	return apiFetch<UserScopeTemplatesResponse>(
		`/api/users/${encodeURIComponent(userId)}/terraform/templates${qs ? `?${qs}` : ""}`,
	);
}

export type RegistryReposResponse = {
	baseUrl?: string;
	repositories: string[];
	filteredCount: number;
	totalCount: number;
};

export type RegistryTagsListResponse = {
	repository: string;
	tags: string[];
};

export type RegistryCatalogPublicImageEntry = {
	id?: string;
	label?: string;
	nos?: string;
	vendor?: string;
	model?: string;
	kind?: string;
	role?: "host" | "router" | "switch" | "firewall" | "other" | string;
	repository: string;
	defaultTag?: string;
	aliases?: string[];
	enabled: boolean;
};

export type RegistryCatalogResponse = {
	source: string;
	baseUrl?: string;
	images: RegistryCatalogPublicImageEntry[];
	retrievedAt?: ISO8601;
};

export async function listRegistryRepositories(params?: {
	q?: string;
	n?: number;
}): Promise<RegistryReposResponse> {
	const qs = new URLSearchParams();
	if (params?.q) qs.set("q", params.q);
	if (params?.n) qs.set("n", String(params.n));
	const suffix = qs.toString();
	return apiFetch<RegistryReposResponse>(
		`/api/registry/repos${suffix ? `?${suffix}` : ""}`,
	);
}

export async function listRegistryTags(
	repo: string,
	params?: { q?: string },
): Promise<RegistryTagsListResponse> {
	const qs = new URLSearchParams();
	if (params?.q) qs.set("q", params.q);
	const suffix = qs.toString();
	return apiFetch<RegistryTagsListResponse>(
		`/api/registry/repos/${encodeURIComponent(repo)}/tags${suffix ? `?${suffix}` : ""}`,
	);
}

export async function getRegistryCatalog(): Promise<RegistryCatalogResponse> {
	return apiFetch<RegistryCatalogResponse>("/api/registry/catalog");
}
