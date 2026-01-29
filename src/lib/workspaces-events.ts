import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { queryKeys } from "./query-keys";
import type { GetWorkspacesResponse } from "./skyforge-api";
import { SKYFORGE_API } from "./skyforge-api";
import { subscribeSSE } from "./sse";

export function useWorkspacesEvents(enabled: boolean, all: boolean) {
	const queryClient = useQueryClient();
	const url = useMemo(() => {
		const qs = all ? "?all=true" : "";
		return `${SKYFORGE_API}/workspaces-events${qs}`;
	}, [all]);

	useEffect(() => {
		if (!enabled) return;

		const onSnapshot = (ev: MessageEvent<string>) => {
			try {
				const payload = JSON.parse(ev.data) as GetWorkspacesResponse;
				queryClient.setQueryData(queryKeys.workspaces(), payload);
			} catch {
				// ignore parse errors
			}
		};

		const sub = subscribeSSE(url, { snapshot: onSnapshot });

		return () => {
			sub.close();
		};
	}, [all, enabled, queryClient, url]);
}
