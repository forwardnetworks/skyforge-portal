import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotificationSettings, updateNotificationSettings } from "../../lib/skyforge-api";
import { queryKeys } from "../../lib/query-keys";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage
});

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const session = queryClient.getQueryData<any>(queryKeys.session());
  const isAdmin = !!session?.isAdmin;
  const settings = useQuery({
    queryKey: queryKeys.notificationSettings(),
    queryFn: getNotificationSettings,
    staleTime: 30_000
  });

  const [pollingEnabled, setPollingEnabled] = useState<boolean>(false);
  const [pollingInterval, setPollingInterval] = useState<number>(5000);

  useEffect(() => {
    if (!settings.data) return;
    setPollingEnabled(!!settings.data.pollingEnabled);
    setPollingInterval(Number(settings.data.pollingIntervalMs ?? 5000));
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () =>
      updateNotificationSettings({
        pollingEnabled,
        pollingIntervalMs: pollingInterval
      } as any),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.notificationSettings() });
    }
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-lg font-semibold">System settings</div>
        <div className="mt-1 text-sm text-zinc-400">Admin-only settings for Skyforge.</div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-base font-semibold">Notification polling</div>
        <div className="mt-1 text-sm text-zinc-400">
          Controls background polling for notifications (client UX).
        </div>

        {!isAdmin ? <div className="mt-3 text-sm text-red-300">Admin access required.</div> : null}

        {settings.isLoading ? <div className="mt-3 text-sm text-zinc-300">Loading…</div> : null}
        {settings.isError ? (
          <div className="mt-3 text-sm text-red-300">Failed to load settings.</div>
        ) : null}

        {!settings.isLoading && !settings.isError ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-medium text-zinc-400">Enabled</div>
              <select
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
                value={pollingEnabled ? "true" : "false"}
                onChange={(e) => setPollingEnabled(e.target.value === "true")}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-400">Interval (ms)</div>
              <input
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100 disabled:opacity-60"
                type="number"
                min={1000}
                value={pollingInterval}
                disabled={!pollingEnabled}
                onChange={(e) => setPollingInterval(Math.max(1000, Number(e.target.value || 0)))}
              />
              <div className="mt-1 text-xs text-zinc-500">Minimum 1000ms.</div>
            </div>
          </div>
        ) : null}

        {save.isError ? (
          <div className="mt-3 text-sm text-red-300">{(save.error as Error).message}</div>
        ) : null}

        <button
          className="mt-5 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={save.isPending || settings.isLoading}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
