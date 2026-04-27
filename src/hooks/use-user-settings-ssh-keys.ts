import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	getUserGitCredentials,
	rotateUserGitDeployKey,
	updateUserGitCredentials,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export function useUserSettingsSshKeys() {
	const queryClient = useQueryClient();
	const [authorizedSshPublicKey, setAuthorizedSshPublicKey] = useState("");

	const userGitCredentialsQ = useQuery({
		queryKey: queryKeys.userGitCredentials(),
		queryFn: getUserGitCredentials,
		staleTime: 60_000,
		retry: false,
	});

	useEffect(() => {
		setAuthorizedSshPublicKey(
			userGitCredentialsQ.data?.authorizedSshPublicKey ?? "",
		);
	}, [userGitCredentialsQ.data?.authorizedSshPublicKey]);

	const saveAuthorizedSshKeyM = useMutation({
		mutationFn: async () =>
			updateUserGitCredentials({
				authorizedSshPublicKey: authorizedSshPublicKey.trim(),
			}),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userGitCredentials(),
			});
			toast.success("Saved SSH public key");
		},
		onError: (error) => {
			toast.error("Failed to save SSH public key", {
				description: error instanceof Error ? error.message : String(error),
			});
		},
	});

	const rotateGitDeployKeyM = useMutation({
		mutationFn: rotateUserGitDeployKey,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userGitCredentials(),
			});
			toast.success("Rotated Skyforge deploy key");
		},
		onError: (error) => {
			toast.error("Failed to rotate Skyforge deploy key", {
				description: error instanceof Error ? error.message : String(error),
			});
		},
	});

	const copyGitDeployKey = async () => {
		const value = userGitCredentialsQ.data?.sshPublicKey?.trim();
		if (!value) return;
		await navigator.clipboard.writeText(value);
		toast.success("Copied deploy public key");
	};

	return {
		userGitCredentialsQ,
		authorizedSshPublicKey,
		setAuthorizedSshPublicKey,
		saveAuthorizedSshKeyM,
		rotateGitDeployKeyM,
		copyGitDeployKey,
	};
}
