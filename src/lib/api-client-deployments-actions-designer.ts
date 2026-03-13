import type { JSONMap, UserScopeDeployment } from "./api-client-user-user-scope";
import { apiFetch } from "./http";

export type CreateKneDeploymentFromYAMLRequest = {
	name: string;
	topologyYAML: string;
	templatesDir?: string;
	template?: string;
	autoDeploy?: boolean;
};

export type CreateKneDeploymentFromYAMLResponse = {
	userId: string;
	deployment?: UserScopeDeployment;
	run?: JSONMap;
	note?: string;
};

export async function createKneDeploymentFromYAML(
	userId: string,
	body: CreateKneDeploymentFromYAMLRequest,
): Promise<CreateKneDeploymentFromYAMLResponse> {
	return apiFetch<CreateKneDeploymentFromYAMLResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments-designer/kne/from-yaml`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type SaveKneTopologyYAMLRequest = {
	name: string;
	topologyYAML: string;
	templatesDir?: string;
	template?: string;
};

export type ValidateKneTopologyYAMLRequest = {
	name?: string;
	topologyYAML: string;
};

export type ValidateKneTopologyYAMLResponse = {
	userId?: string;
	normalizedYAML: string;
	warnings: string[];
	errors: string[];
	valid: boolean;
};

export async function validateKneTopologyYAML(
	userId: string,
	body: ValidateKneTopologyYAMLRequest,
): Promise<ValidateKneTopologyYAMLResponse> {
	return apiFetch<ValidateKneTopologyYAMLResponse>(
		`/api/users/${encodeURIComponent(userId)}/kne/topologies/validate`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type SaveKneTopologyYAMLResponse = {
	userId: string;
	branch: string;
	templatesDir: string;
	template: string;
	filePath: string;
};

export async function saveKneTopologyYAML(
	userId: string,
	body: SaveKneTopologyYAMLRequest,
): Promise<SaveKneTopologyYAMLResponse> {
	return apiFetch<SaveKneTopologyYAMLResponse>(
		`/api/users/${encodeURIComponent(userId)}/kne/topologies`,
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

export async function createKneDeploymentFromTemplate(
	userId: string,
	body: CreateDeploymentFromTemplateRequest,
): Promise<CreateDeploymentFromTemplateResponse> {
	return apiFetch<CreateDeploymentFromTemplateResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments-designer/kne/from-template`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}
