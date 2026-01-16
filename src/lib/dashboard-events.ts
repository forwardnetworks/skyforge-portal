import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DashboardSnapshot } from "./skyforge-api";
import { SKYFORGE_API } from "./skyforge-api";
import { queryKeys } from "./query-keys";
import { subscribeSSE } from "./sse";

export function useDashboardEvents(enabled: boolean) {
  const queryClient = useQueryClient();
  const url = useMemo(() => `${SKYFORGE_API}/dashboard/events`, []);

  useEffect(() => {
    if (!enabled) return;

    const onSnapshot = (ev: MessageEvent<string>) => {
      try {
        const snap = JSON.parse(ev.data) as DashboardSnapshot;
        queryClient.setQueryData(queryKeys.dashboardSnapshot(), snap);
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
