import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { JSONMap } from "../../../lib/skyforge-api";
import { buildLoginUrl, type DashboardSnapshot } from "../../../lib/skyforge-api";
import { loginWithPopup } from "../../../lib/auth-popup";
import { useRunEvents, type RunLogState, type TaskLogEntry } from "../../../lib/run-events";
import { queryKeys } from "../../../lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button, buttonVariants } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

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
    <div className="space-y-6 p-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Run {runId}</CardTitle>
              <CardDescription>Live output via SSE (`/api/runs/:id/events`).</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Link className={buttonVariants({ variant: "outline", size: "sm" })} to="/dashboard/deployments">
                Back
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.setQueryData(queryKeys.runLogs(runId), { cursor: 0, entries: [] } satisfies RunLogState)}
              >
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!snap.data && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
             Waiting for dashboard stream…
             <div className="mt-2 text-xs">
                If you are logged out,{" "}
                <a
                  className="text-primary underline hover:no-underline"
                  href={loginHref}
                  onClick={(e) => {
                    e.preventDefault();
                    void (async () => {
                      const ok = await loginWithPopup({ loginHref });
                      if (!ok) {
                        window.location.href = loginHref;
                        return;
                      }
                      await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
                    })();
                  }}
                >
                  login
                </a>
                .
              </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Metadata</CardTitle>
            <div className="text-xs text-muted-foreground">Cursor: {String(logs.data?.cursor ?? 0)}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Meta label="Type" value={String(run?.type ?? "")} />
            <Meta label="Status" value={String(run?.status ?? "")} />
            <Meta label="Workspace" value={String(run?.workspaceId ?? "")} />
            <Meta label="Created" value={String(run?.createdAt ?? "")} />
            <Meta label="Started" value={String(run?.startedAt ?? "")} />
            <Meta label="Finished" value={String(run?.finishedAt ?? "")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-zinc-950 p-4 font-mono text-xs text-zinc-100">
            <RunOutput entries={logs.data?.entries ?? []} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Meta(props: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{props.label}</div>
      <div className="break-all font-medium text-sm">{props.value || "—"}</div>
    </div>
  );
}

function RunOutput(props: { entries: TaskLogEntry[] }) {
  if (props.entries.length === 0) return <div className="text-zinc-500">Waiting for output…</div>;
  return (
    <div className="max-h-[65vh] overflow-auto whitespace-pre-wrap">
      {props.entries.map((e, idx) => (
        <div key={`${e.time}-${idx}`}>
          <span className="text-zinc-500 select-none">{e.time ? `${e.time} ` : ""}</span>
          <span>{e.output}</span>
        </div>
      ))}
    </div>
  );
}
