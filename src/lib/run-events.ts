import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SKYFORGE_API } from "./skyforge-api";
import { queryKeys } from "./query-keys";
import { subscribeSSE } from "./sse";

export type TaskLogEntry = {
  output: string;
  time: string;
  stream?: string;
};

export type RunOutputEvent = {
  cursor: number;
  entries: TaskLogEntry[];
};

export type RunLogState = {
  cursor: number;
  entries: TaskLogEntry[];
};

export function useRunEvents(runId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const url = useMemo(() => `${SKYFORGE_API}/runs/${encodeURIComponent(runId)}/events`, [runId]);

  useEffect(() => {
    if (!enabled) return;
    if (!runId) return;

    const onOutput = (ev: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(ev.data) as RunOutputEvent;
        if (!payload || !Array.isArray(payload.entries)) return;

        queryClient.setQueryData(queryKeys.runLogs(runId), (prev?: RunLogState) => {
          const prevEntries = prev?.entries ?? [];
          const merged = prevEntries.concat(payload.entries);
          return {
            cursor: Number(payload.cursor ?? prev?.cursor ?? 0),
            entries: merged
          };
        });
      } catch {
        // ignore parse errors
      }
    };

    const sub = subscribeSSE(url, { output: onOutput });

    return () => {
      sub.close();
    };
  }, [enabled, queryClient, runId, url]);
}
