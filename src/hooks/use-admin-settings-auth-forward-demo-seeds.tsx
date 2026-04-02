import { type QueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	deleteAdminForwardDemoSeed,
	patchAdminForwardDemoSeed,
	patchAdminForwardDemoSeedConfig,
	putAdminForwardDemoSeed,
	type AdminForwardDemoSeedCatalogResponse,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

type UseAdminSettingsAuthForwardDemoSeedsArgs = {
	queryClient: QueryClient;
	forwardDemoSeedCatalog: AdminForwardDemoSeedCatalogResponse | undefined;
	refetchForwardDemoSeedCatalog: () => Promise<unknown>;
};

export function useAdminSettingsAuthForwardDemoSeeds({
	queryClient,
	forwardDemoSeedCatalog,
	refetchForwardDemoSeedCatalog,
}: UseAdminSettingsAuthForwardDemoSeedsArgs) {
	const uploadForwardDemoSeed = useMutation({
		mutationFn: putAdminForwardDemoSeed,
		onSuccess: async () => {
			toast.success("Demo seed uploaded");
			await Promise.all([
				refetchForwardDemoSeedCatalog(),
				queryClient.invalidateQueries({
					queryKey: queryKeys.adminForwardDemoSeedCatalog(),
				}),
			]);
		},
		onError: (e) => {
			toast.error("Failed to upload demo seed", {
				description: (e as Error).message,
			});
		},
	});

	const updateForwardDemoSeed = useMutation({
		mutationFn: async (input: {
			seedID: string;
			note?: string;
			enabled?: boolean;
			repeatCount?: number;
			order?: number;
		}) =>
			patchAdminForwardDemoSeed(input.seedID, {
				note: input.note,
				enabled: input.enabled,
				repeatCount: input.repeatCount,
				order: input.order,
			}),
		onSuccess: async () => {
			await Promise.all([
				refetchForwardDemoSeedCatalog(),
				queryClient.invalidateQueries({
					queryKey: queryKeys.adminForwardDemoSeedCatalog(),
				}),
			]);
		},
		onError: (e) => {
			toast.error("Failed to update demo seed", {
				description: (e as Error).message,
			});
		},
	});

	const saveForwardDemoSeedConfig = useMutation({
		mutationFn: patchAdminForwardDemoSeedConfig,
		onSuccess: async () => {
			toast.success("Demo network name updated");
			await Promise.all([
				refetchForwardDemoSeedCatalog(),
				queryClient.invalidateQueries({
					queryKey: queryKeys.adminForwardDemoSeedCatalog(),
				}),
			]);
		},
		onError: (e) => {
			toast.error("Failed to update demo seed config", {
				description: (e as Error).message,
			});
		},
	});

	const deleteForwardDemoSeed = useMutation({
		mutationFn: deleteAdminForwardDemoSeed,
		onSuccess: async () => {
			toast.success("Demo seed deleted");
			await Promise.all([
				refetchForwardDemoSeedCatalog(),
				queryClient.invalidateQueries({
					queryKey: queryKeys.adminForwardDemoSeedCatalog(),
				}),
			]);
		},
		onError: (e) => {
			toast.error("Failed to delete demo seed", {
				description: (e as Error).message,
			});
		},
	});

	return {
		forwardDemoSeedCatalog,
		uploadForwardDemoSeed,
		updateForwardDemoSeed,
		saveForwardDemoSeedConfig,
		deleteForwardDemoSeed,
	};
}
