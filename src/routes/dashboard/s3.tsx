import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listStorageFiles, SKYFORGE_PROXY_ROOT } from "../../lib/skyforge-api";
import { queryKeys } from "../../lib/query-keys";

export const Route = createFileRoute("/dashboard/s3")({
  component: S3Page
});

function S3Page() {
  const files = useQuery({
    queryKey: queryKeys.storageFiles(),
    queryFn: listStorageFiles,
    staleTime: 10_000
  });

  const list = files.data?.files ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-lg font-semibold">S3</div>
        <div className="mt-1 text-sm text-zinc-400">Workspace artifacts and generated files (backed by the platform object store).</div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        {files.isLoading ? <div className="text-sm text-zinc-300">Loading…</div> : null}
        {files.isError ? <div className="text-sm text-red-300">Failed to list objects.</div> : null}

        {!files.isLoading && !files.isError ? (
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800 text-sm">
              <thead className="bg-zinc-950/70">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Object</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {list.map((name) => (
                  <tr key={name}>
                    <td className="px-3 py-2 font-mono text-xs text-zinc-200">{name}</td>
                    <td className="px-3 py-2">
                      <a
                        className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 hover:border-zinc-500 hover:text-white"
                        href={`${SKYFORGE_PROXY_ROOT}/storage/download/${encodeURIComponent(name)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
                {list.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-sm text-zinc-400" colSpan={2}>
                      No objects found.
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

