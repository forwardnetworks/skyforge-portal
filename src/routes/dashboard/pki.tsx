import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, RefreshCw, Shield, Key, Lock, Inbox } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { TableWrapper } from "../../components/ui/table-wrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";

// Search Schema
const pkiSearchSchema = z.object({
  tab: z.enum(["tls", "ssh"]).optional().catch("tls"),
});

export const Route = createFileRoute("/dashboard/pki")({
  validateSearch: (search) => pkiSearchSchema.parse(search),
  loaderDeps: ({ search: { tab } }) => ({ tab }),
  loader: async ({ context: { queryClient } }) => {
    // Prefetch all data to ensure tabs are snappy
    await Promise.all([
      queryClient.ensureQueryData({ queryKey: queryKeys.pkiRoot(), queryFn: getPKIRoot, staleTime: 60_000 }),
      queryClient.ensureQueryData({ queryKey: queryKeys.pkiSshRoot(), queryFn: getPKISSHRoot, staleTime: 60_000 }),
      queryClient.ensureQueryData({ queryKey: queryKeys.pkiCerts(), queryFn: listPKICerts, staleTime: 15_000 }),
      queryClient.ensureQueryData({ queryKey: queryKeys.pkiSshCerts(), queryFn: listPKISSHCerts, staleTime: 15_000 }),
    ]);
  },
  component: PKIPage
});

function PKIPage() {
  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();
  const { tab } = Route.useSearch();

  const root = useQuery({ queryKey: queryKeys.pkiRoot(), queryFn: getPKIRoot, staleTime: 60_000 });
  const sshRoot = useQuery({ queryKey: queryKeys.pkiSshRoot(), queryFn: getPKISSHRoot, staleTime: 60_000 });
  const certs = useQuery({ queryKey: queryKeys.pkiCerts(), queryFn: listPKICerts, staleTime: 15_000 });
  const sshCerts = useQuery({ queryKey: queryKeys.pkiSshCerts(), queryFn: listPKISSHCerts, staleTime: 15_000 });

  const [commonName, setCommonName] = useState("");
  const [sshPrincipals, setSshPrincipals] = useState("");

  const handleTabChange = (value: string) => {
    navigate({
      search: (prev) => ({ ...prev, tab: value as any }),
      replace: true,
    });
  };

  const issueTLS = useMutation({
    mutationFn: async () => {
      const cn = commonName.trim();
      if (!cn) throw new Error("Common name is required");
      return issuePKICert({ commonName: cn } as any);
    },
    onSuccess: async () => {
      setCommonName("");
      toast.success("TLS Certificate Issued", { description: "Download ready." });
      await queryClient.invalidateQueries({ queryKey: queryKeys.pkiCerts() });
    },
    onError: (e) => {
      toast.error("Failed to issue TLS certificate", { description: (e as Error).message });
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
      toast.success("SSH Certificate Issued", { description: "Download ready." });
      await queryClient.invalidateQueries({ queryKey: queryKeys.pkiSshCerts() });
    },
    onError: (e) => {
      toast.error("Failed to issue SSH certificate", { description: (e as Error).message });
    }
  });

  const tlsRows = certs.data?.certs ?? [];
  const sshRows = sshCerts.data?.certs ?? [];

  const sshCaKey = useMemo(() => sshRoot.data?.publicKey ?? "", [sshRoot.data?.publicKey]);
  const caPem = useMemo(() => root.data?.pem ?? "", [root.data?.pem]);

  return (
    <div className="space-y-6 p-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>PKI Management</CardTitle>
              <CardDescription>Issue and manage TLS and SSH certificates signed by Skyforge.</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tls" className="gap-2">
              <Lock className="h-4 w-4" />
              TLS Certificates
            </TabsTrigger>
            <TabsTrigger value="ssh" className="gap-2">
              <Key className="h-4 w-4" />
              SSH Certificates
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tls" className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">CA Root Certificate</CardTitle>
                <CardDescription>Trust this PEM for Skyforge-issued TLS certs.</CardDescription>
              </CardHeader>
              <CardContent>
                {root.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <textarea 
                    className="h-40 w-full rounded-md border bg-muted p-2 font-mono text-[10px] text-muted-foreground focus:outline-none" 
                    readOnly 
                    value={caPem} 
                  />
                )}
                {root.isError && <div className="mt-2 text-xs text-destructive">Failed to load CA root.</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Issue New TLS Certificate</CardTitle>
                <CardDescription>Create a short-lived certificate for internal services.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="common-name">Common name (CN)</Label>
                  <Input
                    id="common-name"
                    value={commonName}
                    onChange={(e) => setCommonName(e.target.value)}
                    placeholder="e.g. service.internal"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={issueTLS.isPending}
                  onClick={() => issueTLS.mutate()}
                >
                  {issueTLS.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  {issueTLS.isPending ? "Generating…" : "Issue Certificate"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Issued TLS Certificates</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {certs.isLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : tlsRows.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No TLS certificates"
                  description="You haven't issued any TLS certificates yet."
                />
              ) : (
                <TableWrapper className="border-none">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Common Name</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tlsRows.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.commonName}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{c.expiresAt}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={`${SKYFORGE_API}/pki/certs/${encodeURIComponent(c.id)}/download`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Download className="mr-2 h-3 w-3" />
                                Download Bundle
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrapper>
              )}
              {certs.isError && <div className="p-4 text-center text-xs text-destructive">Failed to list certs.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ssh" className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">SSH CA Public Key</CardTitle>
                <CardDescription>Trust this key for Skyforge-issued SSH certs.</CardDescription>
              </CardHeader>
              <CardContent>
                {sshRoot.isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <textarea 
                    className="h-40 w-full rounded-md border bg-muted p-2 font-mono text-[10px] text-muted-foreground focus:outline-none" 
                    readOnly 
                    value={sshCaKey} 
                  />
                )}
                {sshRoot.isError && <div className="mt-2 text-xs text-destructive">Failed to load SSH CA key.</div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Issue New SSH Certificate</CardTitle>
                <CardDescription>Authorize keys for specific principals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="principals">Principals (comma separated)</Label>
                  <Input
                    id="principals"
                    value={sshPrincipals}
                    onChange={(e) => setSshPrincipals(e.target.value)}
                    placeholder="e.g. root, ubuntu, admin"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={issueSSH.isPending}
                  onClick={() => issueSSH.mutate()}
                >
                   {issueSSH.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  {issueSSH.isPending ? "Generating…" : "Issue Certificate"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Issued SSH Certificates</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sshCerts.isLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : sshRows.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No SSH certificates"
                  description="You haven't issued any SSH certificates yet."
                />
              ) : (
                <TableWrapper className="border-none">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Principals</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sshRows.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">
                            {c.principals.map((p: string) => (
                              <span key={p} className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground mr-1">
                                {p}
                              </span>
                            ))}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{c.expiresAt}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={`${SKYFORGE_API}/pki/ssh/certs/${encodeURIComponent(c.id)}/download`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Download className="mr-2 h-3 w-3" />
                                Download Bundle
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableWrapper>
              )}
              {sshCerts.isError && <div className="p-4 text-center text-xs text-destructive">Failed to list SSH certs.</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
