import type { JSONMap, UserScopeDeployment } from "./api-client-user-user-scope";
import { apiFetch } from "./http";

export type CreateContainerlabDeploymentFromYAMLRequest = {
	name: string;
	netlabServer?: string;
	topologyYAML: string;
	templatesDir?: string;
	template?: string;
	autoDeploy?: boolean;
};

export type CreateContainerlabDeploymentFromYAMLResponse = {
	userId: string;
	deployment?: UserScopeDeployment;
	run?: JSONMap;
	note?: string;
};

export async function createContainerlabDeploymentFromYAML(
	userId: string,
	body: CreateContainerlabDeploymentFromYAMLRequest,
): Promise<CreateContainerlabDeploymentFromYAMLResponse> {
	return apiFetch<CreateContainerlabDeploymentFromYAMLResponse>(
		`/api/byos/users/${encodeURIComponent(userId)}/deployments-designer/containerlab/from-yaml`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type CreateClabernetesDeploymentFromYAMLRequest = {
	name: string;
	topologyYAML: string;
	templatesDir?: string;
	template?: string;
	autoDeploy?: boolean;
};

export type CreateClabernetesDeploymentFromYAMLResponse = {
	userId: string;
	deployment?: UserScopeDeployment;
	run?: JSONMap;
	note?: string;
};

export async function createClabernetesDeploymentFromYAML(
	userId: string,
	body: CreateClabernetesDeploymentFromYAMLRequest,
): Promise<CreateClabernetesDeploymentFromYAMLResponse> {
	return apiFetch<CreateClabernetesDeploymentFromYAMLResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments-designer/clabernetes/from-yaml`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type SaveContainerlabTopologyYAMLRequest = {
	name: string;
	topologyYAML: string;
	templatesDir?: string;
	template?: string;
};

export type ValidateContainerlabTopologyYAMLRequest = {
	name?: string;
	topologyYAML: string;
};

export type ValidateContainerlabTopologyYAMLResponse = {
	userId?: string;
	normalizedYAML: string;
	warnings: string[];
	errors: string[];
	valid: boolean;
};

export async function validateContainerlabTopologyYAML(
	userId: string,
	body: ValidateContainerlabTopologyYAMLRequest,
): Promise<ValidateContainerlabTopologyYAMLResponse> {
	return apiFetch<ValidateContainerlabTopologyYAMLResponse>(
		`/api/users/${encodeURIComponent(userId)}/containerlab/topologies/validate`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type SaveContainerlabTopologyYAMLResponse = {
	userId: string;
	branch: string;
	templatesDir: string;
	template: string;
	filePath: string;
};

export async function saveContainerlabTopologyYAML(
	userId: string,
	body: SaveContainerlabTopologyYAMLRequest,
): Promise<SaveContainerlabTopologyYAMLResponse> {
	return apiFetch<SaveContainerlabTopologyYAMLResponse>(
		`/api/byos/users/${encodeURIComponent(userId)}/containerlab/topologies`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type CreateDeploymentFromTemplateRequest = {
	name: string;
	templateSource?: string;
	templatesDir?: string;
	template: string;
	autoDeploy?: boolean;
};

export type CreateDeploymentFromTemplateResponse = {
	userId: string;
	deployment?: UserScopeDeployment;
	run?: JSONMap;
	note?: string;
};

export type CreateContainerlabDeploymentFromTemplateRequest =
	CreateDeploymentFromTemplateRequest & {
		netlabServer?: string;
	};

export async function createClabernetesDeploymentFromTemplate(
	userId: string,
	body: CreateDeploymentFromTemplateRequest,
): Promise<CreateDeploymentFromTemplateResponse> {
	return apiFetch<CreateDeploymentFromTemplateResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments-designer/clabernetes/from-template`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function createContainerlabDeploymentFromTemplate(
	userId: string,
	body: CreateContainerlabDeploymentFromTemplateRequest,
): Promise<CreateDeploymentFromTemplateResponse> {
	return apiFetch<CreateDeploymentFromTemplateResponse>(
		`/api/byos/users/${encodeURIComponent(userId)}/deployments-designer/containerlab/from-template`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}
