import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { queryKeys } from "../../lib/query-keys";
import {
  createUserForwardCollectorConfig,
  deleteUserForwardCollectorConfig,
  getUserForwardCollectorConfigLogs,
  getUserGitCredentials,
  listUserForwardCollectorConfigs,
  restartUserForwardCollectorConfig,
  type UserForwardCollectorConfigSummary,
} from "../../lib/skyforge-api";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

export const Route = createFileRoute("/dashboard/forward")({
  component: ForwardCollectorPage,
});

type ForwardTarget = "cloud" | "onprem";

function normalizeBaseURL(target: ForwardTarget, onPremHost: string): string {
  if (target === "cloud") return "https://fwd.app";
  const raw = onPremHost.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function ForwardCollectorPage() {
  const queryClient = useQueryClient();
  const collectorsKey = queryKeys.userForwardCollectorConfigs();

  const collectorsQ = useQuery({
    queryKey: collectorsKey,
    queryFn: listUserForwardCollectorConfigs,
    refetchInterval: 5000,
    staleTime: 10_000,
    retry: false,
  });

  const collectors = useMemo(
    () => ((collectorsQ.data?.collectors ?? []) as UserForwardCollectorConfigSummary[]),
    [collectorsQ.data?.collectors]
  );

  const [showLogsId, setShowLogsId] = useState<string>("");
  const logsQ = useQuery({
    queryKey: queryKeys.userForwardCollectorConfigLogs(showLogsId),
    queryFn: async () => getUserForwardCollectorConfigLogs(showLogsId, 300),
    enabled: !!showLogsId,
    refetchInterval: showLogsId ? 3000 : false,
    retry: false,
  });

  const [target, setTarget] = useState<ForwardTarget>("cloud");
  const [onPremHost, setOnPremHost] = useState("");
  const [skipTlsVerify, setSkipTlsVerify] = useState(true);
  const [collectorName, setCollectorName] = useState("");
  const [collectorNameTouched, setCollectorNameTouched] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [setDefault, setSetDefault] = useState(true);

  const userGitQ = useQuery({
    queryKey: queryKeys.userGitCredentials(),
    queryFn: getUserGitCredentials,
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (target === "cloud") setSkipTlsVerify(false);
    else setSkipTlsVerify(true);
  }, [target]);

  useEffect(() => {
    if (collectorNameTouched) return;
    if (collectorName.trim()) return;
    const u = (userGitQ.data?.username ?? "").trim();
    if (!u) return;
    setCollectorName(`skyforge-${u}`);
  }, [collectorNameTouched, collectorName, userGitQ.data?.username]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const name = collectorName.trim();
      if (!name) throw new Error("Collector name is required");
      const baseUrl = normalizeBaseURL(target, onPremHost);
      if (!baseUrl) throw new Error("Forward URL is required");
      if (!username.trim() || !password.trim()) throw new Error("Forward username/password are required");
      return createUserForwardCollectorConfig({
        name,
        baseUrl,
        skipTlsVerify: target === "onprem" ? skipTlsVerify : false,
        username: username.trim(),
        password,
        setDefault,
      });
    },
    onSuccess: async () => {
      toast.success("Collector created");
      setPassword("");
      await queryClient.invalidateQueries({ queryKey: collectorsKey });
    },
    onError: (e) => toast.error("Failed to create collector", { description: (e as Error).message }),
  });

  const restartMutation = useMutation({
    mutationFn: async (id: string) => restartUserForwardCollectorConfig(id),
    onSuccess: async () => {
      toast.success("Collector restarted");
      await queryClient.invalidateQueries({ queryKey: collectorsKey });
    },
    onError: (e) => toast.error("Failed to restart collector", { description: (e as Error).message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteUserForwardCollectorConfig(id),
    onSuccess: async (_data, id) => {
      toast.success("Collector deleted");
      setShowLogsId("");
      queryClient.setQueryData(collectorsKey, (prev: any) => {
        const prevCollectors = (prev?.collectors ?? []) as UserForwardCollectorConfigSummary[];
        return { ...(prev ?? {}), collectors: prevCollectors.filter((c) => String(c?.id ?? "") !== String(id)) };
      });
      await queryClient.invalidateQueries({ queryKey: collectorsKey });
    },
    onError: (e) => toast.error("Failed to delete collector", { description: (e as Error).message }),
  });

  const deleteAllMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await deleteUserForwardCollectorConfig(id);
      }
    },
    onSuccess: async () => {
      toast.success("Collectors deleted");
      setShowLogsId("");
      queryClient.setQueryData(collectorsKey, (prev: any) => ({ ...(prev ?? {}), collectors: [] }));
      await queryClient.invalidateQueries({ queryKey: collectorsKey });
    },
    onError: (e) => toast.error("Failed to delete collectors", { description: (e as Error).message }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Collector</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create one or more per-user in-cluster Forward collectors. Select a collector per deployment.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create collector</CardTitle>
          <CardDescription>
            Creates a Forward collector and deploys a matching in-cluster Deployment. Deleting here only deletes the in-cluster
            Deployment and the saved credentials; it does not delete the Forward-side collector.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Collector name</Label>
            <Input
              value={collectorName}
              onChange={(e) => {
                setCollectorNameTouched(true);
                setCollectorName(e.target.value);
              }}
              placeholder="skyforge-yourname"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Forward target</Label>
              <Select value={target} onValueChange={(v) => setTarget(v as ForwardTarget)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cloud">fwd.app (cloud)</SelectItem>
                  <SelectItem value="onprem">on-prem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {target === "onprem" ? (
              <div className="space-y-2">
                <Label>On-prem host</Label>
                <Input value={onPremHost} onChange={(e) => setOnPremHost(e.target.value)} placeholder="forward.example.com (:port)" />
              </div>
            ) : null}
          </div>

          {target === "onprem" ? (
            <div className="flex items-center gap-2">
              <Checkbox checked={skipTlsVerify} onCheckedChange={(v) => setSkipTlsVerify(Boolean(v))} />
              <Label className="text-sm">Skip TLS verification</Label>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Forward username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="you@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Forward password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={setDefault} onCheckedChange={(v) => setSetDefault(Boolean(v))} />
            <Label className="text-sm">Make default</Label>
          </div>

          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Create"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Configured collectors</CardTitle>
            {collectors.length > 0 ? (
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteAllMutation.isPending}
                onClick={() => {
                  const ids = collectors.map((c) => String(c.id)).filter(Boolean);
                  if (ids.length === 0) return;
                  if (!confirm(`Delete ${ids.length} collector(s)? This removes in-cluster Deployments and saved credentials.`)) return;
                  deleteAllMutation.mutate(ids);
                }}
              >
                {deleteAllMutation.isPending ? "Deleting…" : "Delete all"}
              </Button>
            ) : null}
          </div>
          <CardDescription>Each entry maps to one in-cluster Deployment and one Forward collector.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {collectorsQ.isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : null}
          {collectorsQ.isError ? (
            <div className="text-sm text-destructive">Failed to load collectors.</div>
          ) : collectors.length === 0 ? (
            <div className="text-sm text-muted-foreground">No collectors configured yet.</div>
          ) : null}

          {collectors.map((c) => {
            const ready = Boolean(c.runtime?.ready);
            const connected =
              typeof c.forwardCollector?.connected === "boolean" ? c.forwardCollector.connected : undefined;

            return (
              <div key={c.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="font-medium truncate">{c.name}</div>
                      {c.isDefault ? <Badge variant="secondary">default</Badge> : null}
                      {c.decryptionFailed ? <Badge variant="destructive">re-save creds</Badge> : null}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{c.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLogsId((prev) => (prev === c.id ? "" : c.id))}
                    >
                      {showLogsId === c.id ? "Hide logs" : "Logs"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restartMutation.mutate(c.id)}
                      disabled={restartMutation.isPending}
                    >
                      Restart
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (!confirm(`Delete collector "${c.name}"?`)) return;
                        deleteMutation.mutate(c.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="text-sm">
                  Status:{" "}
                  <span className={ready ? "text-emerald-600" : "text-muted-foreground"}>
                    {ready ? "Running" : "Starting…"}
                  </span>
                </div>
                <div className="text-sm">
                  Forward:{" "}
                  {typeof connected === "boolean" ? (
                    <span className={connected ? "text-emerald-600" : "text-muted-foreground"}>
                      {connected ? "Connected" : "Not connected"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </div>

                {c.forwardCollector?.version ? (
                  <div className="text-xs text-muted-foreground">
                    Version: <span className="font-mono">{String(c.forwardCollector.version)}</span>
                  </div>
                ) : null}
                {c.forwardCollector?.updateStatus ? (
                  <div className="text-xs text-muted-foreground">
                    Update: <span className="font-mono">{String(c.forwardCollector.updateStatus)}</span>
                  </div>
                ) : null}
                {c.forwardCollector?.externalIp ? (
                  <div className="text-xs text-muted-foreground">
                    External IP: <span className="font-mono">{String(c.forwardCollector.externalIp)}</span>
                  </div>
                ) : null}
                {Array.isArray(c.forwardCollector?.internalIps) && (c.forwardCollector?.internalIps ?? []).length > 0 ? (
                  <div className="text-xs text-muted-foreground">
                    Internal IPs:{" "}
                    <span className="font-mono">{(c.forwardCollector?.internalIps ?? []).filter(Boolean).join(", ")}</span>
                  </div>
                ) : null}
                {c.runtime?.podName ? (
                  <div className="text-xs text-muted-foreground">
                    Pod: <span className="font-mono">{String(c.runtime.podName)}</span> ({String(c.runtime.podPhase ?? "")})
                  </div>
                ) : null}

                {showLogsId === c.id ? (
                  <pre className="bg-muted p-3 rounded-md overflow-auto font-mono text-xs whitespace-pre-wrap">
                    {logsQ.isLoading ? "Loading…" : (logsQ.data?.logs ?? "").trim() || "No logs yet."}
                  </pre>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
