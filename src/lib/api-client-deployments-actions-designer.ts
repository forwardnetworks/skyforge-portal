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

export type ImportContainerlabTopologyRequest = {
	topologyYAML: string;
};

export type ImportContainerlabIssue = {
	severity: "error" | "warning" | "info";
	code: string;
	message: string;
	path?: string;
};

export type ImportContainerlabImageMapping = {
	node: string;
	source: string;
	resolved?: string;
	matched: boolean;
	reason?: string;
};

export type ImportContainerlabTopologyResponse = {
	userId?: string;
	convertedYAML: string;
	issues: ImportContainerlabIssue[];
	imageMappings: ImportContainerlabImageMapping[];
	blocking: boolean;
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

export async function importContainerlabTopology(
	userId: string,
	body: ImportContainerlabTopologyRequest,
): Promise<ImportContainerlabTopologyResponse> {
	return apiFetch<ImportContainerlabTopologyResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments-designer/kne/import-containerlab`,
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
