import { apiFetch } from "./http";
import type { AssuranceScenarioSpec } from "./assurance-studio-api";

export type AssuranceStudioRun = {
	id: string;
	workspaceId: string;
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
	workspaceId: string;
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
	workspaceId: string,
	networkRef: string,
): Promise<AssuranceStudioListRunsResponse> {
	return apiFetch<AssuranceStudioListRunsResponse>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/forward-networks/${encodeURIComponent(networkRef)}/assurance/studio/runs`,
	);
}

export async function createAssuranceStudioRun(
	workspaceId: string,
	networkRef: string,
	body: AssuranceStudioCreateRunRequest,
): Promise<AssuranceStudioRun> {
	return apiFetch<AssuranceStudioRun>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/forward-networks/${encodeURIComponent(networkRef)}/assurance/studio/runs`,
		{ method: "POST", body: JSON.stringify(body ?? {}) },
	);
}

export async function getAssuranceStudioRun(
	workspaceId: string,
	networkRef: string,
	runId: string,
): Promise<AssuranceStudioRunDetail> {
	return apiFetch<AssuranceStudioRunDetail>(
		`/api/workspaces/${encodeURIComponent(workspaceId)}/forward-networks/${encodeURIComponent(networkRef)}/assurance/studio/runs/${encodeURIComponent(runId)}`,
	);
}
