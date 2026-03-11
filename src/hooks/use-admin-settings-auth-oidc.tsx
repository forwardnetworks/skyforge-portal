import { type QueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	type AdminOIDCSettingsResponse,
	putAdminOIDCSettings,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

type UseAdminSettingsAuthOIDCArgs = {
	queryClient: QueryClient;
	oidcSettings: AdminOIDCSettingsResponse | undefined;
	refetchOIDCSettings: () => Promise<unknown>;
	refetchAuthSettings: () => Promise<unknown>;
};

type OIDCValidationInput = {
	enabled: boolean;
	issuerUrl: string;
	discoveryUrl: string;
	clientId: string;
	clientSecret: string;
	redirectUrl: string;
	hasClientSecret: boolean;
};

function validURL(value: string): boolean {
	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

function validateOIDCSettings(input: OIDCValidationInput): string | null {
	if (!input.enabled) {
		return null;
	}
	if (!input.issuerUrl) {
		return "Issuer URL is required when OIDC is enabled";
	}
	if (!validURL(input.issuerUrl)) {
		return "Issuer URL must be a valid http(s) URL";
	}
	if (input.discoveryUrl && !validURL(input.discoveryUrl)) {
		return "Discovery URL must be a valid http(s) URL";
	}
	if (!input.clientId) {
		return "Client ID is required when OIDC is enabled";
	}
	if (!input.redirectUrl) {
		return "Redirect URL is required when OIDC is enabled";
	}
	if (!validURL(input.redirectUrl)) {
		return "Redirect URL must be a valid http(s) URL";
	}
	if (!input.hasClientSecret && !input.clientSecret) {
		return "Client secret is required when OIDC is enabled";
	}
	return null;
}

export function useAdminSettingsAuthOIDC({
	queryClient,
	oidcSettings,
	refetchOIDCSettings,
	refetchAuthSettings,
}: UseAdminSettingsAuthOIDCArgs) {
	const [oidcEnabledDraft, setOidcEnabledDraft] = useState(false);
	const [oidcIssuerDraft, setOidcIssuerDraft] = useState("");
	const [oidcDiscoveryDraft, setOidcDiscoveryDraft] = useState("");
	const [oidcClientIDDraft, setOidcClientIDDraft] = useState("");
	const [oidcClientSecretDraft, setOidcClientSecretDraft] = useState("");
	const [oidcRedirectDraft, setOidcRedirectDraft] = useState("");

	useEffect(() => {
		if (!oidcSettings) return;
		setOidcEnabledDraft(Boolean(oidcSettings.enabled));
		setOidcIssuerDraft(String(oidcSettings.issuerUrl ?? ""));
		setOidcDiscoveryDraft(String(oidcSettings.discoveryUrl ?? ""));
		setOidcClientIDDraft(String(oidcSettings.clientId ?? ""));
		setOidcClientSecretDraft("");
		setOidcRedirectDraft(String(oidcSettings.redirectUrl ?? ""));
	}, [oidcSettings]);

	const saveOIDCSettings = useMutation({
		mutationFn: async () => {
			const payload = {
				enabled: oidcEnabledDraft,
				issuerUrl: oidcIssuerDraft.trim(),
				discoveryUrl: oidcDiscoveryDraft.trim(),
				clientId: oidcClientIDDraft.trim(),
				clientSecret: oidcClientSecretDraft.trim(),
				redirectUrl: oidcRedirectDraft.trim(),
			};
			const validationError = validateOIDCSettings({
				...payload,
				hasClientSecret: Boolean(oidcSettings?.hasClientSecret),
			});
			if (validationError) {
				throw new Error(validationError);
			}
			return putAdminOIDCSettings(payload);
		},
		onSuccess: async (res: AdminOIDCSettingsResponse) => {
			toast.success("OIDC settings updated", {
				description: res.enabled ? "OIDC is enabled" : "OIDC is disabled",
			});
			setOidcClientSecretDraft("");
			await Promise.all([
				refetchOIDCSettings(),
				refetchAuthSettings(),
				queryClient.invalidateQueries({ queryKey: queryKeys.uiConfig() }),
			]);
		},
		onError: (e) => {
			toast.error("Failed to update OIDC settings", {
				description: (e as Error).message,
			});
		},
	});

	return {
		oidcEnabledDraft,
		setOidcEnabledDraft,
		oidcIssuerDraft,
		setOidcIssuerDraft,
		oidcDiscoveryDraft,
		setOidcDiscoveryDraft,
		oidcClientIDDraft,
		setOidcClientIDDraft,
		oidcClientSecretDraft,
		setOidcClientSecretDraft,
		oidcRedirectDraft,
		setOidcRedirectDraft,
		saveOIDCSettings,
	};
}
