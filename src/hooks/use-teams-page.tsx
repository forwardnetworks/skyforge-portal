import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	getUserTeamsConfig,
	listUserForwardCollectorConfigs,
	listUserScopeForwardNetworks,
	listUserScopes,
	putUserTeamsConfig,
	testUserTeamsOutgoing,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export function useTeamsPage() {
	const qc = useQueryClient();
	const cfgKey = queryKeys.userTeamsConfig();
	const collectorsKey = queryKeys.userForwardCollectorConfigs();

	const cfgQ = useQuery({
		queryKey: cfgKey,
		queryFn: getUserTeamsConfig,
		retry: false,
	});
	const collectorsQ = useQuery({
		queryKey: collectorsKey,
		queryFn: listUserForwardCollectorConfigs,
		retry: false,
		staleTime: 30_000,
	});
	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		retry: false,
		staleTime: 30_000,
	});

	const collectorOptions = useMemo(
		() => collectorsQ.data?.collectors ?? [],
		[collectorsQ.data],
	);
	const selectedUserScopeId = useMemo(
		() => String(userScopesQ.data?.[0]?.id ?? ""),
		[userScopesQ.data],
	);
	const networksQ = useQuery({
		queryKey: queryKeys.userForwardNetworks(selectedUserScopeId),
		queryFn: () => listUserScopeForwardNetworks(selectedUserScopeId),
		enabled: Boolean(selectedUserScopeId),
		retry: false,
		staleTime: 30_000,
	});
	const networkOptions = useMemo(
		() => networksQ.data?.networks ?? [],
		[networksQ.data],
	);

	const [enabled, setEnabled] = useState(false);
	const [teamsUserRef, setTeamsUserRef] = useState("");
	const [outboundWebhookURL, setOutboundWebhookURL] = useState("");
	const [forwardCredentialSetId, setForwardCredentialSetId] = useState("");
	const [defaultNetworkId, setDefaultNetworkId] = useState("");

	useEffect(() => {
		if (!cfgQ.data) return;
		setEnabled(Boolean(cfgQ.data.enabled));
		setTeamsUserRef(String(cfgQ.data.teamsUserRef ?? ""));
		setForwardCredentialSetId(String(cfgQ.data.forwardCredentialSetId ?? ""));
		setDefaultNetworkId(String(cfgQ.data.defaultNetworkId ?? ""));
	}, [cfgQ.data]);

	useEffect(() => {
		if (forwardCredentialSetId) return;
		const preferred =
			collectorOptions.find((collector) => collector.isDefault) ??
			collectorOptions[0];
		if (preferred?.id) setForwardCredentialSetId(preferred.id);
	}, [collectorOptions, forwardCredentialSetId]);

	const saveMutation = useMutation({
		mutationFn: async () =>
			putUserTeamsConfig({
				enabled,
				teamsUserRef: teamsUserRef.trim(),
				outboundWebhookUrl: outboundWebhookURL.trim(),
				forwardCredentialSetId: forwardCredentialSetId.trim(),
				defaultNetworkId: defaultNetworkId.trim(),
			}),
		onSuccess: async () => {
			toast.success("Saved Teams bridge settings");
			await qc.invalidateQueries({ queryKey: cfgKey });
		},
		onError: (e) =>
			toast.error("Failed to save Teams settings", {
				description: (e as Error).message,
			}),
	});

	const testMutation = useMutation({
		mutationFn: async () => testUserTeamsOutgoing(),
		onSuccess: (resp) => {
			if (resp.sent) {
				toast.success("Teams test message sent");
			} else {
				toast.error("Teams test message failed", {
					description: resp.message,
				});
			}
		},
		onError: (e) =>
			toast.error("Failed to send Teams test message", {
				description: (e as Error).message,
			}),
	});

	return {
		cfgQ,
		collectorOptions,
		networkOptions,
		selectedUserScopeId,
		networksQ,
		enabled,
		setEnabled,
		teamsUserRef,
		setTeamsUserRef,
		outboundWebhookURL,
		setOutboundWebhookURL,
		forwardCredentialSetId,
		setForwardCredentialSetId,
		defaultNetworkId,
		setDefaultNetworkId,
		saveMutation,
		testMutation,
	};
}

export type TeamsPageData = ReturnType<typeof useTeamsPage>;
