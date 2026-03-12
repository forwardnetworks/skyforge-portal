import { apiFetch } from "./http";
import type { CapacityGrowthRow } from "./api-client-deployments-capacity-shared";

export type DeploymentCapacityGrowthQuery = {
	metric: string;
	window: string;
	objectType?: string;
	compareHours?: number;
	limit?: number;
};

export type DeploymentCapacityGrowthResponse = {
	userId: string;
	deploymentId: string;
	metric: string;
	window: string;
	objectType?: string;
	asOf?: string;
	compareAsOf?: string;
	compareHours: number;
	rows: CapacityGrowthRow[];
};

export type ForwardNetworkCapacityGrowthResponse = {
	userId: string;
	networkRef: string;
	forwardNetworkId: string;
	metric: string;
	window: string;
	objectType?: string;
	asOf?: string;
	compareAsOf?: string;
	compareHours: number;
	rows: CapacityGrowthRow[];
};

export async function getDeploymentCapacityGrowth(
	userId: string,
	deploymentId: string,
	q: DeploymentCapacityGrowthQuery,
): Promise<DeploymentCapacityGrowthResponse> {
	const qs = new URLSearchParams();
	qs.set("metric", q.metric);
	qs.set("window", q.window);
	if (q.objectType) qs.set("objectType", q.objectType);
	if (q.compareHours) qs.set("compareHours", String(q.compareHours));
	if (q.limit) qs.set("limit", String(q.limit));
	return apiFetch<DeploymentCapacityGrowthResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/growth?${qs.toString()}`,
	);
}

export async function getForwardNetworkCapacityGrowth(
	userId: string,
	networkRef: string,
	q: DeploymentCapacityGrowthQuery,
): Promise<ForwardNetworkCapacityGrowthResponse> {
	const qs = new URLSearchParams();
	qs.set("metric", q.metric);
	qs.set("window", q.window);
	if (q.objectType) qs.set("objectType", q.objectType);
	if (q.compareHours) qs.set("compareHours", String(q.compareHours));
	if (q.limit) qs.set("limit", String(q.limit));
	return apiFetch<ForwardNetworkCapacityGrowthResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/growth?${qs.toString()}`,
	);
}
