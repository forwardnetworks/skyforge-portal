import { apiFetch } from "./http";

export type AdminAuditEvent = {
	id: number;
	createdAt: string;
	actorUsername: string;
	actorIsAdmin: boolean;
	impersonatedUsername?: string;
	action: string;
	userId?: string;
	details?: string;
};

export type AdminAuditResponse = {
	events: AdminAuditEvent[];
	limit: number;
	timestamp: string;
};

export async function getAdminAudit(params?: {
	limit?: string;
	actor?: string;
	action?: string;
	q?: string;
	since?: string;
	until?: string;
}): Promise<AdminAuditResponse> {
	const qs = new URLSearchParams();
	if (params?.limit) qs.set("limit", params.limit);
	if (params?.actor) qs.set("actor", params.actor);
	if (params?.action) qs.set("action", params.action);
	if (params?.q) qs.set("q", params.q);
	if (params?.since) qs.set("since", params.since);
	if (params?.until) qs.set("until", params.until);
	const suffix = qs.toString();
	return apiFetch<AdminAuditResponse>(
		`/api/admin/audit${suffix ? `?${suffix}` : ""}`,
	);
}

export type AdminImpersonateStatusResponse = {
	effectiveUsername: string;
	actorUsername?: string;
	impersonating: boolean;
	time: string;
};
export async function getAdminImpersonateStatus(): Promise<AdminImpersonateStatusResponse> {
	return apiFetch<AdminImpersonateStatusResponse>(
		"/api/admin/impersonate/status",
	);
}

export type AdminImpersonateStartRequest = {
	username: string;
};
export type AdminImpersonateStartResponse = {
	status: string;
	effectiveUsername: string;
	actorUsername?: string;
	impersonating: boolean;
	time: string;
};
export async function adminImpersonateStart(
	body: AdminImpersonateStartRequest,
): Promise<AdminImpersonateStartResponse> {
	return apiFetch<AdminImpersonateStartResponse>(
		"/api/admin/impersonate/start",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export type AdminImpersonateStopResponse = {
	status: string;
	effectiveUsername: string;
	actorUsername?: string;
	impersonating: boolean;
	time: string;
};
export async function adminImpersonateStop(): Promise<AdminImpersonateStopResponse> {
	return apiFetch<AdminImpersonateStopResponse>("/api/admin/impersonate/stop", {
		method: "POST",
		body: "{}",
	});
}
