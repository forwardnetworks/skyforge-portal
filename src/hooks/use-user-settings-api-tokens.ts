import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	createUserAPIToken,
	listUserAPITokens,
	regenerateUserAPIToken,
	revokeUserAPIToken,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

function formatMaybeDateTime(value?: string) {
	return value ? new Date(value).toLocaleString() : "—";
}

export function useUserSettingsApiTokens() {
	const queryClient = useQueryClient();
	const [apiTokenName, setApiTokenName] = useState("");
	const [revealedApiToken, setRevealedAPIToken] = useState("");
	const [revealedApiTokenID, setRevealedAPITokenID] = useState("");

	const apiTokensQ = useQuery({
		queryKey: queryKeys.userApiTokens(),
		queryFn: listUserAPITokens,
		staleTime: 10_000,
		retry: false,
	});

	const createApiTokenM = useMutation({
		mutationFn: async () =>
			createUserAPIToken({
				name: apiTokenName.trim() || undefined,
			}),
		onSuccess: async (resp) => {
			setApiTokenName("");
			setRevealedAPIToken(resp.token);
			setRevealedAPITokenID(resp.tokenMeta.id);
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userApiTokens(),
			});
			toast.success("API token created");
		},
		onError: (err: unknown) =>
			toast.error("Failed to create API token", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const regenerateApiTokenM = useMutation({
		mutationFn: async (tokenID: string) => regenerateUserAPIToken(tokenID),
		onSuccess: async (resp) => {
			setRevealedAPIToken(resp.token);
			setRevealedAPITokenID(resp.tokenMeta.id);
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userApiTokens(),
			});
			toast.success("API token regenerated");
		},
		onError: (err: unknown) =>
			toast.error("Failed to regenerate API token", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const revokeApiTokenM = useMutation({
		mutationFn: async (tokenID: string) => revokeUserAPIToken(tokenID),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userApiTokens(),
			});
			toast.success("API token revoked");
		},
		onError: (err: unknown) =>
			toast.error("Failed to revoke API token", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const copyRevealedApiToken = async () => {
		if (!revealedApiToken.trim()) return;

		try {
			await navigator.clipboard.writeText(revealedApiToken);
			toast.success("API token copied");
		} catch (err) {
			toast.error("Failed to copy API token", {
				description: err instanceof Error ? err.message : String(err),
			});
		}
	};

	return {
		apiTokensQ,
		apiTokenName,
		setApiTokenName,
		revealedApiToken,
		revealedApiTokenID,
		createApiTokenM,
		regenerateApiTokenM,
		revokeApiTokenM,
		apiTokens: apiTokensQ.data?.tokens ?? [],
		formatMaybeDateTime,
		copyRevealedApiToken,
	};
}
