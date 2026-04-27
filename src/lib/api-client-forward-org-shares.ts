import { apiFetch } from "./http";

export type ForwardOrgShareTenantKind = "primary" | "customer";

export type ForwardOrgShare = {
	ownerUsername: string;
	tenantKind: ForwardOrgShareTenantKind;
	tenantScope?: string;
	granteeUsername: string;
	access: string;
	createdBy?: string;
	createdAt?: string;
	updatedAt?: string;
};

export type ForwardOrgSharesResponse = {
	shares: ForwardOrgShare[];
	sharedWithMe: ForwardOrgShare[];
};

export type PutForwardOrgShareRequest = {
	tenantKind: ForwardOrgShareTenantKind;
	username: string;
	access?: string;
};

export async function listForwardOrgShares(): Promise<ForwardOrgSharesResponse> {
	return apiFetch<ForwardOrgSharesResponse>("/api/forward/org-shares");
}

export async function putForwardOrgShare(
	body: PutForwardOrgShareRequest,
): Promise<ForwardOrgShare> {
	return apiFetch<ForwardOrgShare>("/api/forward/org-shares", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function deleteForwardOrgShare(
	tenantKind: ForwardOrgShareTenantKind,
	username: string,
): Promise<ForwardOrgSharesResponse> {
	return apiFetch<ForwardOrgSharesResponse>(
		`/api/forward/org-shares/${encodeURIComponent(tenantKind)}/${encodeURIComponent(username)}`,
		{ method: "DELETE" },
	);
}
