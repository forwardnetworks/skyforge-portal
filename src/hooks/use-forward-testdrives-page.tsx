import {
	type ForwardTestDriveSummary,
	type ListForwardTestDrivesResponse,
	createForwardTestDrive,
	deleteForwardTestDrive,
	listForwardTestDrives,
	resetForwardTestDriveCredential,
	resetForwardTestDriveTopology,
	revealForwardTestDriveCredential,
} from "@/lib/api-client-forward-collectors";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function useForwardTestDrivesPage() {
	const queryClient = useQueryClient();
	const [customerName, setCustomerName] = useState("");
	const [testDriveID, setTestDriveID] = useState("");
	const [revealedPasswords, setRevealedPasswords] = useState<
		Record<string, string>
	>({});
	const testDrivesQ = useQuery({
		queryKey: queryKeys.userForwardTestDrives(),
		queryFn: listForwardTestDrives,
		staleTime: 10_000,
		refetchInterval: (query) => {
			const items = (query.state.data as ListForwardTestDrivesResponse | undefined)
				?.items;
			if (!items?.length) return false;
			const hasInFlight = items.some((item) => {
				const state = String(item.record.provisioningStatus ?? "").toLowerCase();
				return state === "queued" || state === "running";
			});
			return hasInFlight ? 4_000 : false;
		},
	});

	const createMutation = useMutation({
		mutationFn: async () =>
			createForwardTestDrive({
				customerName: customerName.trim(),
				testDriveId: testDriveID.trim() || undefined,
			}),
		onSuccess: async () => {
			toast.success("TestDrive provisioning queued");
			setCustomerName("");
			setTestDriveID("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardTestDrives(),
			});
		},
		onError: (err) =>
			toast.error("Failed to create TestDrive", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const revealMutation = useMutation({
		mutationFn: async (id: string) => revealForwardTestDriveCredential(id),
		onSuccess: (resp) => {
			const id = resp.record?.testDriveId ?? "";
			const password = String(resp.credential?.password ?? "").trim();
			if (!id || !password) {
				toast.error("Password unavailable");
				return;
			}
			setRevealedPasswords((prev) => ({ ...prev, [id]: password }));
			toast.success("TestDrive password revealed");
		},
		onError: (err) =>
			toast.error("Failed to reveal TestDrive password", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const resetCredentialMutation = useMutation({
		mutationFn: async (id: string) => resetForwardTestDriveCredential(id),
		onSuccess: async (resp) => {
			const id = resp.record?.testDriveId ?? "";
			if (id) {
				setRevealedPasswords((prev) => ({ ...prev, [id]: "" }));
			}
			toast.success("TestDrive credential reset");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardTestDrives(),
			});
		},
		onError: (err) =>
			toast.error("Failed to reset TestDrive credential", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const resetTopologyMutation = useMutation({
		mutationFn: async (id: string) => resetForwardTestDriveTopology(id),
		onSuccess: async () => {
			toast.success("TestDrive topology reset queued");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardTestDrives(),
			});
		},
		onError: (err) =>
			toast.error("Failed to reset TestDrive topology", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => deleteForwardTestDrive(id),
		onSuccess: async (_resp, id) => {
			setRevealedPasswords((prev) => ({ ...prev, [id]: "" }));
			toast.success("TestDrive deleted");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.userForwardTestDrives(),
			});
		},
		onError: (err) =>
			toast.error("Failed to delete TestDrive", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const items = useMemo<ForwardTestDriveSummary[]>(
		() => testDrivesQ.data?.items ?? [],
		[testDrivesQ.data?.items],
	);

	return {
		items,
		testDrivesQ,
		customerName,
		setCustomerName,
		testDriveID,
		setTestDriveID,
		revealedPasswords,
		setRevealedPassword: (id: string, value: string) =>
			setRevealedPasswords((prev) => ({ ...prev, [id]: value })),
		createMutation,
		revealMutation,
		resetCredentialMutation,
		resetTopologyMutation,
		deleteMutation,
	};
}
