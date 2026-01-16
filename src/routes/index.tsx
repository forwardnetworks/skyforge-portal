import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { buildLoginUrl, getPlatformHealth } from "../lib/skyforge-api";

export const Route = createFileRoute("/")({
  component: LandingPage
});

function LandingPage() {
  const health = useQuery({
    queryKey: ["platformHealth"],
    queryFn: getPlatformHealth,
    retry: false,
    staleTime: 30_000
  });

  const loginHref = buildLoginUrl("/dashboard/deployments");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-sm text-zinc-400">Skyforge Automation Platform</div>
        <div className="mt-2 text-2xl font-semibold">Welcome to Skyforge</div>
        <div className="mt-2 max-w-2xl text-sm text-zinc-300">
          Launch Netlab/LabPP/Containerlab workflows, manage deployments, and stream run output live via SSE.
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white"
            href={loginHref}
          >
            Login &amp; open dashboard
          </a>
          <Link
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white"
            to="/status"
          >
            Platform status
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
        <div className="text-base font-semibold">Quick status</div>
        <div className="mt-2 text-sm text-zinc-400">
          {health.isLoading ? "Loading…" : null}
          {health.isError ? "Unable to load platform health." : null}
          {health.data?.checks?.length ? null : !health.isLoading && !health.isError ? "No health data." : null}
        </div>
        {health.data?.checks?.length ? (
          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800 text-sm">
              <thead className="bg-zinc-950/70">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Check</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {health.data.checks.slice(0, 10).map((c, idx) => (
                  <tr key={`${c.id ?? idx}`}>
                    <td className="px-3 py-2 text-zinc-100">{c.name ?? c.id ?? "unknown"}</td>
                    <td className="px-3 py-2 text-zinc-300">{c.status ?? "unknown"}</td>
                    <td className="px-3 py-2 text-zinc-400">{c.message ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
