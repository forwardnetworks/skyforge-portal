import type {
	DeploymentInventoryResponse,
	DeploymentNodeInterfacesResponse,
	DeploymentTopology,
	ISO8601,
} from "./api-client-user-user-scope";
import { apiFetch } from "./http";

export async function getDeploymentNodeInterfaces(
	userId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeInterfacesResponse> {
	return apiFetch<DeploymentNodeInterfacesResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/interfaces`,
	);
}

export type DeploymentNodeRunningConfigResponse = {
	namespace?: string;
	podName?: string;
	container?: string;
	node?: string;
	stdout?: string;
	stderr?: string;
	skipped?: boolean;
	message?: string;
};

export async function getDeploymentNodeRunningConfig(
	userId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeRunningConfigResponse> {
	return apiFetch<DeploymentNodeRunningConfigResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/running-config`,
	);
}

export async function getDeploymentInventory(
	userId: string,
	deploymentId: string,
	format: "json" | "csv" = "json",
): Promise<DeploymentInventoryResponse> {
	const qs = new URLSearchParams();
	qs.set("format", format);
	return apiFetch<DeploymentInventoryResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/inventory?${qs.toString()}`,
	);
}

export type DeploymentNodeLogsResponse = {
	namespace?: string;
	podName?: string;
	container?: string;
	tail?: number;
	logs?: string;
};

export async function getDeploymentNodeLogs(
	userId: string,
	deploymentId: string,
	nodeId: string,
	params?: { tail?: number; container?: string },
): Promise<DeploymentNodeLogsResponse> {
	const qs = new URLSearchParams();
	if (params?.tail) qs.set("tail", String(params.tail));
	if (params?.container) qs.set("container", params.container);
	const suffix = qs.toString();
	return apiFetch<DeploymentNodeLogsResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/logs${suffix ? `?${suffix}` : ""}`,
	);
}

export type DeploymentNodeDescribeResponse = {
	namespace?: string;
	podName?: string;
	nodeName?: string;
	phase?: string;
	podIP?: string;
	hostIP?: string;
	qosClass?: string;
	message?: string;
	containers?: Array<{
		name?: string;
		image?: string;
		ready?: boolean;
		restartCount?: number;
		state?: string;
		reason?: string;
		message?: string;
	}>;
};

export async function getDeploymentNodeDescribe(
	userId: string,
	deploymentId: string,
	nodeId: string,
): Promise<DeploymentNodeDescribeResponse> {
	return apiFetch<DeploymentNodeDescribeResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/describe`,
	);
}

export type LinkStatsSnapshot = {
	generatedAt: ISO8601;
	source: string;
	edges: Array<{
		edgeId: string;
		sourceNode: string;
		sourceIf: string;
		sourceRxBytes: number;
		sourceTxBytes: number;
		sourceRxPackets: number;
		sourceTxPackets: number;
		sourceRxDropped: number;
		sourceTxDropped: number;
		targetNode: string;
		targetIf: string;
		targetRxBytes: number;
		targetTxBytes: number;
		targetRxPackets: number;
		targetTxPackets: number;
		targetRxDropped: number;
		targetTxDropped: number;
	}>;
};

export async function getDeploymentLinkStats(
	userId: string,
	deploymentId: string,
): Promise<LinkStatsSnapshot> {
	return apiFetch<LinkStatsSnapshot>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/links/stats`,
	);
}

export type UserScopeNetlabTemplateResponse = {
	userId: string;
	source: string;
	repo?: string;
	branch?: string;
	dir: string;
	template: string;
	path: string;
	yaml: string;
};

export async function getUserScopeNetlabTemplate(
	userId: string,
	params: { source?: string; repo?: string; dir?: string; template: string },
): Promise<UserScopeNetlabTemplateResponse> {
	const qs = new URLSearchParams();
	if (params.source) qs.set("source", params.source);
	if (params.repo) qs.set("repo", params.repo);
	if (params.dir) qs.set("dir", params.dir);
	qs.set("template", params.template);
	return apiFetch<UserScopeNetlabTemplateResponse>(
		`/api/users/${encodeURIComponent(userId)}/netlab/template?${qs.toString()}`,
	);
}

export type UserScopeContainerlabTemplateResponse = {
	userId: string;
	source: string;
	repo?: string;
	branch?: string;
	dir: string;
	file: string;
	path: string;
	yaml: string;
};

export async function getUserScopeContainerlabTemplate(
	userId: string,
	params: { source?: string; repo?: string; dir?: string; file: string },
): Promise<UserScopeContainerlabTemplateResponse> {
	const qs = new URLSearchParams();
	if (params.source) qs.set("source", params.source);
	if (params.repo) qs.set("repo", params.repo);
	if (params.dir) qs.set("dir", params.dir);
	qs.set("file", params.file);
	return apiFetch<UserScopeContainerlabTemplateResponse>(
		`/api/users/${encodeURIComponent(userId)}/containerlab/template?${qs.toString()}`,
	);
}

export async function getDeploymentTopology(
	userId: string,
	deploymentId: string,
): Promise<DeploymentTopology> {
	return apiFetch<DeploymentTopology>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/topology`,
	);
}
