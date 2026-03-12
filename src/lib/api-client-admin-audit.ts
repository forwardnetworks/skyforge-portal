import type { operations } from "./openapi.gen";

import { apiFetch } from "./http";

export type AdminAuditResponse =
	operations["GET:authn.GetAdminAudit"]["responses"][200]["content"]["application/json"];
export async function getAdminAudit(params?: {
	limit?: string;
}): Promise<AdminAuditResponse> {
	const qs = new URLSearchParams();
	if (params?.limit) qs.set("limit", params.limit);
	const suffix = qs.toString();
	return apiFetch<AdminAuditResponse>(
		`/api/admin/audit${suffix ? `?${suffix}` : ""}`,
	);
}

export type AdminImpersonateStatusResponse =
	operations["GET:authn.GetAdminImpersonateStatus"]["responses"][200]["content"]["application/json"];
export async function getAdminImpersonateStatus(): Promise<AdminImpersonateStatusResponse> {
	return apiFetch<AdminImpersonateStatusResponse>(
		"/api/admin/impersonate/status",
	);
}

export type AdminImpersonateStartRequest = NonNullable<
	operations["POST:authn.AdminImpersonateStart"]["requestBody"]
>["content"]["application/json"];
export type AdminImpersonateStartResponse =
	operations["POST:authn.AdminImpersonateStart"]["responses"][200]["content"]["application/json"];
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

export type AdminImpersonateStopResponse =
	operations["POST:authn.AdminImpersonateStop"]["responses"][200]["content"]["application/json"];
export async function adminImpersonateStop(): Promise<AdminImpersonateStopResponse> {
	return apiFetch<AdminImpersonateStopResponse>("/api/admin/impersonate/stop", {
		method: "POST",
		body: "{}",
	});
}
