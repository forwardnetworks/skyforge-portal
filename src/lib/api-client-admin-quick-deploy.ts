import type { ResourceEstimateSummary } from "./api-client-deployments-actions";

import { apiFetch } from "./http";

export type AdminQuickDeployCatalogResponse = {
	templates: QuickDeployTemplate[];
	repo?: string;
	branch?: string;
	dir?: string;
	options?: string[];
	source: "default" | "custom" | string;
	retrievedAt: string;
};

export type UpdateAdminQuickDeployCatalogRequest = {
	templates: QuickDeployTemplate[];
};

export type UpdateAdminQuickDeployCatalogResponse = {
	status: "ok";
	templates: QuickDeployTemplate[];
	updatedAt: string;
};

export async function getAdminQuickDeployCatalog(): Promise<AdminQuickDeployCatalogResponse> {
	return apiFetch<AdminQuickDeployCatalogResponse>(
		"/api/admin/quick-deploy/catalog",
	);
}

export async function updateAdminQuickDeployCatalog(
	body: UpdateAdminQuickDeployCatalogRequest,
): Promise<UpdateAdminQuickDeployCatalogResponse> {
	return apiFetch<UpdateAdminQuickDeployCatalogResponse>(
		"/api/admin/quick-deploy/catalog",
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export type AdminQuickDeployTemplateOptionsResponse = {
	repo: string;
	branch: string;
	dir: string;
	templates: string[];
	retrievedAt: string;
};

export async function getAdminQuickDeployTemplateOptions(): Promise<AdminQuickDeployTemplateOptionsResponse> {
	return apiFetch<AdminQuickDeployTemplateOptionsResponse>(
		"/api/admin/quick-deploy/template-options",
	);
}

export type QuickDeployTemplate = {
	id: string;
	name: string;
	description: string;
	template: string;
	owner?: string;
	operatingModes?: string[];
	resourceClass: string;
	allowedProfiles?: string[];
	resetBaselineMode?: string;
	integrationDependencies?: string[];
	placementHints?: string[];
	estimate?: ResourceEstimateSummary;
};

export type QuickDeployCatalogResponse = {
	templates: QuickDeployTemplate[];
	leaseOptions: number[];
	defaultLeaseHours: number;
};

export type QuickDeployRunRequest = {
	template: string;
	leaseHours?: number;
	name?: string;
};

export type QuickDeployRunResponse = {
	userId: string;
	deploymentId: string;
	deploymentName: string;
	noOp?: boolean;
	reason?: string;
};

export async function getQuickDeployCatalog(): Promise<QuickDeployCatalogResponse> {
	return apiFetch<QuickDeployCatalogResponse>("/api/quick-deploy/catalog");
}

export async function runQuickDeploy(
	body: QuickDeployRunRequest,
): Promise<QuickDeployRunResponse> {
	return apiFetch<QuickDeployRunResponse>("/api/quick-deploy/deploy", {
		method: "POST",
		body: JSON.stringify(body),
	});
}
