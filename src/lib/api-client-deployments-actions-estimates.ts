import type { JSONMap, UserScopeDeployment } from "./api-client-user-user-scope";
import { apiFetch } from "./http";

const RESOURCE_ESTIMATE_TIMEOUT_MS = 8_000;

export type ResourceEstimateSummary = {
	supported: boolean;
	vcpu: number;
	ramGiB: number;
	milliCpu: number;
	memoryBytes: number;
	storageGiB: number;
	storageBytes: number;
	nodeCount: number;
	profiledNodeCount: number;
	reason?: string;
};

export type UserScopeTemplateResourceEstimateRequest = {
	kind: string;
	engine?: string;
	source?: string;
	repo?: string;
	dir?: string;
	template: string;
};

export type UserScopeTemplateResourceEstimateResponse = {
	userId: string;
	kind: string;
	source?: string;
	template?: string;
	estimate?: ResourceEstimateSummary;
};

export type DeploymentResourceEstimateResponse = {
	userId: string;
	deploymentId: string;
	family: string;
	engine: string;
	estimate?: ResourceEstimateSummary;
};

export type UserScopeRunResponse = {
	userId: string;
	task: JSONMap;
	user?: string;
};

export type NetlabValidationDiagnostic = {
	severity: string;
	code: string;
	message: string;
	suggestion?: string;
};

export type NetlabValidationResult = {
	valid: boolean;
	infrastructureFailure?: boolean;
	summary?: string;
	topologyPath?: string;
	diagnostics?: NetlabValidationDiagnostic[];
	rawLogTail?: string;
};

export type ValidateUserScopeNetlabTemplateSyncResponse = {
	userId: string;
	source?: string;
	repo?: string;
	dir?: string;
	template?: string;
	result: NetlabValidationResult;
};

export type UploadUserScopeNetlabTemplateArchiveRequest = {
	filename: string;
	fileBase64: string;
	environment?: JSONMap;
};

export type UploadUserScopeNetlabTemplateArchiveResponse = {
	userId: string;
	repo: string;
	dir: string;
	template: string;
	uploadedFiles: number;
	commitMessage?: string;
	result: NetlabValidationResult;
};

export type ValidateUserScopeNetlabTemplateRequest = {
	source?: string;
	repo?: string;
	dir?: string;
	template: string;
	environment?: JSONMap;
};

export type ValidateUserScopeTerraformTemplateRequest = {
	cloud?: string;
	source?: string;
	repo?: string;
	dir?: string;
	template: string;
	environment?: JSONMap;
};

export async function validateUserScopeNetlabTemplate(
	userId: string,
	body: ValidateUserScopeNetlabTemplateRequest,
): Promise<UserScopeRunResponse> {
	return apiFetch<UserScopeRunResponse>(
		`/api/users/${encodeURIComponent(userId)}/netlab/validate`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function validateUserScopeNetlabTemplateSync(
	userId: string,
	body: ValidateUserScopeNetlabTemplateRequest,
): Promise<ValidateUserScopeNetlabTemplateSyncResponse> {
	return apiFetch<ValidateUserScopeNetlabTemplateSyncResponse>(
		`/api/users/${encodeURIComponent(userId)}/netlab/validate-sync`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function uploadUserScopeNetlabTemplateArchive(
	userId: string,
	body: UploadUserScopeNetlabTemplateArchiveRequest,
): Promise<UploadUserScopeNetlabTemplateArchiveResponse> {
	return apiFetch<UploadUserScopeNetlabTemplateArchiveResponse>(
		`/api/users/${encodeURIComponent(userId)}/netlab/templates/upload`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function validateUserScopeTerraformTemplate(
	userId: string,
	body: ValidateUserScopeTerraformTemplateRequest,
): Promise<UserScopeRunResponse> {
	return apiFetch<UserScopeRunResponse>(
		`/api/users/${encodeURIComponent(userId)}/terraform/validate`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function estimateUserScopeTemplateResources(
	userId: string,
	body: UserScopeTemplateResourceEstimateRequest,
): Promise<UserScopeTemplateResourceEstimateResponse> {
	return apiFetchWithTimeout<UserScopeTemplateResourceEstimateResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployment-templates/resource-estimate`,
		RESOURCE_ESTIMATE_TIMEOUT_MS,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function getDeploymentResourceEstimate(
	userId: string,
	deploymentId: string,
): Promise<DeploymentResourceEstimateResponse> {
	return apiFetchWithTimeout<DeploymentResourceEstimateResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/resource-estimate`,
		RESOURCE_ESTIMATE_TIMEOUT_MS,
	);
}

function isAbortLikeError(err: unknown): boolean {
	if (!err) return false;
	const name = String((err as { name?: string }).name ?? "");
	return name === "AbortError";
}

async function apiFetchWithTimeout<T>(
	path: string,
	timeoutMs: number,
	init?: RequestInit,
): Promise<T> {
	const controller = new AbortController();
	const timer = globalThis.setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await apiFetch<T>(path, {
			...(init ?? {}),
			signal: controller.signal,
		});
	} catch (err) {
		if (isAbortLikeError(err)) {
			throw new Error(
				`resource estimate timed out after ${Math.round(timeoutMs / 1000)}s`,
			);
		}
		throw err;
	} finally {
		globalThis.clearTimeout(timer);
	}
}
