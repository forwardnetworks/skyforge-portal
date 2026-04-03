import { apiFetch } from "./http";

export type AdminAuditFacetCount = {
	value: string;
	count: number;
};

export type AdminAuditSummary = {
	total: number;
	categoryCounts: AdminAuditFacetCount[];
	outcomeCounts: AdminAuditFacetCount[];
	topEventTypes: AdminAuditFacetCount[];
	topActors: AdminAuditFacetCount[];
};

export type AdminAuditEvent = {
	id: number;
	createdAt: string;
	actorUsername: string;
	actorType: string;
	actorIsAdmin: boolean;
	impersonatedUsername?: string;
	eventType: string;
	eventCategory: string;
	severity: string;
	outcome: string;
	targetType?: string;
	targetId?: string;
	targetDisplay?: string;
	correlationId?: string;
	sourceIp?: string;
	userAgent?: string;
	authMethod?: string;
	message: string;
	detailsJson: unknown;
	chainVersion: number;
	prevChainHash?: string;
	chainHash?: string;
};

export type AdminAuditIntegrityStatus = {
	chainVersion: number;
	totalChecked: number;
	verified: boolean;
	headEventId?: number;
	headChainHash?: string;
	firstBrokenId?: number;
	firstBrokenError?: string;
};

export type AdminAuditIntegrityResponse = {
	status: AdminAuditIntegrityStatus;
	timestamp: string;
};

export type AdminAuditExportSignatureRecord = {
	id: string;
	actorUsername: string;
	exportFormat: string;
	filterJson: AdminAuditQuery;
	eventCount: number;
	bodySha256: string;
	signatureAlgorithm: string;
	signatureB64: string;
	keyId: string;
	publicKeyB64: string;
	createdAt: string;
};

export type AdminAuditExportSignaturesResponse = {
	signatures: AdminAuditExportSignatureRecord[];
	timestamp: string;
};

export type VerifyAdminAuditExportSignatureRequest = {
	bodyBase64: string;
};

export type VerifyAdminAuditExportSignatureResponse = {
	signatureId: string;
	verified: boolean;
	reason?: string;
	timestamp: string;
};

export type AdminAuditResponse = {
	events: AdminAuditEvent[];
	limit: number;
	nextCursor?: string;
	timestamp: string;
	summary: AdminAuditSummary;
};

export type AdminAuditDetailResponse = {
	event: AdminAuditEvent;
	timestamp: string;
};

export type AdminAuditSavedView = {
	id: string;
	name: string;
	filters: AdminAuditQuery;
	createdAt: string;
	updatedAt: string;
};

export type AdminAuditSavedViewsResponse = {
	views: AdminAuditSavedView[];
	timestamp: string;
};

export type AdminAuditQuery = {
	limit?: string;
	cursor?: string;
	actor?: string;
	actorType?: string;
	impersonated?: string;
	eventType?: string;
	category?: string;
	outcome?: string;
	severity?: string;
	targetType?: string;
	target?: string;
	authMethod?: string;
	sourceIp?: string;
	q?: string;
	since?: string;
	until?: string;
};

function buildAdminAuditQueryString(params?: AdminAuditQuery) {
	const qs = new URLSearchParams();
	if (params?.limit) qs.set("limit", params.limit);
	if (params?.cursor) qs.set("cursor", params.cursor);
	if (params?.actor) qs.set("actor", params.actor);
	if (params?.actorType) qs.set("actorType", params.actorType);
	if (params?.impersonated) qs.set("impersonated", params.impersonated);
	if (params?.eventType) qs.set("eventType", params.eventType);
	if (params?.category) qs.set("category", params.category);
	if (params?.outcome) qs.set("outcome", params.outcome);
	if (params?.severity) qs.set("severity", params.severity);
	if (params?.targetType) qs.set("targetType", params.targetType);
	if (params?.target) qs.set("target", params.target);
	if (params?.authMethod) qs.set("authMethod", params.authMethod);
	if (params?.sourceIp) qs.set("sourceIp", params.sourceIp);
	if (params?.q) qs.set("q", params.q);
	if (params?.since) qs.set("since", params.since);
	if (params?.until) qs.set("until", params.until);
	const suffix = qs.toString();
	return suffix ? `?${suffix}` : "";
}

export async function getAdminAudit(params?: AdminAuditQuery): Promise<AdminAuditResponse> {
	return apiFetch<AdminAuditResponse>(
		`/api/admin/audit${buildAdminAuditQueryString(params)}`,
	);
}

export async function getAdminAuditEvent(
	eventID: number,
): Promise<AdminAuditDetailResponse> {
	return apiFetch<AdminAuditDetailResponse>(`/api/admin/audit/events/${eventID}`);
}

export async function getAdminAuditIntegrity(): Promise<AdminAuditIntegrityResponse> {
	return apiFetch<AdminAuditIntegrityResponse>("/api/admin/audit/integrity");
}

export async function getAdminAuditExportSignatures(): Promise<AdminAuditExportSignaturesResponse> {
	return apiFetch<AdminAuditExportSignaturesResponse>(
		"/api/admin/audit/export-signatures",
	);
}

export async function verifyAdminAuditExportSignature(
	signatureID: string,
	body: VerifyAdminAuditExportSignatureRequest,
): Promise<VerifyAdminAuditExportSignatureResponse> {
	return apiFetch<VerifyAdminAuditExportSignatureResponse>(
		`/api/admin/audit/export-signatures/${encodeURIComponent(signatureID)}/verify`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function getAdminAuditSavedViews(): Promise<AdminAuditSavedViewsResponse> {
	return apiFetch<AdminAuditSavedViewsResponse>("/api/admin/audit/saved-views");
}

export async function upsertAdminAuditSavedView(body: {
	name: string;
	filters: AdminAuditQuery;
}): Promise<{ view: AdminAuditSavedView; timestamp: string }> {
	return apiFetch<{ view: AdminAuditSavedView; timestamp: string }>(
		"/api/admin/audit/saved-views",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function deleteAdminAuditSavedView(
	viewID: string,
): Promise<{ deletedId: string; timestamp: string }> {
	return apiFetch<{ deletedId: string; timestamp: string }>(
		`/api/admin/audit/saved-views/${encodeURIComponent(viewID)}`,
		{
			method: "DELETE",
		},
	);
}

export function buildAdminAuditExportURL(
	format: "csv" | "jsonl",
	params?: AdminAuditQuery,
): string {
	const qs = new URLSearchParams(buildAdminAuditQueryString(params).slice(1));
	qs.set("format", format);
	return `/api/admin/audit/export?${qs.toString()}`;
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
