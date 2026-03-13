import { apiFetch } from "./http";

export type ConfigChangeRunRecord = {
	id: string;
	username: string;
	targetType: string;
	targetRef: string;
	targetName?: string;
	sourceKind: string;
	executionMode: string;
	status: string;
	approvalState: string;
	summary?: string;
	ticketRef?: string;
	requestedBy: string;
	approvedBy?: string;
	specJson?: string;
	normalizedSpecJson?: string;
	reviewJson?: string;
	metadata?: Record<string, string>;
	rollbackSummary?: {
		previousTopologyArtifactKey?: string;
		previousNodeStatusCount?: number;
		previousNodeStatusUpdatedAt?: string;
		previousDeploymentConfigJson?: string;
	};
	executionSummary?: {
		taskId?: number;
		userScopeId?: string;
		deploymentId?: string;
		executionPath?: string;
		executionBackend?: string;
		verificationBackend?: string;
		plannedExecutionTaskType?: string;
		topologyArtifactKey?: string;
		nodeStatusCount?: number;
		deviceResults?: Array<{
			name: string;
			deviceKey?: string;
			forwardType?: string;
			kind?: string;
			image?: string;
			mgmtHost?: string;
			mgmtIp?: string;
			pingIp?: string;
			nodeStatus?: string;
			taskId?: number;
			updatedAt?: string;
		}>;
		artifactRefs?: Array<{
			kind?: string;
			name?: string;
			key?: string;
		}>;
		verified?: boolean;
		verificationWarnings?: string[];
		verifiedAt?: string;
	};
	executionTaskId?: number;
	renderedAt?: string;
	queuedAt?: string;
	createdAt: string;
	updatedAt: string;
};

export type ConfigChangeRunEvent = {
	id: string;
	runId: string;
	status?: string;
	eventType: string;
	message?: string;
	details?: Record<string, string>;
	createdBy?: string;
	createdAt: string;
};

export type ConfigChangeRunLifecycle = {
	run?: ConfigChangeRunRecord;
	events: ConfigChangeRunEvent[];
};

export type ConfigChangeRunReview = {
	controlPlaneTaskType?: string;
	plannedExecutionTaskType?: string;
	executionPath?: string;
	executionBackend?: string;
	verificationBackend?: string;
	changeCount?: number;
	deviceCount?: number;
	devices?: Array<{
		name: string;
		changeCount?: number;
		summary?: string;
	}>;
	diffs?: Array<{
		device?: string;
		title?: string;
		before?: string;
		after?: string;
		summary?: string;
	}>;
	artifactRefs?: Array<{
		kind?: string;
		name?: string;
		key?: string;
	}>;
	warnings?: string[];
};

export type ListConfigChangesResponse = {
	runs: ConfigChangeRunRecord[];
};

export type ConfigChangeReviewResponse = {
	review?: ConfigChangeRunReview;
};

export type CreateConfigChangeRunRequest = {
	targetType: string;
	targetRef: string;
	targetName?: string;
	sourceKind: string;
	executionMode: string;
	summary?: string;
	ticketRef?: string;
	specJson?: string;
	metadata?: Record<string, string>;
};

export async function listCurrentConfigChangeRuns(): Promise<ListConfigChangesResponse> {
	return apiFetch<ListConfigChangesResponse>("/api/config-changes");
}

export async function listAdminConfigChangeRuns(): Promise<ListConfigChangesResponse> {
	return apiFetch<ListConfigChangesResponse>("/api/admin/config-changes");
}

export async function createCurrentConfigChangeRun(
	body: CreateConfigChangeRunRequest,
): Promise<ConfigChangeRunRecord> {
	return apiFetch<ConfigChangeRunRecord>("/api/config-changes", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function getCurrentConfigChangeRun(
	id: string,
): Promise<ConfigChangeRunRecord> {
	return apiFetch<ConfigChangeRunRecord>(
		`/api/config-changes/${encodeURIComponent(id)}`,
	);
}

export async function getCurrentConfigChangeRunReview(
	id: string,
): Promise<ConfigChangeReviewResponse> {
	return apiFetch<ConfigChangeReviewResponse>(
		`/api/config-changes/${encodeURIComponent(id)}/review`,
	);
}

export async function getAdminConfigChangeRunReview(
	id: string,
): Promise<ConfigChangeReviewResponse> {
	return apiFetch<ConfigChangeReviewResponse>(
		`/api/admin/config-changes/${encodeURIComponent(id)}/review`,
	);
}

export async function getCurrentConfigChangeRunLifecycle(
	id: string,
): Promise<ConfigChangeRunLifecycle> {
	return apiFetch<ConfigChangeRunLifecycle>(
		`/api/config-changes/${encodeURIComponent(id)}/lifecycle`,
	);
}

export async function getAdminConfigChangeRunLifecycle(
	id: string,
): Promise<ConfigChangeRunLifecycle> {
	return apiFetch<ConfigChangeRunLifecycle>(
		`/api/admin/config-changes/${encodeURIComponent(id)}/lifecycle`,
	);
}

export async function renderCurrentConfigChangeRun(
	id: string,
): Promise<ConfigChangeRunRecord> {
	return apiFetch<ConfigChangeRunRecord>(
		`/api/config-changes/${encodeURIComponent(id)}/render`,
		{
			method: "POST",
			body: "{}",
		},
	);
}

type ConfigChangeRunActionBody = {
	message?: string;
	details?: Record<string, string>;
};

export async function approveAdminConfigChangeRun(
	id: string,
	body: ConfigChangeRunActionBody = {},
): Promise<ConfigChangeRunRecord> {
	return apiFetch<ConfigChangeRunRecord>(
		`/api/admin/config-changes/${encodeURIComponent(id)}/approve`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function rejectAdminConfigChangeRun(
	id: string,
	body: ConfigChangeRunActionBody = {},
): Promise<ConfigChangeRunRecord> {
	return apiFetch<ConfigChangeRunRecord>(
		`/api/admin/config-changes/${encodeURIComponent(id)}/reject`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function executeAdminConfigChangeRun(
	id: string,
	body: ConfigChangeRunActionBody = {},
): Promise<ConfigChangeRunRecord> {
	return apiFetch<ConfigChangeRunRecord>(
		`/api/admin/config-changes/${encodeURIComponent(id)}/execute`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function rollbackAdminConfigChangeRun(
	id: string,
	body: ConfigChangeRunActionBody = {},
): Promise<ConfigChangeRunRecord> {
	return apiFetch<ConfigChangeRunRecord>(
		`/api/admin/config-changes/${encodeURIComponent(id)}/rollback`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}
