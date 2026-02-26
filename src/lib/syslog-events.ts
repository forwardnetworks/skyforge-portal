import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import type { ListSyslogEventsResponse } from "./api-client";
import { SKYFORGE_API } from "./api-client";
import { queryKeys } from "./query-keys";
import { subscribeSSE } from "./sse";

export function useSyslogEvents(enabled: boolean, limit: string) {
	const queryClient = useQueryClient();
	const url = useMemo(
		() =>
			`${SKYFORGE_API}/syslog/events/stream?limit=${encodeURIComponent(limit)}`,
		[limit],
	);

	useEffect(() => {
		if (!enabled) return;

		const onSnapshot = (ev: MessageEvent<string>) => {
			try {
				const payload = JSON.parse(ev.data) as ListSyslogEventsResponse;
				queryClient.setQueryData(queryKeys.syslogEvents(limit), payload);
			} catch {
				// ignore parse errors
			}
		};

		const sub = subscribeSSE(url, { snapshot: onSnapshot });

		return () => {
			sub.close();
		};
	}, [enabled, limit, queryClient, url]);
}
