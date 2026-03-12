import { apiFetch } from "./http";
import type {
	CapacityPerfProxyResponse,
	GetCapacityUnhealthyDevicesQuery,
	GetCapacityUnhealthyInterfacesQuery,
	PostCapacityDeviceMetricsHistoryRequest,
	PostCapacityInterfaceMetricsHistoryRequest,
	PostCapacityUnhealthyInterfacesRequest,
} from "./api-client-deployments-capacity-shared";

export async function postDeploymentCapacityInterfaceMetricsHistory(
	userId: string,
	deploymentId: string,
	body: PostCapacityInterfaceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/interface-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function postForwardNetworkCapacityInterfaceMetricsHistory(
	userId: string,
	networkRef: string,
	body: PostCapacityInterfaceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/perf/interface-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function postDeploymentCapacityDeviceMetricsHistory(
	userId: string,
	deploymentId: string,
	body: PostCapacityDeviceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/device-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function postForwardNetworkCapacityDeviceMetricsHistory(
	userId: string,
	networkRef: string,
	body: PostCapacityDeviceMetricsHistoryRequest,
): Promise<CapacityPerfProxyResponse> {
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/perf/device-metrics-history`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function getDeploymentCapacityUnhealthyDevices(
	userId: string,
	deploymentId: string,
	q: GetCapacityUnhealthyDevicesQuery,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/unhealthy-devices${suffix}`,
	);
}

export async function getForwardNetworkCapacityUnhealthyDevices(
	userId: string,
	networkRef: string,
	q: GetCapacityUnhealthyDevicesQuery,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/perf/unhealthy-devices${suffix}`,
	);
}

export async function postDeploymentCapacityUnhealthyInterfaces(
	userId: string,
	deploymentId: string,
	q: GetCapacityUnhealthyInterfacesQuery,
	body: PostCapacityUnhealthyInterfacesRequest,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/perf/unhealthy-interfaces${suffix}`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}

export async function postForwardNetworkCapacityUnhealthyInterfaces(
	userId: string,
	networkRef: string,
	q: GetCapacityUnhealthyInterfacesQuery,
	body: PostCapacityUnhealthyInterfacesRequest,
): Promise<CapacityPerfProxyResponse> {
	const qs = new URLSearchParams();
	if (q.snapshotId) qs.set("snapshotId", q.snapshotId);
	if (q.endTime) qs.set("endTime", q.endTime);
	const suffix = qs.toString() ? `?${qs.toString()}` : "";
	return apiFetch<CapacityPerfProxyResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/perf/unhealthy-interfaces${suffix}`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}
