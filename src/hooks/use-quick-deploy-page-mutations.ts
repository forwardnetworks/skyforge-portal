import { runQuickDeploy } from "@/lib/api-client";
import { invalidateDashboardQueries } from "@/lib/dashboard-query-sync";
import type { QueryClient, UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { hardRefreshToDeploymentTopology, waitForForwardSyncAndNetwork } from "@/hooks/use-quick-deploy-page-forward-sync";

type QuickDeployRunResult = {
	userId: string;
	deploymentId: string;
	deploymentName: string;
	noOp?: boolean;
	reason?: string;
};

export function useQuickDeployDeployMutation(args: {
	queryClient: QueryClient;
	navigate: ReturnType<typeof useNavigate>;
	leaseHours: string;
}): UseMutationResult<QuickDeployRunResult, Error, string, undefined> {
	const { queryClient, navigate, leaseHours } = args;

	return useMutation({
		mutationFn: async (template: string) =>
			runQuickDeploy({
				template,
				leaseHours: Number.parseInt(leaseHours, 10) || 4,
			}),
		onSuccess: async (result) => {
			if (result.noOp) {
				toast.message("Deployment already in desired state", {
					description: result.deploymentName,
				});
			} else {
				toast.success("Quick deployment queued", {
					description: result.deploymentName,
				});
			}
			await invalidateDashboardQueries(queryClient);

			await navigate({
				to: "/dashboard/deployments/$deploymentId",
				params: { deploymentId: result.deploymentId },
				search: { tab: "topology" } as any,
			});

			if (typeof window !== "undefined") {
				void (async () => {
					try {
						await waitForForwardSyncAndNetwork(
							result.userId,
							result.deploymentId,
						);
						toast.success("Forward sync completed", {
							description:
								"Use the deployment page buttons to open the network in Forward.",
						});
						hardRefreshToDeploymentTopology(result.deploymentId);
					} catch (error) {
						toast.error("Forward sync did not complete", {
							description:
								error instanceof Error ? error.message : String(error),
						});
					}
				})();
			}
		},
		onError: (err) => {
			toast.error("Quick deploy failed", {
				description: err instanceof Error ? err.message : String(err),
			});
		},
	});
}
