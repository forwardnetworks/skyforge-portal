import type { AssuranceScenarioSpec } from "./assurance-studio-api";
import { apiFetch } from "./http";

export type AssuranceStudioRun = {
	id: string;
	userContextId: string;
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
	userContextId: string;
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
	userContextId: string,
	networkRef: string,
): Promise<AssuranceStudioListRunsResponse> {
	void userContextId;
	return apiFetch<AssuranceStudioListRunsResponse>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/studio/runs`,
	);
}

export async function createAssuranceStudioRun(
	userContextId: string,
	networkRef: string,
	body: AssuranceStudioCreateRunRequest,
): Promise<AssuranceStudioRun> {
	void userContextId;
	return apiFetch<AssuranceStudioRun>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/studio/runs`,
		{ method: "POST", body: JSON.stringify(body ?? {}) },
	);
}

export async function getAssuranceStudioRun(
	userContextId: string,
	networkRef: string,
	runId: string,
): Promise<AssuranceStudioRunDetail> {
	void userContextId;
	return apiFetch<AssuranceStudioRunDetail>(
		`/api/fwd/networks/${encodeURIComponent(networkRef)}/assurance/studio/runs/${encodeURIComponent(runId)}`,
	);
}
