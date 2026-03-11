import type {
	JSONMap,
	LinkAdminRequest,
	LinkAdminResponse,
	LinkCaptureRequest,
	LinkCaptureResponse,
	LinkImpairmentRequest,
	LinkImpairmentResponse,
	UserScopeDeployment,
} from "./api-client-user-user-scope";
import { apiFetch } from "./http";
import type { operations } from "./openapi.gen";

const RESOURCE_ESTIMATE_TIMEOUT_MS = 8_000;

export type UpdateDeploymentForwardConfigRequest = {
	enabled: boolean;
	collectorConfigId?: string;
	collectorUsername?: string;
	autoSyncOnBringUp?: boolean;
};

export type UpdateDeploymentForwardConfigResponse = {
	userId: string;
	deploymentId: string;
	enabled: boolean;
	collectorConfigId?: string;
	collectorUsername?: string;
	autoSyncOnBringUp?: boolean;
	forwardNetworkId?: string;
	forwardSnapshotUrl?: string;
};

export async function updateDeploymentForwardConfig(
	userId: string,
	deploymentId: string,
	body: UpdateDeploymentForwardConfigRequest,
): Promise<UpdateDeploymentForwardConfigResponse> {
	return apiFetch<UpdateDeploymentForwardConfigResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/forward`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type SyncDeploymentForwardResponse = {
	userId: string;
	deploymentId: string;
	run: JSONMap;
};

export async function syncDeploymentForward(
	userId: string,
	deploymentId: string,
): Promise<SyncDeploymentForwardResponse> {
	return apiFetch<SyncDeploymentForwardResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/forward/sync`,
		{ method: "POST", body: "{}" },
	);
}

export async function setDeploymentLinkImpairment(
	userId: string,
	deploymentId: string,
	body: LinkImpairmentRequest,
): Promise<LinkImpairmentResponse> {
	return apiFetch<LinkImpairmentResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/links/impair`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function setDeploymentLinkAdmin(
	userId: string,
	deploymentId: string,
	body: LinkAdminRequest,
): Promise<LinkAdminResponse> {
	return apiFetch<LinkAdminResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/links/admin`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function captureDeploymentLinkPcap(
	userId: string,
	deploymentId: string,
	body: LinkCaptureRequest,
): Promise<LinkCaptureResponse> {
	return apiFetch<LinkCaptureResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/links/capture`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export type DeploymentNodeSaveConfigResponse = {
	namespace?: string;
	podName?: string;
	container?: string;
	command?: string;
	stdout?: string;
	stderr?: string;
	skipped?: boolean;
	message?: string;
};

export async function saveDeploymentNodeConfig(
	userId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeSaveConfigResponse> {
	return apiFetch<DeploymentNodeSaveConfigResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/save-config`,
		{ method: "POST", body: "{}" },
	);
}

export type ResourceEstimateSummary = {
	supported: boolean;
	vcpu: number;
	ramGiB: number;
	milliCpu: number;
	memoryBytes: number;
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

export type ValidateUserScopeNetlabTemplateRequest = {
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

export async function estimateUserScopeTemplateResources(
	userId: string,
	body: UserScopeTemplateResourceEstimateRequest,
): Promise<UserScopeTemplateResourceEstimateResponse> {
	return apiFetchWithTimeout<UserScopeTemplateResourceEstimateResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployment-templates/resource-estimate`,
		RESOURCE_ESTIMATE_TIMEOUT_MS,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
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

export type CreateUserScopeDeploymentRequest = {
	name: string;
	family: "terraform" | "c9s" | "byos" | string;
	engine: "terraform" | "netlab" | "containerlab" | "eve_ng" | string;
	config?: JSONMap;
};
export type CreateUserScopeDeploymentResponse = UserScopeDeployment;

export async function createUserScopeDeployment(
	userId: string,
	body: CreateUserScopeDeploymentRequest,
): Promise<CreateUserScopeDeploymentResponse> {
	return apiFetch<CreateUserScopeDeploymentResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

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

export type CreateUserScopeRequest = NonNullable<
	operations["POST:skyforge.CreateUserScope"]["requestBody"]
>["content"]["application/json"];

export type CreateUserScopeResponse =
	operations["POST:skyforge.CreateUserScope"]["responses"][200]["content"]["application/json"];

export async function createUserScope(
	body: CreateUserScopeRequest,
): Promise<CreateUserScopeResponse> {
	return apiFetch<CreateUserScopeResponse>("/api/users", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export type UpdateUserScopeMembersRequest = NonNullable<
	operations["PUT:skyforge.UpdateUserScopeMembers"]["requestBody"]
>["content"]["application/json"];
export type UpdateUserScopeMembersResponse =
	operations["PUT:skyforge.UpdateUserScopeMembers"]["responses"][200]["content"]["application/json"];
export async function updateUserScopeMembers(
	userId: string,
	body: UpdateUserScopeMembersRequest,
): Promise<UpdateUserScopeMembersResponse> {
	return apiFetch<UpdateUserScopeMembersResponse>(
		`/api/users/${encodeURIComponent(userId)}/members`,
		{ method: "PUT", body: JSON.stringify(body) },
	);
}

export type DeleteUserScopeResponse =
	operations["DELETE:skyforge.DeleteUserScope"]["responses"][200]["content"]["application/json"];
export async function deleteUserScope(
	userId: string,
	params: { confirm: string; force?: boolean },
): Promise<DeleteUserScopeResponse> {
	const qs = new URLSearchParams();
	qs.set("confirm", params.confirm);
	if (params.force) qs.set("force", "true");
	return apiFetch<DeleteUserScopeResponse>(
		`/api/users/${encodeURIComponent(userId)}?${qs.toString()}`,
		{ method: "DELETE" },
	);
}
