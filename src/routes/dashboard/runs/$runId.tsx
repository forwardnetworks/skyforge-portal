import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSONMap } from "../../../lib/skyforge-api";
import { buildLoginUrl, type DashboardSnapshot } from "../../../lib/skyforge-api";
import { useRunEvents, type RunLogState, type TaskLogEntry } from "../../../lib/run-events";
import { queryKeys } from "../../../lib/query-keys";

export const Route = createFileRoute("/dashboard/runs/$runId")({
  component: RunDetailPage
});

function RunDetailPage() {
  const { runId } = Route.useParams();
  useRunEvents(runId, true);
  const queryClient = useQueryClient();

  const snap = useQuery<DashboardSnapshot | null>({
    queryKey: queryKeys.dashboardSnapshot(),
    queryFn: async () => null,
    initialData: null,
    retry: false,
    staleTime: Infinity
  });

  const run = (snap.data?.runs ?? []).find((r: JSONMap) => String(r.id ?? "") === runId) as JSONMap | undefined;

  const logs = useQuery({
    queryKey: queryKeys.runLogs(runId),
    queryFn: async () => ({ cursor: 0, entries: [] }) as RunLogState,
    retry: false,
    staleTime: Infinity
  });

  const loginHref = buildLoginUrl(window.location.pathname + window.location.search);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Run {runId}</div>
            <div className="mt-1 text-sm text-zinc-400">Live output via SSE (`/api/runs/:id/events`).</div>
          </div>
          <div className="flex items-center gap-2">
            <Link className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200" to="/dashboard/deployments">
              Back
            </Link>
            <button
              className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200"
              onClick={() => queryClient.setQueryData(queryKeys.runLogs(runId), { cursor: 0, entries: [] } satisfies RunLogState)}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {!snap.data ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-sm text-zinc-300">Waiting for dashboard stream…</div>
          <div className="mt-3 text-xs text-zinc-400">
            If you are logged out,{" "}
            <a className="text-sky-300 underline" href={loginHref}>
              login
            </a>
            .
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-base font-semibold">Metadata</div>
          <div className="text-xs text-zinc-400">Cursor: {String(logs.data?.cursor ?? 0)}</div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Meta label="Type" value={String(run?.type ?? "")} />
          <Meta label="Status" value={String(run?.status ?? "")} />
          <Meta label="Workspace" value={String(run?.workspaceId ?? "")} />
          <Meta label="Created" value={String(run?.createdAt ?? "")} />
          <Meta label="Started" value={String(run?.startedAt ?? "")} />
          <Meta label="Finished" value={String(run?.finishedAt ?? "")} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-base font-semibold">Output</div>
        <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-200">
          <RunOutput entries={logs.data?.entries ?? []} />
        </div>
      </div>
    </div>
  );
}

function Meta(props: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/30 p-3">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{props.label}</div>
      <div className="mt-1 break-all text-sm text-zinc-200">{props.value || "—"}</div>
    </div>
  );
}

function RunOutput(props: { entries: TaskLogEntry[] }) {
  if (props.entries.length === 0) return <div className="text-zinc-500">Waiting for output…</div>;
  return (
    <div className="max-h-[65vh] overflow-auto whitespace-pre-wrap">
      {props.entries.map((e, idx) => (
        <div key={`${e.time}-${idx}`}>
          <span className="text-zinc-500">{e.time ? `${e.time} ` : ""}</span>
          <span>{e.output}</span>
        </div>
      ))}
    </div>
  );
}
