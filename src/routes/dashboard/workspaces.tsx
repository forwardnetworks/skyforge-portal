import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getWorkspaces } from "../../lib/skyforge-api";
import type { SkyforgeWorkspace } from "../../lib/skyforge-api";
import { queryKeys } from "../../lib/query-keys";

export const Route = createFileRoute("/dashboard/workspaces")({
  component: WorkspacesPage
});

function WorkspacesPage() {
  const workspaces = useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: getWorkspaces,
    staleTime: 30_000
  });

  const list = (workspaces.data?.workspaces ?? []) as SkyforgeWorkspace[];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-lg font-semibold">Workspaces</div>
        <div className="mt-1 text-sm text-zinc-400">Workspace catalog and sharing live in Skyforge.</div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        {workspaces.isLoading ? <div className="text-sm text-zinc-300">Loading…</div> : null}
        {workspaces.isError ? (
          <div className="text-sm text-red-300">Failed to load workspaces.</div>
        ) : null}

        {!workspaces.isLoading && !workspaces.isError ? (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800 text-sm">
              <thead className="bg-zinc-950/70">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Slug</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Owner</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Visibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {list.map((w) => (
                  <tr key={w.id}>
                    <td className="px-3 py-2 text-zinc-100">
                      <Link className="text-sky-300 underline" to="/dashboard/deployments">
                        {w.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-zinc-300">{w.slug}</td>
                    <td className="px-3 py-2 text-zinc-300">{w.createdBy}</td>
                    <td className="px-3 py-2 text-zinc-300">{w.isPublic ? "public" : "private"}</td>
                  </tr>
                ))}
                {list.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-sm text-zinc-400" colSpan={4}>
                      No workspaces found.
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

