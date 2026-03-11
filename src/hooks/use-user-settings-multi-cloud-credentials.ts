import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	deleteUserAzureCredentials,
	deleteUserGCPCredentials,
	deleteUserIBMCredentials,
	getUserAzureCredentials,
	getUserGCPCredentials,
	getUserIBMCredentials,
	putUserAzureCredentials,
	putUserGCPCredentials,
	putUserIBMCredentials,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export function useUserSettingsMultiCloudCredentials() {
	const queryClient = useQueryClient();

	const azureQ = useQuery({
		queryKey: queryKeys.userAzureCredentials(),
		queryFn: getUserAzureCredentials,
		staleTime: 10_000,
		retry: false,
	});
	const gcpQ = useQuery({
		queryKey: queryKeys.userGcpCredentials(),
		queryFn: getUserGCPCredentials,
		staleTime: 10_000,
		retry: false,
	});
	const ibmQ = useQuery({
		queryKey: queryKeys.userIbmCredentials(),
		queryFn: getUserIBMCredentials,
		staleTime: 10_000,
		retry: false,
	});

	const [azureTenantId, setAzureTenantId] = useState("");
	const [azureClientId, setAzureClientId] = useState("");
	const [azureClientSecret, setAzureClientSecret] = useState("");
	const [azureSubscriptionId, setAzureSubscriptionId] = useState("");
	const [gcpProjectId, setGcpProjectId] = useState("");
	const [gcpServiceAccountJson, setGcpServiceAccountJson] = useState("");
	const [ibmApiKey, setIbmApiKey] = useState("");
	const [ibmRegion, setIbmRegion] = useState("");
	const [ibmResourceGroupId, setIbmResourceGroupId] = useState("");

	const saveAzureM = useMutation({
		mutationFn: async () =>
			putUserAzureCredentials({
				tenantId: azureTenantId.trim(),
				clientId: azureClientId.trim(),
				clientSecret: azureClientSecret,
				subscriptionId: azureSubscriptionId.trim() || undefined,
			}),
		onSuccess: async () => {
			setAzureClientSecret("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userAzureCredentials(),
			});
			toast.success("Azure credentials saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save Azure credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteAzureM = useMutation({
		mutationFn: async () => deleteUserAzureCredentials(),
		onSuccess: async () => {
			setAzureTenantId("");
			setAzureClientId("");
			setAzureClientSecret("");
			setAzureSubscriptionId("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userAzureCredentials(),
			});
			toast.success("Azure credentials deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete Azure credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveGcpM = useMutation({
		mutationFn: async () =>
			putUserGCPCredentials({
				projectId: gcpProjectId.trim(),
				serviceAccountJSON: gcpServiceAccountJson,
			}),
		onSuccess: async () => {
			setGcpServiceAccountJson("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userGcpCredentials(),
			});
			toast.success("GCP credentials saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save GCP credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteGcpM = useMutation({
		mutationFn: async () => deleteUserGCPCredentials(),
		onSuccess: async () => {
			setGcpProjectId("");
			setGcpServiceAccountJson("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userGcpCredentials(),
			});
			toast.success("GCP credentials deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete GCP credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveIbmM = useMutation({
		mutationFn: async () =>
			putUserIBMCredentials({
				apiKey: ibmApiKey,
				region: ibmRegion.trim(),
				resourceGroupId: ibmResourceGroupId.trim() || undefined,
			}),
		onSuccess: async () => {
			setIbmApiKey("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userIbmCredentials(),
			});
			toast.success("IBM Cloud credentials saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save IBM Cloud credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteIbmM = useMutation({
		mutationFn: async () => deleteUserIBMCredentials(),
		onSuccess: async () => {
			setIbmApiKey("");
			setIbmRegion("");
			setIbmResourceGroupId("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userIbmCredentials(),
			});
			toast.success("IBM Cloud credentials deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete IBM Cloud credentials", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	return {
		azureQ,
		gcpQ,
		ibmQ,
		azureTenantId,
		setAzureTenantId,
		azureClientId,
		setAzureClientId,
		azureClientSecret,
		setAzureClientSecret,
		azureSubscriptionId,
		setAzureSubscriptionId,
		gcpProjectId,
		setGcpProjectId,
		gcpServiceAccountJson,
		setGcpServiceAccountJson,
		ibmApiKey,
		setIbmApiKey,
		ibmRegion,
		setIbmRegion,
		ibmResourceGroupId,
		setIbmResourceGroupId,
		saveAzureM,
		deleteAzureM,
		saveGcpM,
		deleteGcpM,
		saveIbmM,
		deleteIbmM,
	};
}
