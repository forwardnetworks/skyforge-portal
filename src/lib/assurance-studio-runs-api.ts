import type { AssuranceScenarioSpec } from "./assurance-studio-api";
import { apiFetch } from "./http";

export type AssuranceStudioRun = {
	id: string;
	ownerUsername: string;
	networkRef: string;
	forwardNetworkId: string;
	scenarioId?: string;
	title: string;
	status: string;
	error?: string;
	createdBy: string;
	startedAt: string;
	finishedAt?: string;
	createdAt: string;
	updatedAt: string;
};

export type AssuranceStudioRunDetail = {
	run: AssuranceStudioRun;
	request: AssuranceScenarioSpec;
	results?: unknown;
};

export type AssuranceStudioListRunsResponse = {
	ownerUsername: string;
	networkRef: string;
	runs: AssuranceStudioRun[];
};

export type AssuranceStudioCreateRunRequest = {
	scenarioId?: string;
	title?: string;
	status?: "SUCCEEDED" | "PARTIAL" | "FAILED";
	error?: string;
	request: AssuranceScenarioSpec;
	results?: unknown;
};

export async function listAssuranceStudioRuns(
	networkRef: string,
): Promise<AssuranceStudioListRunsResponse> {
	return apiFetch<AssuranceStudioListRunsResponse>(
		`/api/fwd/${encodeURIComponent(networkRef)}/assurance/studio/runs`,
	);
}

export async function createAssuranceStudioRun(
	networkRef: string,
	body: AssuranceStudioCreateRunRequest,
): Promise<AssuranceStudioRun> {
	return apiFetch<AssuranceStudioRun>(
		`/api/fwd/${encodeURIComponent(networkRef)}/assurance/studio/runs`,
		{ method: "POST", body: JSON.stringify(body ?? {}) },
	);
}

export async function getAssuranceStudioRun(
	networkRef: string,
	runId: string,
): Promise<AssuranceStudioRunDetail> {
	return apiFetch<AssuranceStudioRunDetail>(
		`/api/fwd/${encodeURIComponent(networkRef)}/assurance/studio/runs/${encodeURIComponent(runId)}`,
	);
}
