import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { queryKeys } from "./query-keys";
import type { GetUserScopesResponse } from "./skyforge-api";
import { SKYFORGE_API } from "./skyforge-api";
import { subscribeSSE } from "./sse";

export function useUserScopeEvents(enabled: boolean, all: boolean) {
	const queryClient = useQueryClient();
	const url = useMemo(() => {
		const qs = all ? "?all=true" : "";
		return `${SKYFORGE_API}/users-events${qs}`;
	}, [all]);

	useEffect(() => {
		if (!enabled) return;

		const onSnapshot = (ev: MessageEvent<string>) => {
			try {
				const payload = JSON.parse(ev.data) as GetUserScopesResponse;
				queryClient.setQueryData(queryKeys.userScopes(), payload);
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
