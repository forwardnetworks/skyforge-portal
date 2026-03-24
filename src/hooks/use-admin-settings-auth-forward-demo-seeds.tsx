import { type QueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	deleteAdminForwardDemoSeed,
	patchAdminForwardDemoSeed,
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
			displayName?: string;
			enabled?: boolean;
			order?: number;
		}) =>
			patchAdminForwardDemoSeed(input.seedID, {
				displayName: input.displayName,
				enabled: input.enabled,
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
		deleteForwardDemoSeed,
	};
}
