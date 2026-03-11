import { type QueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	type AdminTeamsGlobalConfigResponse,
	putAdminTeamsGlobalConfig,
	testAdminTeamsOutgoing,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

type UseAdminSettingsAuthTeamsArgs = {
	queryClient: QueryClient;
	teamsGlobalConfig: AdminTeamsGlobalConfigResponse | undefined;
	refetchTeamsGlobalConfig: () => Promise<unknown>;
};

export function useAdminSettingsAuthTeams({
	queryClient,
	teamsGlobalConfig,
	refetchTeamsGlobalConfig,
}: UseAdminSettingsAuthTeamsArgs) {
	const [teamsEnabledDraft, setTeamsEnabledDraft] = useState(false);
	const [teamsDisplayNameDraft, setTeamsDisplayNameDraft] = useState("");
	const [teamsPublicBaseURLDraft, setTeamsPublicBaseURLDraft] = useState("");
	const [teamsInboundSecretDraft, setTeamsInboundSecretDraft] = useState("");
	const [teamsTestWebhookURLDraft, setTeamsTestWebhookURLDraft] = useState("");

	useEffect(() => {
		if (!teamsGlobalConfig) return;
		setTeamsEnabledDraft(Boolean(teamsGlobalConfig.enabled));
		setTeamsDisplayNameDraft(String(teamsGlobalConfig.displayName ?? ""));
		setTeamsPublicBaseURLDraft(String(teamsGlobalConfig.publicBaseUrl ?? ""));
		setTeamsInboundSecretDraft("");
	}, [
		teamsGlobalConfig?.enabled,
		teamsGlobalConfig?.displayName,
		teamsGlobalConfig?.publicBaseUrl,
	]);

	const saveTeamsGlobalConfig = useMutation({
		mutationFn: async () => {
			const publicBaseUrl = teamsPublicBaseURLDraft.trim();
			const inboundSharedSecret = teamsInboundSecretDraft.trim();
			if (!publicBaseUrl) throw new Error("Teams public base URL is required");
			if (!inboundSharedSecret && !teamsGlobalConfig?.hasInboundSharedSecret) {
				throw new Error("Teams inbound shared secret is required");
			}
			return putAdminTeamsGlobalConfig({
				enabled: teamsEnabledDraft,
				displayName: teamsDisplayNameDraft.trim(),
				publicBaseUrl,
				inboundSharedSecret: inboundSharedSecret || undefined,
			});
		},
		onSuccess: async () => {
			toast.success("Saved Teams global settings");
			setTeamsInboundSecretDraft("");
			await Promise.all([
				refetchTeamsGlobalConfig(),
				queryClient.invalidateQueries({
					queryKey: queryKeys.userTeamsConfig(),
				}),
			]);
		},
		onError: (e) => {
			toast.error("Failed to save Teams global settings", {
				description: (e as Error).message,
			});
		},
	});

	const testTeamsOutgoing = useMutation({
		mutationFn: async () => {
			const webhookUrl = teamsTestWebhookURLDraft.trim();
			if (!webhookUrl) throw new Error("Teams test webhook URL is required");
			return testAdminTeamsOutgoing({
				webhookUrl,
				text: "Skyforge Teams admin test",
			});
		},
		onSuccess: (resp) => {
			if (resp.sent) {
				toast.success("Teams test message sent");
			} else {
				toast.error("Teams test message failed", {
					description: resp.message,
				});
			}
		},
		onError: (e) => {
			toast.error("Failed to send Teams test message", {
				description: (e as Error).message,
			});
		},
	});

	return {
		teamsEnabledDraft,
		setTeamsEnabledDraft,
		teamsDisplayNameDraft,
		setTeamsDisplayNameDraft,
		teamsPublicBaseURLDraft,
		setTeamsPublicBaseURLDraft,
		teamsInboundSecretDraft,
		setTeamsInboundSecretDraft,
		teamsTestWebhookURLDraft,
		setTeamsTestWebhookURLDraft,
		saveTeamsGlobalConfig,
		testTeamsOutgoing,
	};
}
