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
	designerState?: Record<string, unknown>;
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

export type ImportTopologySource = "containerlab" | "eve-ng" | "gns3";

export type ImportTopologyRequest = {
	source?: ImportTopologySource;
	topologyYAML: string;
	filename?: string;
	sidecarFiles?: Record<string, string>;
};

export type ImportTopologyIssue = {
	severity: "error" | "warning" | "info";
	code: string;
	message: string;
	path?: string;
};

export type ImportTopologyImageMapping = {
	node: string;
	source: string;
	resolved?: string;
	matched: boolean;
	reason?: string;
};

export type ImportTopologyResponse = {
	userId?: string;
	source: ImportTopologySource;
	detectedSource?: ImportTopologySource;
	convertedYAML: string;
	issues: ImportTopologyIssue[];
	imageMappings: ImportTopologyImageMapping[];
	unsupportedFeatures?: string[];
	blocking: boolean;
	canImport?: boolean;
	stats?: {
		nodes: number;
		links: number;
		placeholderNodes: number;
		warnings: number;
		errors: number;
	};
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

export async function importTopology(
	userId: string,
	body: ImportTopologyRequest,
): Promise<ImportTopologyResponse> {
	return apiFetch<ImportTopologyResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments-designer/kne/import`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type SaveKneTopologyYAMLResponse = {
	userId: string;
	branch: string;
	templatesDir: string;
	template: string;
	filePath: string;
	designerSidecarPath?: string;
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

export type GetKneDesignerSidecarResponse = {
	userId: string;
	branch: string;
	templatesDir: string;
	template: string;
	filePath: string;
	designerSidecarPath: string;
	found: boolean;
	designerState?: Record<string, unknown>;
};

export async function getKneDesignerSidecar(
	userId: string,
	query: { dir?: string; file: string },
): Promise<GetKneDesignerSidecarResponse> {
	const params = new URLSearchParams();
	if (query.dir) params.set("dir", query.dir);
	params.set("file", query.file);
	return apiFetch<GetKneDesignerSidecarResponse>(
		`/api/users/${encodeURIComponent(userId)}/kne/designer-sidecar?${params.toString()}`,
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
