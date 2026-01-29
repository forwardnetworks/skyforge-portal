import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { queryKeys } from "./query-keys";
import type { StatusSummaryResponse } from "./skyforge-api";
import { subscribeSSE } from "./sse";

export function useStatusSummaryEvents(enabled: boolean) {
	const queryClient = useQueryClient();
	const url = useMemo(() => `/status/summary/events`, []);

	useEffect(() => {
		if (!enabled) return;

		const onSnapshot = (ev: MessageEvent<string>) => {
			try {
				const payload = JSON.parse(ev.data) as StatusSummaryResponse;
				queryClient.setQueryData(queryKeys.statusSummary(), payload);
			} catch {
				// ignore parse errors
			}
		};

		const sub = subscribeSSE(url, { snapshot: onSnapshot });

		return () => {
			sub.close();
		};
	}, [enabled, queryClient, url]);
}
