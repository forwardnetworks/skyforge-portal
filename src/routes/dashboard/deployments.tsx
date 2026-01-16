import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useDashboardEvents } from "../../lib/dashboard-events";
import {
  buildLoginUrl,
  destroyDeployment,
  startDeployment,
  stopDeployment,
  type DashboardSnapshot,
  type JSONMap,
  type SkyforgeWorkspace,
  type WorkspaceDeployment
} from "../../lib/skyforge-api";
import { queryKeys } from "../../lib/query-keys";

export const Route = createFileRoute("/dashboard/deployments")({
  component: DeploymentsPage
});

function DeploymentsPage() {
  useDashboardEvents(true);

  const snap = useQuery<DashboardSnapshot | null>({
    queryKey: queryKeys.dashboardSnapshot(),
    queryFn: async () => null,
    initialData: null,
    retry: false,
    staleTime: Infinity
  });

  const [workspaceId, setWorkspaceId] = useState<string>("");

  const workspaces = snap.data?.workspaces ?? [];
  const selectedWorkspaceId = useMemo(() => {
    if (workspaceId && workspaces.some((w: SkyforgeWorkspace) => w.id === workspaceId)) return workspaceId;
    return workspaces[0]?.id ?? "";
  }, [workspaceId, workspaces]);

  const deployments = useMemo(() => {
    const all = (snap.data?.deployments ?? []) as WorkspaceDeployment[];
    return selectedWorkspaceId ? all.filter((d: WorkspaceDeployment) => d.workspaceId === selectedWorkspaceId) : all;
  }, [selectedWorkspaceId, snap.data?.deployments]);

  const runs = useMemo(() => {
    const all = (snap.data?.runs ?? []) as JSONMap[];
    if (!selectedWorkspaceId) return all;
    return all.filter((r: JSONMap) => String(r.workspaceId ?? "") === selectedWorkspaceId);
  }, [selectedWorkspaceId, snap.data?.runs]);

  const loginHref = buildLoginUrl(window.location.pathname + window.location.search);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Dashboard</div>
            <div className="mt-1 text-sm text-zinc-400">Live updates via SSE (`/api/dashboard/events`).</div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white"
              to="/dashboard/deployments/new"
            >
              Create deployment
            </Link>
            <label className="text-xs text-zinc-400">Workspace</label>
            <select
              className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100"
              value={selectedWorkspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              disabled={workspaces.length === 0}
            >
              {workspaces.map((w: SkyforgeWorkspace) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.slug})
                </option>
              ))}
            </select>
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
        <div className="text-base font-semibold">Deployments</div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-950/70">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Name</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Type</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Status</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Queue</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {deployments.map((d: WorkspaceDeployment) => (
                <tr key={d.id}>
                  <td className="px-3 py-2 text-zinc-100">{d.name}</td>
                  <td className="px-3 py-2 text-zinc-300">{d.type}</td>
                  <td className="px-3 py-2 text-zinc-300">
                    {d.activeTaskStatus ?? d.lastStatus ?? "unknown"}
                  </td>
                  <td className="px-3 py-2 text-zinc-300">{d.queueDepth ?? 0}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        label="Start"
                        onClick={() => startDeployment(d.workspaceId, d.id)}
                        disabled={!!d.activeTaskId}
                      />
                      <ActionButton
                        label="Stop"
                        onClick={() => stopDeployment(d.workspaceId, d.id)}
                        disabled={!d.activeTaskId}
                      />
                      <ActionButton
                        label="Destroy"
                        onClick={() => destroyDeployment(d.workspaceId, d.id)}
                        disabled={!!d.activeTaskId}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {deployments.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-sm text-zinc-400" colSpan={5}>
                    No deployments found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-base font-semibold">Recent runs</div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-950/70">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">ID</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Type</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Status</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {runs.slice(0, 30).map((r) => (
                <tr key={String(r.id ?? Math.random())}>
                  <td className="px-3 py-2 text-zinc-100">
                    <Link
                      className="text-sky-300 underline"
                      to="/dashboard/runs/$runId"
                      params={{ runId: String(r.id ?? "") }}
                    >
                      {String(r.id ?? "")}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-zinc-300">{String(r.type ?? "")}</td>
                  <td className="px-3 py-2 text-zinc-300">{String(r.status ?? "")}</td>
                  <td className="px-3 py-2 text-zinc-400">{String(r.createdAt ?? "")}</td>
                </tr>
              ))}
              {runs.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-sm text-zinc-400" colSpan={4}>
                    No runs found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ActionButton(props: { label: string; disabled?: boolean; onClick: () => Promise<unknown> }) {
  const [busy, setBusy] = useState(false);
  const disabled = props.disabled || busy;
  return (
    <button
      className={[
        "rounded-md border px-2 py-1 text-xs",
        disabled
          ? "cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-600"
          : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500 hover:text-white"
      ].join(" ")}
      disabled={disabled}
      onClick={async () => {
        try {
          setBusy(true);
          await props.onClick();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "…" : props.label}
    </button>
  );
}
