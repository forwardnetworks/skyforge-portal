import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { queryKeys } from "./query-keys";
import { SKYFORGE_API } from "./skyforge-api";
import { subscribeSSE } from "./sse";

export type TaskLifecycleEntry = {
	type: string;
	time: string;
	payload?: Record<string, unknown>;
};

export type RunLifecycleEvent = {
	cursor: number;
	entries: TaskLifecycleEntry[];
};

export type RunLifecycleState = {
	cursor: number;
	entries: TaskLifecycleEntry[];
};

export function useRunLifecycleEvents(runId: string, enabled: boolean) {
	const queryClient = useQueryClient();
	const url = useMemo(
		() => `${SKYFORGE_API}/runs/${encodeURIComponent(runId)}/lifecycle`,
		[runId],
	);

	useEffect(() => {
		if (!enabled) return;
		if (!runId) return;

		const onLifecycle = (ev: MessageEvent<string>) => {
			try {
				const payload = JSON.parse(ev.data) as RunLifecycleEvent;
				if (!payload || !Array.isArray(payload.entries)) return;

				queryClient.setQueryData(
					queryKeys.runLifecycle(runId),
					(prev?: RunLifecycleState) => {
						const prevEntries = prev?.entries ?? [];
						const merged = prevEntries.concat(payload.entries);
						return {
							cursor: Number(payload.cursor ?? prev?.cursor ?? 0),
							entries: merged,
						};
					},
				);
			} catch {
				// ignore parse errors
			}
		};

		const sub = subscribeSSE(url, { lifecycle: onLifecycle });
		return () => {
			sub.close();
		};
	}, [enabled, queryClient, runId, url]);
}
