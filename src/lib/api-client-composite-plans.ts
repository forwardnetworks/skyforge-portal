import { apiFetch } from "./http";

export type CompositePlanStage = {
	id: string;
	provider: string;
	action: string;
	dependsOn?: string[];
	inputs?: Record<string, string>;
	outputs?: string[];
};

export type CompositePlanBinding = {
	fromStageId: string;
	fromOutput: string;
	toStageId: string;
	toInput: string;
	as?: string;
	sensitive?: boolean;
};

export type CompositePlanOutputRef = {
	stageId: string;
	output: string;
};

export type CompositePlanPreviewResponse = {
	name?: string;
	stages: CompositePlanStage[];
	bindings?: CompositePlanBinding[];
	outputs?: CompositePlanOutputRef[];
	warnings?: string[];
};

export type CompositePlanRecord = {
	id: string;
	userId: string;
	name: string;
	inputs?: Record<string, string>;
	stages: CompositePlanStage[];
	bindings?: CompositePlanBinding[];
	outputs?: CompositePlanOutputRef[];
	createdBy?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type CompositePlanListResponse = {
	userId: string;
	plans: CompositePlanRecord[];
};

export type CompositePlanUpsertRequest = {
	name: string;
	inputs?: Record<string, string>;
	stages: CompositePlanStage[];
	bindings?: CompositePlanBinding[];
	outputs?: CompositePlanOutputRef[];
};

export type CompositePlanRunResponse = {
	userScopeId: string;
	task: Record<string, unknown>;
	user: string;
};

export type CompositePlanRunRequest = {
	message?: string;
	deploymentId?: string;
	inputs?: Record<string, string>;
};

export type RunsListResponse = {
	user: string;
	tasks: Record<string, unknown>[];
};

export async function listUserScopeCompositePlans(
	userId: string,
): Promise<CompositePlanListResponse> {
	return apiFetch<CompositePlanListResponse>(
		`/api/users/${encodeURIComponent(userId)}/composite/plans`,
	);
}

export async function createUserScopeCompositePlan(
	userId: string,
	body: CompositePlanUpsertRequest,
): Promise<CompositePlanRecord> {
	return apiFetch<CompositePlanRecord>(
		`/api/users/${encodeURIComponent(userId)}/composite/plans`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function updateUserScopeCompositePlan(
	userId: string,
	planId: string,
	body: CompositePlanUpsertRequest,
): Promise<CompositePlanRecord> {
	return apiFetch<CompositePlanRecord>(
		`/api/users/${encodeURIComponent(userId)}/composite/plans/${encodeURIComponent(planId)}`,
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteUserScopeCompositePlan(
	userId: string,
	planId: string,
): Promise<CompositePlanListResponse> {
	return apiFetch<CompositePlanListResponse>(
		`/api/users/${encodeURIComponent(userId)}/composite/plans/${encodeURIComponent(planId)}`,
		{
			method: "DELETE",
		},
	);
}

export async function previewUserScopeCompositePlan(
	userId: string,
	body: CompositePlanUpsertRequest,
): Promise<CompositePlanPreviewResponse> {
	return apiFetch<CompositePlanPreviewResponse>(
		`/api/users/${encodeURIComponent(userId)}/composite/plan/preview`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function runUserScopeCompositePlan(
	userId: string,
	planId: string,
	body: CompositePlanRunRequest = {},
): Promise<CompositePlanRunResponse> {
	return apiFetch<CompositePlanRunResponse>(
		`/api/users/${encodeURIComponent(userId)}/composite/plans/${encodeURIComponent(planId)}/runs`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function listUserScopeRuns(
	userId: string,
	options: { limit?: number; owner?: string } = {},
): Promise<RunsListResponse> {
	const qs = new URLSearchParams();
	qs.set("user_id", userId);
	if (options.limit && Number.isFinite(options.limit) && options.limit > 0) {
		qs.set("limit", String(Math.trunc(options.limit)));
	}
	if (options.owner && String(options.owner).trim()) {
		qs.set("owner", String(options.owner).trim());
	}
	return apiFetch<RunsListResponse>(`/api/runs?${qs.toString()}`);
}
