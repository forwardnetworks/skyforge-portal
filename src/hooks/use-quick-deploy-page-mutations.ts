import { runQuickDeploy } from "@/lib/api-client";
import {
	invalidateDashboardSnapshotQuery,
	invalidateUserScopeActivityQueries,
} from "@/lib/dashboard-query-sync";
import type { QueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
	hardRefreshToDeploymentTopology,
	waitForForwardSyncAndNetwork,
} from "@/hooks/use-quick-deploy-page-forward-sync";

type QuickDeployRunResult = {
	userId: string;
	deploymentId: string;
	deploymentName: string;
	noOp?: boolean;
	reason?: string;
};

type QuickDeployDeployController = {
	isPending: boolean;
	mutate: (template: string) => void;
};

export function useQuickDeployDeployMutation(args: {
	queryClient: QueryClient;
	navigate: ReturnType<typeof useNavigate>;
	leaseHours: string;
}): QuickDeployDeployController {
	const { queryClient, navigate, leaseHours } = args;
	const [isPending, setIsPending] = useState(false);

	const mutate = useCallback(
		(template: string) => {
			if (isPending) {
				return;
			}
			const toastId = `quick-deploy-launch-${Date.now()}`;
			setIsPending(true);
			toast.loading("Launching lab…", {
				id: toastId,
				description:
					"Opening deployments while Skyforge creates the deployment and queues the run.",
			});

			void (async () => {
				try {
					await navigate({ to: "/dashboard/deployments" });

					const result: QuickDeployRunResult = await runQuickDeploy({
						template,
						leaseHours: Number.parseInt(leaseHours, 10) || 4,
					});

					if (result.noOp) {
						toast.message("Deployment already in desired state", {
							id: toastId,
							description: result.deploymentName,
						});
					} else {
						toast.success("Quick deployment queued", {
							id: toastId,
							description: result.deploymentName,
						});
					}

					await Promise.all([
						invalidateDashboardSnapshotQuery(queryClient),
						invalidateUserScopeActivityQueries(queryClient, result.userId),
					]);

					await navigate({
						to: "/dashboard/deployments/$deploymentId",
						params: { deploymentId: result.deploymentId },
						search: { tab: "topology" } as never,
					});

					if (typeof window !== "undefined") {
						void (async () => {
							try {
								await waitForForwardSyncAndNetwork(
									result.userId,
									result.deploymentId,
								);
								toast.success("Forward network ready", {
									description:
										"Use the deployment page buttons to open the network in Forward.",
								});
								hardRefreshToDeploymentTopology(result.deploymentId);
							} catch (error) {
								toast.error("Forward network was not created", {
									description:
										error instanceof Error ? error.message : String(error),
								});
							}
						})();
					}
				} catch (error) {
					toast.error("Quick deploy failed", {
						id: toastId,
						description:
							error instanceof Error ? error.message : String(error),
					});
				} finally {
					setIsPending(false);
				}
			})();
		},
		[isPending, leaseHours, navigate, queryClient],
	);

	return { isPending, mutate };
}
