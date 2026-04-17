import type { ISO8601 } from "./api-client-user-user-scope";
import { apiFetch } from "./http";

export type ObservabilityEndpointSummary = {
	endpointKey: string;
	count: number;
	errorCount: number;
	p50Ms: number;
	p95Ms: number;
	p99Ms: number;
	topCause?: string;
};

export type ObservabilityAdvisory = {
	level: "ok" | "warn" | "crit" | string;
	metric: string;
	value: number;
	threshold: number;
	message: string;
};

export type ObservabilitySummaryResponse = {
	generatedAt: ISO8601;
	endpoints: ObservabilityEndpointSummary[];
	queueQueued: number;
	queueRunning: number;
	queueOldestSec: number;
	workerHeartbeatSec: number;
	nodeCpuActiveP95: number;
	nodeMemUsedP95: number;
	advisories?: ObservabilityAdvisory[];
};

export type ObservabilitySeriesPoint = {
	timestamp: ISO8601;
	value: number;
};

export type ObservabilitySeriesResponse = {
	metric: string;
	window: string;
	points: ObservabilitySeriesPoint[];
};

export type ObservabilitySlowRequest = {
	collectedAt: ISO8601;
	endpointKey: string;
	statusCode: number;
	totalMs: number;
	phaseDbMs: number;
	phaseEnrichMs: number;
	queueOldestSec: number;
	workerHeartbeatSec: number;
	causeCode: string;
};

export type ObservabilitySlowRequestsResponse = {
	window: string;
	requests: ObservabilitySlowRequest[];
};

export type ForwardObservabilitySummary = {
	namespace: string;
	sourceStatus: "ok" | "degraded" | "missing" | string;
	prometheusService: boolean;
	grafanaService: boolean;
	prometheusReachable: boolean;
	prometheusUpSum?: number;
	prometheusTargetCount?: number;
	targetJobs?: {
		job: string;
		totalTargets: number;
		upTargets: number;
		downTargets: number;
	}[];
	error?: string;
	checkedAt: ISO8601;
};

export type UserObservabilitySummaryResponse = {
	generatedAt: ISO8601;
	scope: "user" | "admin" | string;
	skyforge: ObservabilitySummaryResponse;
	forward: ForwardObservabilitySummary;
};

export type UserObservabilitySeriesResponse = {
	scope: "user" | "admin" | string;
	metric: string;
	window: string;
	points: ObservabilitySeriesPoint[];
};

export async function getObservabilitySummary(): Promise<ObservabilitySummaryResponse> {
	return apiFetch<ObservabilitySummaryResponse>(
		"/api/admin/observability/summary",
	);
}

export async function getObservabilitySeries(params: {
	metric: string;
	window?: string;
}): Promise<ObservabilitySeriesResponse> {
	const qs = new URLSearchParams();
	qs.set("metric", params.metric);
	if (params.window) qs.set("window", params.window);
	return apiFetch<ObservabilitySeriesResponse>(
		`/api/admin/observability/series?${qs.toString()}`,
	);
}

export async function getObservabilitySlowRequests(params?: {
	window?: string;
	endpoint?: string;
	limit?: number;
}): Promise<ObservabilitySlowRequestsResponse> {
	const qs = new URLSearchParams();
	if (params?.window) qs.set("window", params.window);
	if (params?.endpoint) qs.set("endpoint", params.endpoint);
	if (typeof params?.limit === "number" && params.limit > 0) {
		qs.set("limit", String(params.limit));
	}
	const suffix = qs.toString();
	return apiFetch<ObservabilitySlowRequestsResponse>(
		`/api/admin/observability/slow-requests${suffix ? `?${suffix}` : ""}`,
	);
}

export async function getUserObservabilitySummary(): Promise<UserObservabilitySummaryResponse> {
	return apiFetch<UserObservabilitySummaryResponse>(
		"/api/observability/summary",
	);
}

export async function getUserObservabilitySeries(params: {
	metric: string;
	window?: string;
}): Promise<UserObservabilitySeriesResponse> {
	const qs = new URLSearchParams();
	qs.set("metric", params.metric);
	if (params.window) qs.set("window", params.window);
	return apiFetch<UserObservabilitySeriesResponse>(
		`/api/observability/series?${qs.toString()}`,
	);
}
