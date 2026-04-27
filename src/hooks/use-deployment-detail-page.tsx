import { useDashboardEvents } from "@/lib/dashboard-events";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useDeploymentDetailActions } from "./use-deployment-detail-actions";
import { useDeploymentDetailData } from "./use-deployment-detail-data";
export type { DeploymentDetailTab } from "./use-deployment-detail-data";
export {
	formatResourceEstimateSummary,
	resolveDeploymentDisplayStatus,
	resolveDeploymentPrimaryAction,
} from "./deployment-detail-utils";

export function useDeploymentDetailPage(args: {
	deploymentId: string;
	action?: string;
	node?: string;
	tab?: string;
}) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	useDashboardEvents(true);

	const data = useDeploymentDetailData(args);
	const topologyNodes = useMemo(
		() =>
			(data.topology.data?.nodes ?? []).map((node) => ({
				id: String(node.id),
			})),
		[data.topology.data?.nodes],
	);
	const actions = useDeploymentDetailActions({
		deployment: data.deployment,
		navigate,
		queryClient,
		topologyNodes,
	});

	return {
		...data,
		...actions,
		isBusy: Boolean(data.deployment?.activeTaskId) || actions.actionPending,
		navigate,
	};
}

export type DeploymentDetailPageState = ReturnType<
	typeof useDeploymentDetailPage
>;
