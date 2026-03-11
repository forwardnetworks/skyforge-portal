import { buildEdgeFlags } from "@/components/topology-viewer-utils";
import type { DeploymentUIEventsState } from "@/lib/deployment-ui-events";
import { useDeploymentUIEvents } from "@/lib/deployment-ui-events";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useTopologyViewerActivity(
	userId?: string,
	deploymentId?: string,
) {
	const uiEventsEnabled = Boolean(userId && deploymentId);

	useDeploymentUIEvents(userId ?? "", deploymentId ?? "", uiEventsEnabled);

	const uiEvents = useQuery({
		queryKey:
			userId && deploymentId
				? queryKeys.deploymentUIEvents(userId, deploymentId)
				: ["deploymentUIEvents", "none"],
		queryFn: async () => ({ cursor: 0, events: [] }) as DeploymentUIEventsState,
		initialData: { cursor: 0, events: [] } as DeploymentUIEventsState,
		staleTime: Number.POSITIVE_INFINITY,
		enabled: uiEventsEnabled,
	});

	const edgeFlags = useMemo(
		() => buildEdgeFlags(uiEvents.data?.events ?? []),
		[uiEvents.data?.events],
	);

	return {
		uiEventsEnabled,
		uiEvents,
		edgeFlags,
	};
}
