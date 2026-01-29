import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { queryKeys } from "./query-keys";
import type { NotificationRecord } from "./skyforge-api";
import { SKYFORGE_API } from "./skyforge-api";
import { subscribeSSE } from "./sse";

export type NotificationsSnapshot = {
	notifications: NotificationRecord[];
	refreshedAt?: string;
};

export function useNotificationsEvents(
	enabled: boolean,
	includeRead: boolean,
	limit: string,
) {
	const queryClient = useQueryClient();
	const url = useMemo(() => {
		const qs = new URLSearchParams();
		qs.set("include_read", includeRead ? "true" : "false");
		qs.set("limit", limit);
		return `${SKYFORGE_API}/notifications/events?${qs.toString()}`;
	}, [includeRead, limit]);

	useEffect(() => {
		if (!enabled) return;

		const onSnapshot = (ev: MessageEvent<string>) => {
			try {
				const payload = JSON.parse(ev.data) as NotificationsSnapshot;
				if (!payload || !Array.isArray(payload.notifications)) return;
				queryClient.setQueryData(
					queryKeys.notifications(includeRead, limit),
					payload,
				);
			} catch {
				// ignore parse errors
			}
		};

		const sub = subscribeSSE(url, { snapshot: onSnapshot });

		return () => {
			sub.close();
		};
	}, [enabled, includeRead, limit, queryClient, url]);
}
