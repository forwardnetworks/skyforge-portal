import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SKYFORGE_API,
  getPKIRoot,
  getPKISSHRoot,
  issuePKICert,
  issuePKISSHCert,
  listPKICerts,
  listPKISSHCerts
} from "../../lib/skyforge-api";
import { queryKeys } from "../../lib/query-keys";

export const Route = createFileRoute("/dashboard/pki")({
  component: PKIPage
});

function PKIPage() {
  const queryClient = useQueryClient();

  const root = useQuery({ queryKey: queryKeys.pkiRoot(), queryFn: getPKIRoot, staleTime: 60_000 });
  const sshRoot = useQuery({ queryKey: queryKeys.pkiSshRoot(), queryFn: getPKISSHRoot, staleTime: 60_000 });
  const certs = useQuery({ queryKey: queryKeys.pkiCerts(), queryFn: listPKICerts, staleTime: 15_000 });
  const sshCerts = useQuery({ queryKey: queryKeys.pkiSshCerts(), queryFn: listPKISSHCerts, staleTime: 15_000 });

  const [commonName, setCommonName] = useState("");
  const [sshPrincipals, setSshPrincipals] = useState("");

  const issueTLS = useMutation({
    mutationFn: async () => {
      const cn = commonName.trim();
      if (!cn) throw new Error("Common name is required");
      return issuePKICert({ commonName: cn } as any);
    },
    onSuccess: async () => {
      setCommonName("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.pkiCerts() });
    }
  });

  const issueSSH = useMutation({
    mutationFn: async () => {
      const principals = sshPrincipals
        .split(/[,\s]+/g)
        .map((s) => s.trim())
        .filter(Boolean);
      if (principals.length === 0) throw new Error("At least one principal is required");
      return issuePKISSHCert({ principals } as any);
    },
    onSuccess: async () => {
      setSshPrincipals("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.pkiSshCerts() });
    }
  });

  const tlsRows = certs.data?.certs ?? [];
  const sshRows = sshCerts.data?.certs ?? [];

  const sshCaKey = useMemo(() => sshRoot.data?.publicKey ?? "", [sshRoot.data?.publicKey]);
  const caPem = useMemo(() => root.data?.pem ?? "", [root.data?.pem]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-lg font-semibold">PKI</div>
        <div className="mt-1 text-sm text-zinc-400">Issue TLS and SSH certificates signed by Skyforge.</div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-base font-semibold">CA root</div>
          <div className="mt-2 text-xs text-zinc-400">Trust this PEM for Skyforge-issued TLS certs.</div>
          <textarea className="mt-3 h-40 w-full rounded-md border border-zinc-800 bg-zinc-950 p-2 font-mono text-xs text-zinc-200" readOnly value={caPem} />
          {root.isError ? <div className="mt-2 text-xs text-red-300">Failed to load CA root.</div> : null}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-base font-semibold">SSH CA</div>
          <div className="mt-2 text-xs text-zinc-400">Trust this public key for Skyforge-issued SSH certs.</div>
          <textarea className="mt-3 h-40 w-full rounded-md border border-zinc-800 bg-zinc-950 p-2 font-mono text-xs text-zinc-200" readOnly value={sshCaKey} />
          {sshRoot.isError ? <div className="mt-2 text-xs text-red-300">Failed to load SSH CA key.</div> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-base font-semibold">Issue TLS certificate</div>
          <div className="mt-3 grid gap-2">
            <div className="text-xs font-medium text-zinc-400">Common name</div>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
              placeholder="example.internal"
            />
          </div>
          {issueTLS.isError ? <div className="mt-2 text-xs text-red-300">{(issueTLS.error as Error).message}</div> : null}
          <button
            className="mt-4 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={issueTLS.isPending}
            onClick={() => issueTLS.mutate()}
          >
            {issueTLS.isPending ? "Issuing…" : "Issue"}
          </button>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-base font-semibold">Issue SSH certificate</div>
          <div className="mt-3 grid gap-2">
            <div className="text-xs font-medium text-zinc-400">Principals (comma or space separated)</div>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              value={sshPrincipals}
              onChange={(e) => setSshPrincipals(e.target.value)}
              placeholder="username, admin"
            />
          </div>
          {issueSSH.isError ? <div className="mt-2 text-xs text-red-300">{(issueSSH.error as Error).message}</div> : null}
          <button
            className="mt-4 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={issueSSH.isPending}
            onClick={() => issueSSH.mutate()}
          >
            {issueSSH.isPending ? "Issuing…" : "Issue"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-base font-semibold">Issued TLS certs</div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800 text-sm">
              <thead className="bg-zinc-950/70">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">CN</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Expires</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {tlsRows.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 text-zinc-100">{c.commonName}</td>
                    <td className="px-3 py-2 text-zinc-300">{c.expiresAt}</td>
                    <td className="px-3 py-2">
                      <a
                        className="text-sky-300 underline"
                        href={`${SKYFORGE_API}/pki/certs/${encodeURIComponent(c.id)}/download`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        bundle
                      </a>
                    </td>
                  </tr>
                ))}
                {!certs.isLoading && tlsRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-sm text-zinc-400" colSpan={3}>
                      No certificates issued yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {certs.isError ? <div className="mt-2 text-xs text-red-300">Failed to list certs.</div> : null}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <div className="text-base font-semibold">Issued SSH certs</div>
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-800 text-sm">
              <thead className="bg-zinc-950/70">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Principals</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Expires</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-300">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sshRows.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-2 text-zinc-100">{c.principals.join(", ")}</td>
                    <td className="px-3 py-2 text-zinc-300">{c.expiresAt}</td>
                    <td className="px-3 py-2">
                      <a
                        className="text-sky-300 underline"
                        href={`${SKYFORGE_API}/pki/ssh/certs/${encodeURIComponent(c.id)}/download`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        bundle
                      </a>
                    </td>
                  </tr>
                ))}
                {!sshCerts.isLoading && sshRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-sm text-zinc-400" colSpan={3}>
                      No SSH certificates issued yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          {sshCerts.isError ? <div className="mt-2 text-xs text-red-300">Failed to list SSH certs.</div> : null}
        </div>
      </div>
    </div>
  );
}
