import { apiFetch } from "./http";
import type { operations } from "./openapi.gen";
import { setRuntimeAuthMode, setRuntimeAuthProvider } from "./skyforge-config";

export type AdminEffectiveConfigResponse =
	operations["GET:skyforge.GetAdminEffectiveConfig"]["responses"][200]["content"]["application/json"];
export async function getAdminEffectiveConfig(): Promise<AdminEffectiveConfigResponse> {
	return apiFetch<AdminEffectiveConfigResponse>("/api/admin/config");
}

export type AdminAuthProviderStatus = {
	id: string;
	label: string;
	implemented: boolean;
	selectable: boolean;
	configured: boolean;
	healthy: boolean;
};

export type AdminAuthSettingsResponse = {
	primaryProvider: "local" | "okta" | string;
	configuredProvider: "local" | "okta" | string;
	breakGlassEnabled: boolean;
	breakGlassLabel: string;
	providers: AdminAuthProviderStatus[];
	mode: "local" | "oidc" | string;
	configured: "local" | "oidc" | string;
	oidcAvailable: boolean;
};

export type PutAdminAuthSettingsRequest = {
	primaryProvider: "local" | "okta";
	breakGlassEnabled?: boolean;
	breakGlassLabel?: string;
};

export async function getAdminAuthSettings(): Promise<AdminAuthSettingsResponse> {
	return apiFetch<AdminAuthSettingsResponse>("/api/admin/auth/settings");
}

export async function putAdminAuthSettings(
	body: PutAdminAuthSettingsRequest,
): Promise<AdminAuthSettingsResponse> {
	return apiFetch<AdminAuthSettingsResponse>("/api/admin/auth/settings", {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export type AdminOIDCSettingsResponse = {
	enabled: boolean;
	issuerUrl: string;
	discoveryUrl?: string;
	clientId: string;
	redirectUrl: string;
	hasClientSecret: boolean;
};

export type PutAdminOIDCSettingsRequest = {
	enabled: boolean;
	issuerUrl: string;
	discoveryUrl?: string;
	clientId: string;
	clientSecret?: string;
	redirectUrl: string;
};

export async function getAdminOIDCSettings(): Promise<AdminOIDCSettingsResponse> {
	return apiFetch<AdminOIDCSettingsResponse>("/api/admin/auth/oidc-settings");
}

export async function putAdminOIDCSettings(
	body: PutAdminOIDCSettingsRequest,
): Promise<AdminOIDCSettingsResponse> {
	return apiFetch<AdminOIDCSettingsResponse>("/api/admin/auth/oidc-settings", {
		method: "PUT",
		body: JSON.stringify(body),
	});
}

export type UIConfigResponse =
	operations["GET:authn.GetUIConfig"]["responses"][200]["content"]["application/json"] & {
		authMode?: "oidc" | "local" | string;
		auth?: {
			primaryProvider?: "local" | "okta" | string;
			breakGlassEnabled?: boolean;
			breakGlassLabel?: string;
		};
		netboxBaseUrl?: string;
		nautobotBaseUrl?: string;
		jiraBaseUrl?: string;
		infobloxBaseUrl?: string;
		rapid7BaseUrl?: string;
		elkBaseUrl?: string;
		features?: operations["GET:authn.GetUIConfig"]["responses"][200]["content"]["application/json"]["features"] & {
			jiraEnabled?: boolean;
			infobloxEnabled?: boolean;
			rapid7Enabled?: boolean;
			elkEnabled?: boolean;
			forwardGrafanaEnabled?: boolean;
			forwardPrometheusEnabled?: boolean;
		};
	};
export async function getUIConfig(): Promise<UIConfigResponse> {
	const config = await apiFetch<UIConfigResponse>("/api/ui/config");
	setRuntimeAuthProvider(config.auth?.primaryProvider);
	setRuntimeAuthMode(config.authMode);
	return config;
}

export type StatusSummaryResponse =
	operations["GET:skyforge.StatusSummary"]["responses"][200]["content"]["application/json"] & {
		deploymentsTotal?: number;
		deploymentsActive?: number;
	};
export async function getStatusSummary(): Promise<StatusSummaryResponse> {
	return apiFetch<StatusSummaryResponse>("/status/summary");
}
