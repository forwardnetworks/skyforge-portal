import { type QueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	type AdminServiceNowGlobalConfigResponse,
	pushAdminServiceNowForwardConfig,
	putAdminServiceNowGlobalConfig,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

type UseAdminSettingsAuthServiceNowArgs = {
	queryClient: QueryClient;
	serviceNowGlobalConfig: AdminServiceNowGlobalConfigResponse | undefined;
	refetchServiceNowGlobalConfig: () => Promise<unknown>;
};

export function useAdminSettingsAuthServiceNow({
	queryClient,
	serviceNowGlobalConfig,
	refetchServiceNowGlobalConfig,
}: UseAdminSettingsAuthServiceNowArgs) {
	const [serviceNowInstanceURLDraft, setServiceNowInstanceURLDraft] =
		useState("");
	const [serviceNowAdminUsernameDraft, setServiceNowAdminUsernameDraft] =
		useState("");
	const [serviceNowAdminPasswordDraft, setServiceNowAdminPasswordDraft] =
		useState("");
	const [
		serviceNowBootstrapCredentialSetDraft,
		setServiceNowBootstrapCredentialSetDraft,
	] = useState("");

	useEffect(() => {
		if (!serviceNowGlobalConfig) return;
		setServiceNowInstanceURLDraft(
			String(serviceNowGlobalConfig.instanceUrl ?? ""),
		);
		setServiceNowAdminUsernameDraft(
			String(serviceNowGlobalConfig.adminUsername ?? ""),
		);
		setServiceNowAdminPasswordDraft("");
		setServiceNowBootstrapCredentialSetDraft(
			String(serviceNowGlobalConfig.bootstrapCredentialSet ?? ""),
		);
	}, [
		serviceNowGlobalConfig?.instanceUrl,
		serviceNowGlobalConfig?.adminUsername,
		serviceNowGlobalConfig?.bootstrapCredentialSet,
	]);

	const saveServiceNowGlobalConfig = useMutation({
		mutationFn: async () => {
			const instanceUrl = serviceNowInstanceURLDraft.trim();
			const adminUsername = serviceNowAdminUsernameDraft.trim();
			const adminPassword = serviceNowAdminPasswordDraft.trim();
			const bootstrapCredentialSet =
				serviceNowBootstrapCredentialSetDraft.trim();
			if (!instanceUrl) throw new Error("ServiceNow instance URL is required");
			if (!adminUsername)
				throw new Error("ServiceNow admin username is required");
			if (!adminPassword && !serviceNowGlobalConfig?.hasAdminPassword) {
				throw new Error("ServiceNow admin password is required");
			}
			return putAdminServiceNowGlobalConfig({
				instanceUrl,
				adminUsername,
				adminPassword: adminPassword || undefined,
				bootstrapCredentialSet,
			});
		},
		onSuccess: async () => {
			toast.success("Saved ServiceNow global settings");
			setServiceNowAdminPasswordDraft("");
			await Promise.all([
				refetchServiceNowGlobalConfig(),
				queryClient.invalidateQueries({
					queryKey: queryKeys.userServiceNowConfig(),
				}),
			]);
		},
		onError: (e) => {
			toast.error("Failed to save ServiceNow global settings", {
				description: (e as Error).message,
			});
		},
	});

	const pushServiceNowForwardConfig = useMutation({
		mutationFn: async () => pushAdminServiceNowForwardConfig(),
		onSuccess: async (resp) => {
			if (resp.configured) {
				toast.success("Pushed Forward app config into ServiceNow");
			} else {
				toast.error("ServiceNow push did not complete", {
					description: resp.message,
				});
			}
			await refetchServiceNowGlobalConfig();
		},
		onError: (e) => {
			toast.error("Failed to push Forward app config", {
				description: (e as Error).message,
			});
		},
	});

	return {
		serviceNowInstanceURLDraft,
		setServiceNowInstanceURLDraft,
		serviceNowAdminUsernameDraft,
		setServiceNowAdminUsernameDraft,
		serviceNowAdminPasswordDraft,
		setServiceNowAdminPasswordDraft,
		serviceNowBootstrapCredentialSetDraft,
		setServiceNowBootstrapCredentialSetDraft,
		saveServiceNowGlobalConfig,
		pushServiceNowForwardConfig,
	};
}
