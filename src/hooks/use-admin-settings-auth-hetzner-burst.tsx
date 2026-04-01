import { type QueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	type AdminHetznerBurstRuntimePolicyResponse,
	putAdminHetznerBurstRuntimePolicy,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

type UseAdminSettingsAuthHetznerBurstArgs = {
	queryClient: QueryClient;
	runtimePolicy: AdminHetznerBurstRuntimePolicyResponse | undefined;
	refetchRuntimePolicy: () => Promise<unknown>;
	refetchStatus: () => Promise<unknown>;
};

export function useAdminSettingsAuthHetznerBurst({
	queryClient,
	runtimePolicy,
	refetchRuntimePolicy,
	refetchStatus,
}: UseAdminSettingsAuthHetznerBurstArgs) {
	const [hetznerBurstEnabledDraft, setHetznerBurstEnabledDraft] =
		useState(false);
	const [hetznerBurstProvisioningEnabledDraft, setHetznerBurstProvisioningEnabledDraft] =
		useState(false);

	useEffect(() => {
		if (!runtimePolicy) return;
		setHetznerBurstEnabledDraft(Boolean(runtimePolicy.enabled));
		setHetznerBurstProvisioningEnabledDraft(
			Boolean(runtimePolicy.provisioningEnabled),
		);
	}, [runtimePolicy?.enabled, runtimePolicy?.provisioningEnabled]);

	const saveHetznerBurstRuntimePolicy = useMutation({
		mutationFn: async () => {
			if (
				hetznerBurstProvisioningEnabledDraft &&
				!hetznerBurstEnabledDraft
			) {
				throw new Error(
					"Enable Hetzner burst scaffold before enabling provisioning",
				);
			}
			return putAdminHetznerBurstRuntimePolicy({
				enabled: hetznerBurstEnabledDraft,
				provisioningEnabled: hetznerBurstProvisioningEnabledDraft,
			});
		},
		onSuccess: async () => {
			toast.success("Saved Hetzner burst runtime settings");
			await Promise.all([
				refetchRuntimePolicy(),
				refetchStatus(),
				queryClient.invalidateQueries({
					queryKey: queryKeys.adminHetznerBurstRuntimePolicy(),
				}),
				queryClient.invalidateQueries({
					queryKey: queryKeys.adminHetznerBurstStatus(),
				}),
			]);
		},
		onError: (e) => {
			toast.error("Failed to save Hetzner burst runtime settings", {
				description: (e as Error).message,
			});
		},
	});

	return {
		hetznerBurstEnabledDraft,
		setHetznerBurstEnabledDraft,
		hetznerBurstProvisioningEnabledDraft,
		setHetznerBurstProvisioningEnabledDraft,
		saveHetznerBurstRuntimePolicy,
	};
}
