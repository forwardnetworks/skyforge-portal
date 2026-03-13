import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	deleteUserContainerlabServer,
	deleteUserFixiaServer,
	deleteUserNetlabServer,
	listUserContainerlabServers,
	listUserFixiaServers,
	listUserNetlabServers,
	upsertUserContainerlabServer,
	upsertUserFixiaServer,
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
	const userContainerlabServersQ = useQuery({
		queryKey: queryKeys.userContainerlabServers(),
		queryFn: listUserContainerlabServers,
		staleTime: 10_000,
		retry: false,
	});
	const userFixiaServersQ = useQuery({
		queryKey: queryKeys.userFixiaServers(),
		queryFn: listUserFixiaServers,
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
	const [newFixiaUrl, setNewFixiaUrl] = useState("");
	const [newFixiaInsecure, setNewFixiaInsecure] = useState(true);
	const [newFixiaUser, setNewFixiaUser] = useState("");
	const [newFixiaPassword, setNewFixiaPassword] = useState("");

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

	const saveFixiaServerM = useMutation({
		mutationFn: async () =>
			upsertUserFixiaServer({
				name: nameFromURL(newFixiaUrl).trim(),
				apiUrl: newFixiaUrl.trim(),
				apiInsecure: newFixiaInsecure,
				apiUser: newFixiaUser.trim() || undefined,
				apiPassword: newFixiaPassword.trim() || undefined,
			}),
		onSuccess: async () => {
			setNewFixiaUrl("");
			setNewFixiaInsecure(true);
			setNewFixiaUser("");
			setNewFixiaPassword("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userFixiaServers(),
			});
			toast.success("Fixia server saved");
		},
		onError: (err: unknown) =>
			toast.error("Failed to save Fixia server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteFixiaServerM = useMutation({
		mutationFn: async (id: string) => deleteUserFixiaServer(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userFixiaServers(),
			});
			toast.success("Fixia server deleted");
		},
		onError: (err: unknown) =>
			toast.error("Failed to delete Fixia server", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	return {
		userNetlabServersQ,
		userContainerlabServersQ,
		userFixiaServersQ,
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
		newFixiaUrl,
		setNewFixiaUrl,
		newFixiaInsecure,
		setNewFixiaInsecure,
		newFixiaUser,
		setNewFixiaUser,
		newFixiaPassword,
		setNewFixiaPassword,
		saveNetlabServerM,
		deleteNetlabServerM,
		saveContainerlabServerM,
		deleteContainerlabServerM,
		saveFixiaServerM,
		deleteFixiaServerM,
	};
}
