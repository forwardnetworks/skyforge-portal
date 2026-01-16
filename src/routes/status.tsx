import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPlatformHealth } from "../lib/skyforge-api";

export const Route = createFileRoute("/status")({
  component: StatusPage
});

function StatusPage() {
  const health = useQuery({
    queryKey: ["platformHealth"],
    queryFn: getPlatformHealth,
    refetchInterval: 15_000
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-lg font-semibold">Platform status</div>
        <div className="mt-1 text-sm text-zinc-400">Backed by `/data/platform-health.json`</div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        {health.isLoading ? (
          <div className="text-sm text-zinc-300">Loading…</div>
        ) : health.isError || !health.data ? (
          <div className="text-sm text-red-300">{(health.error as Error).message}</div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-zinc-300">
              Generated: <span className="text-zinc-200">{health.data.generatedAt ?? "unknown"}</span>
            </div>
            <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
              {(health.data.checks ?? []).map((c, idx) => (
                <div key={c.id ?? `${idx}`} className="flex items-start justify-between gap-4 p-3">
                  <div>
                    <div className="text-sm font-medium text-zinc-100">{c.name ?? c.id ?? "check"}</div>
                    {c.message ? <div className="text-xs text-zinc-400">{c.message}</div> : null}
                  </div>
                  <div className="text-xs text-zinc-300">{c.status ?? "unknown"}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
