import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	deleteUserContainerlabServer,
	deleteUserEveServer,
	deleteUserNetlabServer,
	listUserContainerlabServers,
	listUserEveServers,
	listUserNetlabServers,
	upsertUserContainerlabServer,
	upsertUserEveServer,
	upsertUserNetlabServer,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

function nameFromURL(value: string) {
	try {
		return new URL(value).hostname || value;
	} catch {
		return value;
	}
}

export function useUserSettingsByolServers() {
	const queryClient = useQueryClient();
	const userNetlabServersQ = useQuery({
		queryKey: queryKeys.userNetlabServers(),
		queryFn: listUserNetlabServers,
		staleTime: 10_000,
		retry: false,
	});
	const userEveServersQ = useQuery({
		queryKey: queryKeys.userEveServers(),
		queryFn: listUserEveServers,
		staleTime: 10_000,
		retry: false,
	});
	const userContainerlabServersQ = useQuery({
		queryKey: queryKeys.userContainerlabServers(),
		queryFn: listUserContainerlabServers,
		staleTime: 10_000,
		retry: false,
	});

	const [newNetlabUrl, setNewNetlabUrl] = useState("");
	const [newNetlabInsecure, setNewNetlabInsecure] = useState(true);
	const [newNetlabUser, setNewNetlabUser] = useState("");
	const [newNetlabPassword, setNewNetlabPassword] = useState("");
	const [newContainerlabUrl, setNewContainerlabUrl] = useState("");
	const [newContainerlabInsecure, setNewContainerlabInsecure] = useState(true);
	const [newContainerlabUser, setNewContainerlabUser] = useState("");
	const [newContainerlabPassword, setNewContainerlabPassword] = useState("");
	const [newEveApiUrl, setNewEveApiUrl] = useState("");
	const [newEveWebUrl, setNewEveWebUrl] = useState("");
	const [newEveSkipTlsVerify, setNewEveSkipTlsVerify] = useState(true);
	const [newEveApiUser, setNewEveApiUser] = useState("");
	const [newEveApiPassword, setNewEveApiPassword] = useState("");

	const saveNetlabServerM = useMutation({
		mutationFn: async () =>
			upsertUserNetlabServer({
				name: nameFromURL(newNetlabUrl).trim(),
				apiUrl: newNetlabUrl.trim(),
				apiInsecure: newNetlabInsecure,
				apiUser: newNetlabUser.trim() || undefined,
				apiPassword: newNetlabPassword.trim() || undefined,
			}),
		onSuccess: async () => {
			setNewNetlabUrl("");
			setNewNetlabInsecure(true);
			setNewNetlabUser("");
			setNewNetlabPassword("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userNetlabServers(),
			});
			toast.success("Netlab server saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save Netlab server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteNetlabServerM = useMutation({
		mutationFn: async (id: string) => deleteUserNetlabServer(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userNetlabServers(),
			});
			toast.success("Netlab server deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete Netlab server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveContainerlabServerM = useMutation({
		mutationFn: async () =>
			upsertUserContainerlabServer({
				name: nameFromURL(newContainerlabUrl).trim(),
				apiUrl: newContainerlabUrl.trim(),
				apiInsecure: newContainerlabInsecure,
				apiUser: newContainerlabUser.trim() || undefined,
				apiPassword: newContainerlabPassword.trim() || undefined,
			}),
		onSuccess: async () => {
			setNewContainerlabUrl("");
			setNewContainerlabInsecure(true);
			setNewContainerlabUser("");
			setNewContainerlabPassword("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userContainerlabServers(),
			});
			toast.success("Containerlab server saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save Containerlab server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteContainerlabServerM = useMutation({
		mutationFn: async (id: string) => deleteUserContainerlabServer(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userContainerlabServers(),
			});
			toast.success("Containerlab server deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete Containerlab server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveEveServerM = useMutation({
		mutationFn: async () =>
			upsertUserEveServer({
				name: nameFromURL(newEveApiUrl).trim(),
				apiUrl: newEveApiUrl.trim(),
				webUrl: newEveWebUrl.trim() || undefined,
				skipTlsVerify: newEveSkipTlsVerify,
				apiUser: newEveApiUser.trim() || undefined,
				apiPassword: newEveApiPassword.trim() || undefined,
			}),
		onSuccess: async () => {
			setNewEveApiUrl("");
			setNewEveWebUrl("");
			setNewEveSkipTlsVerify(true);
			setNewEveApiUser("");
			setNewEveApiPassword("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userEveServers(),
			});
			toast.success("EVE-NG server saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save EVE-NG server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteEveServerM = useMutation({
		mutationFn: async (id: string) => deleteUserEveServer(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userEveServers(),
			});
			toast.success("EVE-NG server deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete EVE-NG server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	return {
		userNetlabServersQ,
		userEveServersQ,
		userContainerlabServersQ,
		newNetlabUrl,
		setNewNetlabUrl,
		newNetlabInsecure,
		setNewNetlabInsecure,
		newNetlabUser,
		setNewNetlabUser,
		newNetlabPassword,
		setNewNetlabPassword,
		newContainerlabUrl,
		setNewContainerlabUrl,
		newContainerlabInsecure,
		setNewContainerlabInsecure,
		newContainerlabUser,
		setNewContainerlabUser,
		newContainerlabPassword,
		setNewContainerlabPassword,
		newEveApiUrl,
		setNewEveApiUrl,
		newEveWebUrl,
		setNewEveWebUrl,
		newEveSkipTlsVerify,
		setNewEveSkipTlsVerify,
		newEveApiUser,
		setNewEveApiUser,
		newEveApiPassword,
		setNewEveApiPassword,
		saveNetlabServerM,
		deleteNetlabServerM,
		saveContainerlabServerM,
		deleteContainerlabServerM,
		saveEveServerM,
		deleteEveServerM,
	};
}
