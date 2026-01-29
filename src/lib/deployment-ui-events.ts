import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { queryKeys } from "./query-keys";
import { type DeploymentUIEvent, SKYFORGE_API } from "./skyforge-api";
import { subscribeSSE } from "./sse";

export type DeploymentUIEventsState = {
	cursor: number;
	events: DeploymentUIEvent[];
};

export type DeploymentUIEventsPayload = {
	cursor: number;
	events: DeploymentUIEvent[];
};

export function useDeploymentUIEvents(
	workspaceId: string,
	deploymentId: string,
	enabled: boolean,
) {
	const queryClient = useQueryClient();
	const url = useMemo(
		() =>
			`${SKYFORGE_API}/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/ui-events/events`,
		[deploymentId, workspaceId],
	);

	useEffect(() => {
		if (!enabled) return;
		if (!workspaceId || !deploymentId) return;

		const onUIEvents = (ev: MessageEvent<string>) => {
			try {
				const payload = JSON.parse(ev.data) as DeploymentUIEventsPayload;
				if (!payload || !Array.isArray(payload.events)) return;

				queryClient.setQueryData(
					queryKeys.deploymentUIEvents(workspaceId, deploymentId),
					(prev?: DeploymentUIEventsState) => {
						const prevEvents = prev?.events ?? [];
						const merged = prevEvents.concat(payload.events);
						// keep last 300
						const trimmed = merged.slice(Math.max(0, merged.length - 300));
						return {
							cursor: Number(payload.cursor ?? prev?.cursor ?? 0),
							events: trimmed,
						};
					},
				);
			} catch {
				// ignore parse errors
			}
		};

		const sub = subscribeSSE(url, { "ui-events": onUIEvents });
		return () => sub.close();
	}, [deploymentId, enabled, queryClient, url, workspaceId]);
}
