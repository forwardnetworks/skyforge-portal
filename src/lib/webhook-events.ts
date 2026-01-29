import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { queryKeys } from "./query-keys";
import type { ListWebhookEventsResponse } from "./skyforge-api";
import { SKYFORGE_API } from "./skyforge-api";
import { subscribeSSE } from "./sse";

export function useWebhookEvents(enabled: boolean, limit: string) {
	const queryClient = useQueryClient();
	const url = useMemo(
		() =>
			`${SKYFORGE_API}/webhooks/events/stream?limit=${encodeURIComponent(limit)}`,
		[limit],
	);

	useEffect(() => {
		if (!enabled) return;

		const onSnapshot = (ev: MessageEvent<string>) => {
			try {
				const payload = JSON.parse(ev.data) as ListWebhookEventsResponse;
				queryClient.setQueryData(queryKeys.webhookEvents(limit), payload);
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
