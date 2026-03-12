import type {
	LinkAdminRequest,
	LinkAdminResponse,
	LinkCaptureRequest,
	LinkCaptureResponse,
	LinkImpairmentRequest,
	LinkImpairmentResponse,
	JSONMap,
} from "./api-client-user-user-scope";
import { apiFetch } from "./http";

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
