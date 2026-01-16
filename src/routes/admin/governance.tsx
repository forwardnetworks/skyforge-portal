import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getGovernanceSummary,
  listGovernanceCosts,
  listGovernanceResources,
  listGovernanceUsage,
  syncGovernanceSources
} from "../../lib/skyforge-api";
import { queryKeys } from "../../lib/query-keys";

export const Route = createFileRoute("/admin/governance")({
  component: GovernancePage
});

function GovernancePage() {
  const queryClient = useQueryClient();
  const session = queryClient.getQueryData<any>(queryKeys.session());
  const isAdmin = !!session?.isAdmin;

  const summary = useQuery({
    queryKey: queryKeys.governanceSummary(),
    queryFn: getGovernanceSummary,
    staleTime: 30_000
  });
  const resources = useQuery({
    queryKey: queryKeys.governanceResources("500"),
    queryFn: () => listGovernanceResources({ limit: "500" }),
    staleTime: 30_000
  });
  const costs = useQuery({
    queryKey: queryKeys.governanceCosts("50"),
    queryFn: () => listGovernanceCosts({ limit: "50" }),
    staleTime: 30_000
  });
  const usage = useQuery({
    queryKey: queryKeys.governanceUsage("50"),
    queryFn: () => listGovernanceUsage({ limit: "50" }),
    staleTime: 30_000
  });

  const [query, setQuery] = useState("");

  const filteredResources = useMemo(() => {
    const list = resources.data?.resources ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) => {
      const haystack = [r.name, r.resourceId, r.resourceType, r.workspaceName, r.owner, r.provider]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [resources.data?.resources, query]);

  const sync = useMutation({
    mutationFn: async () => {
      await syncGovernanceSources();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.governanceSummary() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.governanceResources("500") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.governanceCosts("50") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.governanceUsage("50") })
      ]);
    }
  });

  const summaryData = summary.data;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Governance</div>
            <div className="mt-1 text-sm text-zinc-400">Admin-only inventory, cost, and usage telemetry.</div>
          </div>
          <button
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={sync.isPending || !isAdmin}
            onClick={() => sync.mutate()}
          >
            {sync.isPending ? "Syncing…" : "Sync sources"}
          </button>
        </div>
      </div>

      {!isAdmin ? (
        <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-5 text-sm text-red-200">
          Admin access required.
        </div>
      ) : null}

      {summary.isError || resources.isError || costs.isError || usage.isError ? (
        <div className="rounded-xl border border-red-900/40 bg-red-950/30 p-5 text-sm text-red-200">
          Failed to load governance data.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Resources tracked" value={String(summaryData?.resourceCount ?? "—")} />
        <StatCard title="Active resources" value={String(summaryData?.activeResources ?? "—")} />
        <StatCard title="Workspaces tracked" value={String(summaryData?.workspacesTracked ?? "—")} />
        <StatCard title="Last 30d spend" value={summaryData ? `${summaryData.costLast30Days} ${summaryData.costCurrency}` : "—"} />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-base font-semibold">Resource inventory</div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <input
            className="w-full max-w-md rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
            placeholder="Search (name, workspace, owner, id)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-xs text-zinc-500">{filteredResources.length} shown</div>
        </div>
        <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-950/70">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Name</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Provider</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Type</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Workspace</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Owner</th>
                <th className="px-3 py-2 text-left font-medium text-zinc-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredResources.slice(0, 500).map((r) => (
                <tr key={r.resourceId}>
                  <td className="px-3 py-2 text-zinc-100">{r.name}</td>
                  <td className="px-3 py-2 text-zinc-300">{r.provider}</td>
                  <td className="px-3 py-2 text-zinc-300">{r.resourceType}</td>
                  <td className="px-3 py-2 text-zinc-300">{r.workspaceName}</td>
                  <td className="px-3 py-2 text-zinc-300">{r.owner}</td>
                  <td className="px-3 py-2 text-zinc-300">{r.status ?? "unknown"}</td>
                </tr>
              ))}
              {!resources.isLoading && filteredResources.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-sm text-zinc-400" colSpan={6}>
                    No resources.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SimpleListCard
          title="Recent cost snapshots"
          rows={(costs.data?.costs ?? []).slice(0, 30).map((c) => ({
            left: `${c.provider} ${c.currency}`,
            right: `${c.amount} (end ${c.periodEnd})`
          }))}
          empty="No cost snapshots."
        />
        <SimpleListCard
          title="Recent usage snapshots"
          rows={(usage.data?.usage ?? []).slice(0, 30).map((u) => ({
            left: `${u.provider}`,
            right: `${u.metric}=${u.value} (at ${u.collectedAt})`
          }))}
          empty="No usage snapshots."
        />
      </div>
    </div>
  );
}

function StatCard(props: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{props.title}</div>
      <div className="mt-2 text-2xl font-semibold text-zinc-100">{props.value}</div>
    </div>
  );
}

function SimpleListCard(props: {
  title: string;
  rows: Array<{ left: string; right: string }>;
  empty: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
      <div className="text-base font-semibold">{props.title}</div>
      <div className="mt-3 space-y-2">
        {props.rows.length ? (
          props.rows.map((r, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm">
              <div className="text-zinc-200">{r.left}</div>
              <div className="text-zinc-400">{r.right}</div>
            </div>
          ))
        ) : (
          <div className="text-sm text-zinc-400">{props.empty}</div>
        )}
      </div>
    </div>
  );
}
