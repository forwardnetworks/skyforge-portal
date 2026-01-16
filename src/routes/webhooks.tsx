import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listWebhookEvents } from "../lib/skyforge-api";
import { queryKeys } from "../lib/query-keys";

export const Route = createFileRoute("/webhooks")({
  component: WebhooksPage
});

function WebhooksPage() {
  const events = useQuery({
    queryKey: queryKeys.webhookEvents("200"),
    queryFn: () => listWebhookEvents({ limit: "200" }),
    staleTime: 5_000
  });

  const list = events.data?.events ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-lg font-semibold">Webhook inbox</div>
        <div className="mt-1 text-sm text-zinc-400">Recent webhook events routed to your user.</div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        {events.isLoading ? <div className="text-sm text-zinc-300">Loading…</div> : null}
        {events.isError ? <div className="text-sm text-red-300">Failed to load webhook events.</div> : null}

        {!events.isLoading && !events.isError ? (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800 text-sm">
              <thead className="bg-zinc-950/70">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Time</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Source</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Event</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {list.map((e) => (
                  <tr key={String(e.id)}>
                    <td className="px-3 py-2 text-zinc-300">{e.receivedAt ?? ""}</td>
                    <td className="px-3 py-2 text-zinc-300">{e.sourceIp ?? ""}</td>
                    <td className="px-3 py-2 text-zinc-100">
                      {e.method} {e.path}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-400">{String(e.id)}</td>
                  </tr>
                ))}
                {list.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-sm text-zinc-400" colSpan={4}>
                      No webhook events.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
