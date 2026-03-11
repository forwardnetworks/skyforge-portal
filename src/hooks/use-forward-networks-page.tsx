import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
	PolicyReportForwardNetwork,
	SkyforgeUserScope,
} from "../lib/api-client";
import {
	createUserScopeForwardNetwork,
	deleteUserScopeForwardNetwork,
	getUserScopeForwardNetworkCapacityPortfolio,
	listUserForwardCollectorConfigs,
	listUserScopeForwardNetworks,
	listUserScopes,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export function useForwardNetworksPage({ userId }: { userId?: string }) {
	const navigate = useNavigate();
	const qc = useQueryClient();

	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
		retry: false,
	});
	const userScopes = useMemo(
		() => (userScopesQ.data ?? []) as SkyforgeUserScope[],
		[userScopesQ.data],
	);

	const [selectedUserScopeId, setSelectedUserScopeId] = useState(
		String(userId ?? ""),
	);

	useEffect(() => {
		if (selectedUserScopeId) return;
		if (userScopes.length === 0) return;
		setSelectedUserScopeId(String(userScopes[0]?.id ?? ""));
	}, [selectedUserScopeId, userScopes]);

	useEffect(() => {
		const nextUserId = String(userId ?? "");
		if (nextUserId === selectedUserScopeId) return;
		setSelectedUserScopeId(nextUserId);
	}, [userId, selectedUserScopeId]);

	const handleUserScopeChange = (id: string) => {
		void navigate({
			search: { userId: id === "__none__" ? "" : id } as never,
			replace: true,
		});
	};

	const networksQ = useQuery({
		queryKey: queryKeys.userForwardNetworks(selectedUserScopeId),
		queryFn: () => listUserScopeForwardNetworks(selectedUserScopeId),
		enabled: Boolean(selectedUserScopeId),
		staleTime: 10_000,
		retry: false,
	});
	const networks = useMemo(
		() => (networksQ.data?.networks ?? []) as PolicyReportForwardNetwork[],
		[networksQ.data?.networks],
	);

	const portfolioQ = useQuery({
		queryKey:
			queryKeys.userForwardNetworkCapacityPortfolio(selectedUserScopeId),
		queryFn: () =>
			getUserScopeForwardNetworkCapacityPortfolio(selectedUserScopeId),
		enabled: Boolean(selectedUserScopeId),
		staleTime: 10_000,
		retry: false,
	});
	const portfolioItems = useMemo(
		() => (portfolioQ.data?.items ?? []) as Array<Record<string, unknown>>,
		[portfolioQ.data?.items],
	);

	const collectorsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		staleTime: 30_000,
		retry: false,
	});
	const collectors = useMemo(
		() =>
			(collectorsQ.data?.collectors ?? []) as Array<Record<string, unknown>>,
		[collectorsQ.data?.collectors],
	);

	const [name, setName] = useState("");
	const [forwardNetworkId, setForwardNetworkId] = useState("");
	const [description, setDescription] = useState("");
	const [collectorConfigId, setCollectorConfigId] =
		useState<string>("__default__");

	const createM = useMutation({
		mutationFn: async () => {
			const scopeId = selectedUserScopeId.trim();
			if (!scopeId) throw new Error("Select a user scope");
			const trimmedName = name.trim();
			const trimmedForwardNetworkId = forwardNetworkId.trim();
			if (!trimmedName) throw new Error("Name is required");
			if (!trimmedForwardNetworkId) {
				throw new Error("Forward Network ID is required");
			}
			return createUserScopeForwardNetwork(scopeId, {
				name: trimmedName,
				forwardNetworkId: trimmedForwardNetworkId,
				description: description.trim() || undefined,
				collectorConfigId:
					collectorConfigId && collectorConfigId !== "__default__"
						? collectorConfigId
						: undefined,
			});
		},
		onSuccess: async () => {
			toast.success("Forward network saved");
			setName("");
			setForwardNetworkId("");
			setDescription("");
			setCollectorConfigId("__default__");
			await qc.invalidateQueries({
				queryKey: queryKeys.userForwardNetworks(selectedUserScopeId),
			});
		},
		onError: (e) =>
			toast.error("Failed to save network", {
				description: (e as Error).message,
			}),
	});

	const deleteM = useMutation({
		mutationFn: async (networkRef: string) => {
			const scopeId = selectedUserScopeId.trim();
			if (!scopeId) throw new Error("Select a user scope");
			return deleteUserScopeForwardNetwork(scopeId, networkRef);
		},
		onSuccess: async () => {
			toast.success("Forward network deleted");
			await qc.invalidateQueries({
				queryKey: queryKeys.userForwardNetworks(selectedUserScopeId),
			});
		},
		onError: (e) =>
			toast.error("Failed to delete network", {
				description: (e as Error).message,
			}),
	});

	return {
		navigate,
		userScopes,
		selectedUserScopeId,
		handleUserScopeChange,
		networks,
		portfolioQ,
		portfolioItems,
		collectors,
		name,
		setName,
		forwardNetworkId,
		setForwardNetworkId,
		description,
		setDescription,
		collectorConfigId,
		setCollectorConfigId,
		createM,
		deleteM,
	};
}

export type ForwardNetworksPageData = ReturnType<typeof useForwardNetworksPage>;
