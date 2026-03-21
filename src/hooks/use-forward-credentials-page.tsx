import {
	createUserForwardCollectorConfig,
	getCurrentUserForwardTenantFeatures,
	deleteUserForwardCollectorConfig,
	getCurrentUserForwardTenantCredential,
	listCurrentUserForwardTenantRebuildRuns,
	listUserForwardCollectorConfigs,
	putCurrentUserForwardTenantFeatures,
	revealCurrentUserForwardTenantCredentialPassword,
	requestCurrentUserForwardTenantRebuild,
	resetCurrentUserForwardTenantCredential,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ForwardCredentialTarget = "in_cluster_org" | "custom_onprem";

const FORWARD_IN_CLUSTER_ORG =
	"https://fwd-appserver.forward.svc.cluster.local";

function normalizeBaseURL(
	target: ForwardCredentialTarget,
	customHost: string,
): string {
	if (target === "in_cluster_org") return FORWARD_IN_CLUSTER_ORG;
	const raw = customHost.trim();
	if (!raw) return "";
	if (/^https?:\/\//i.test(raw)) return raw;
	return `https://${raw}`;
}

export function stripForwardCredentialProtocol(value: string): string {
	return value.replace(/^https?:\/\//i, "");
}

export function isInClusterCollectorBaseURL(value: string): boolean {
	return (
		stripForwardCredentialProtocol(value).replace(/\/+$/, "").toLowerCase() ===
		stripForwardCredentialProtocol(FORWARD_IN_CLUSTER_ORG).toLowerCase()
	);
}

export function useForwardCredentialsPage() {
	const queryClient = useQueryClient();
	const collectorsKey = queryKeys.userForwardCollectorConfigs();
	const tenantCredentialKey = ["forward", "org-credential"] as const;
	const tenantFeaturesKey = ["forward", "org-features"] as const;
	const tenantResetRunsKey = queryKeys.userForwardTenantRebuildRuns();

	const collectorsQ = useQuery({
		queryKey: collectorsKey,
		queryFn: listUserForwardCollectorConfigs,
		staleTime: 10_000,
	});
	const tenantCredentialQ = useQuery({
		queryKey: tenantCredentialKey,
		queryFn: getCurrentUserForwardTenantCredential,
		staleTime: 10_000,
	});
	const tenantResetRunsQ = useQuery({
		queryKey: tenantResetRunsKey,
		queryFn: listCurrentUserForwardTenantRebuildRuns,
		staleTime: 5_000,
	});
	const tenantFeaturesQ = useQuery({
		queryKey: tenantFeaturesKey,
		queryFn: getCurrentUserForwardTenantFeatures,
		staleTime: 10_000,
	});

	const [customHost, setCustomHost] = useState("");
	const [skipTlsVerify, setSkipTlsVerify] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [revealedTenantPassword, setRevealedTenantPassword] = useState("");
	const [confirmHardReset, setConfirmHardReset] = useState(false);
	const tlsCheckboxDisabled = false;
	const effectiveSkipTlsVerify = skipTlsVerify;

	const credentialSets = useMemo(
		() => collectorsQ.data?.collectors ?? [],
		[collectorsQ.data?.collectors],
	);

	const createMutation = useMutation({
		mutationFn: async () => {
			const baseUrl = normalizeBaseURL("custom_onprem", customHost);
			if (!baseUrl) throw new Error("Host is required for custom on-prem");
			if (!username.trim()) throw new Error("Username is required");
			if (!password.trim()) throw new Error("Password is required");
			const hostKey = stripForwardCredentialProtocol(baseUrl).replace(
				/\/+$/,
				"",
			);
			const displayName = `${username.trim()}@${hostKey}`;
			return createUserForwardCollectorConfig({
				name: displayName,
				baseUrl,
				skipTlsVerify: effectiveSkipTlsVerify,
				username: username.trim(),
				password,
				setDefault: false,
			});
		},
		onSuccess: async () => {
			toast.success("Forward credential set saved");
			setPassword("");
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (err) =>
			toast.error("Failed to save credential set", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => deleteUserForwardCollectorConfig(id),
		onSuccess: async () => {
			toast.success("Credential set deleted");
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (err) =>
			toast.error("Failed to delete credential set", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const resetTenantCredentialMutation = useMutation({
		mutationFn: resetCurrentUserForwardTenantCredential,
		onSuccess: async () => {
			toast.success("Forward org credential reset");
			setRevealedTenantPassword("");
			await queryClient.invalidateQueries({ queryKey: tenantCredentialKey });
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (err) =>
			toast.error("Failed to reset Forward org credential", {
				description: err instanceof Error ? err.message : String(err),
		}),
	});

	const revealTenantCredentialMutation = useMutation({
		mutationFn: revealCurrentUserForwardTenantCredentialPassword,
		onSuccess: (resp) => {
			const value = String(resp?.password ?? "").trim();
			if (!value) {
				toast.error("Managed credential password unavailable");
				return;
			}
			setRevealedTenantPassword(value);
			toast.success("Managed credential password revealed");
		},
		onError: (err) =>
			toast.error("Failed to reveal managed credential password", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const requestTenantResetMutation = useMutation({
		mutationFn: async (mode: "soft-reset" | "hard-reset") =>
			requestCurrentUserForwardTenantRebuild({
				mode,
				reason: "",
				metadata: {},
			}),
		onSuccess: async (_run, mode) => {
			toast.success(
				mode === "hard-reset"
					? "Forward org rebuild queued"
					: "Forward org resync queued",
			);
			if (mode === "hard-reset") {
				setConfirmHardReset(false);
			}
			await queryClient.invalidateQueries({ queryKey: tenantResetRunsKey });
			await queryClient.invalidateQueries({ queryKey: tenantCredentialKey });
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (err, mode) =>
			toast.error(
				mode === "hard-reset"
					? "Failed to queue Forward org rebuild"
					: "Failed to queue Forward org resync",
				{
					description: err instanceof Error ? err.message : String(err),
				},
			),
	});

	const saveTenantFeaturesMutation = useMutation({
		mutationFn: putCurrentUserForwardTenantFeatures,
		onSuccess: async () => {
			toast.success("Experimental features saved");
			await queryClient.invalidateQueries({ queryKey: tenantFeaturesKey });
		},
		onError: (err) =>
			toast.error("Failed to save experimental features", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	return {
		collectorsQ,
		tenantCredentialQ,
		tenantResetRunsQ,
		tenantFeaturesQ,
		customHost,
		setCustomHost,
		skipTlsVerify,
		setSkipTlsVerify,
		username,
		setUsername,
		password,
		setPassword,
		revealedTenantPassword,
		setRevealedTenantPassword,
		confirmHardReset,
		setConfirmHardReset,
		tlsCheckboxDisabled,
		effectiveSkipTlsVerify,
		credentialSets,
		createMutation,
		deleteMutation,
		resetTenantCredentialMutation,
		revealTenantCredentialMutation,
		requestTenantResetMutation,
		saveTenantFeaturesMutation,
	};
}
