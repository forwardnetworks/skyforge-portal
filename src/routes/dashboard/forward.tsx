import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { queryKeys } from "../../lib/query-keys";
import {
  clearUserForwardCollector,
  getUserCollectorLogs,
  getUserCollectorRuntime,
  getUserForwardCollector,
  putUserForwardCollector,
  resetUserForwardCollector,
  restartUserCollector,
  type PutUserForwardCollectorRequest,
} from "../../lib/skyforge-api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";

export const Route = createFileRoute("/dashboard/forward")({
  component: ForwardCollectorPage,
});

type ForwardTarget = "cloud" | "onprem";

function ForwardCollectorPage() {
  const queryClient = useQueryClient();

  const cfgQ = useQuery({
    queryKey: queryKeys.userForwardCollector(),
    queryFn: getUserForwardCollector,
  });

  const runtimeQ = useQuery({
    queryKey: queryKeys.userCollectorRuntime(),
    queryFn: getUserCollectorRuntime,
    enabled: !!cfgQ.data?.authorizationKey,
    refetchInterval: 5000,
  });

  const [showLogs, setShowLogs] = useState(false);
  const logsQ = useQuery({
    queryKey: queryKeys.userCollectorLogs(),
    queryFn: async () => getUserCollectorLogs(300),
    enabled: showLogs && !!cfgQ.data?.authorizationKey,
    refetchInterval: showLogs ? 3000 : false,
  });

  const cfg = cfgQ.data;
  const runtime = (runtimeQ.data?.runtime ?? cfg?.runtime) as any;
  const fwdCollector = (cfg as any)?.forwardCollector as
    | {
        connected?: boolean;
        status?: string;
        lastConnectedAt?: string;
        lastSeenAt?: string;
        version?: string;
        updateStatus?: string;
        externalIp?: string;
        internalIps?: string[];
      }
    | undefined;

  const [target, setTarget] = useState<ForwardTarget>("cloud");
  const [onPremHost, setOnPremHost] = useState("");
  const [skipTlsVerify, setSkipTlsVerify] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!cfg) return;
    const configuredBase = (cfg.baseUrl ?? "https://fwd.app").trim();
    if (configuredBase && configuredBase !== "https://fwd.app") {
      setTarget("onprem");
      setOnPremHost(configuredBase.replace(/^https?:\/\//, ""));
      setSkipTlsVerify(cfg.skipTlsVerify ?? true);
    } else {
      setTarget("cloud");
      setOnPremHost("");
      setSkipTlsVerify(cfg.skipTlsVerify ?? false);
    }
    setUsername(cfg.username ?? "");
  }, [cfg]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const baseUrl = target === "cloud" ? "https://fwd.app" : onPremHost.trim();
      const body: PutUserForwardCollectorRequest = {
        baseUrl,
        skipTlsVerify: target === "onprem" ? skipTlsVerify : false,
        username,
        password,
      };
      return putUserForwardCollector(body);
    },
    onSuccess: async () => {
      toast.success("Collector configured");
      setPassword("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.userForwardCollector() });
    },
    onError: (e) => toast.error("Failed to save Forward collector", { description: (e as Error).message }),
  });

  const resetMutation = useMutation({
    mutationFn: resetUserForwardCollector,
    onSuccess: async () => {
      toast.success("Collector reset requested");
      await queryClient.invalidateQueries({ queryKey: queryKeys.userForwardCollector() });
    },
    onError: (e) => toast.error("Failed to reset collector", { description: (e as Error).message }),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await clearUserForwardCollector();
    },
    onSuccess: async () => {
      toast.success("Forward collector cleared");
      await queryClient.invalidateQueries({ queryKey: queryKeys.userForwardCollector() });
    },
    onError: (e) => toast.error("Failed to clear collector", { description: (e as Error).message }),
  });

  const restartMutation = useMutation({
    mutationFn: restartUserCollector,
    onSuccess: async () => {
      toast.success("Collector restarted", { description: "Pulling latest image (if available)..." });
      await queryClient.invalidateQueries({ queryKey: queryKeys.userCollectorRuntime() });
    },
    onError: (e) => toast.error("Failed to restart collector", { description: (e as Error).message }),
  });

  const authKey = (cfg?.authorizationKey ?? "").trim();
  const isReady = !!runtime?.ready;
  const logs = (logsQ.data?.logs ?? "").trim();
  const forwardConnected =
    typeof fwdCollector?.connected === "boolean"
      ? fwdCollector.connected
      : typeof fwdCollector?.status === "string"
        ? String(fwdCollector.status).toLowerCase().includes("connect")
        : undefined;

  return (
    <div className="space-y-6 p-6">
      <div className="border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Collector</h1>
        <p className="text-sm text-muted-foreground">
          Stores your Forward credentials and provisions a per-user collector named <span className="font-mono">skyforge-{"{user}"}</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collector status</CardTitle>
          <CardDescription>Runs as a per-user Deployment inside the cluster.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {cfgQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : cfgQ.isError ? (
            <div className="text-sm text-destructive">Failed to load Forward collector settings.</div>
          ) : authKey ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Collector: <span className="font-mono">{cfg?.collectorUsername ?? ""}</span> ({cfg?.collectorId ?? ""})
              </div>
              <div className="text-sm">
                Status:{" "}
                <span className={isReady ? "text-emerald-600" : "text-muted-foreground"}>
                  {isReady ? "Running" : "Starting…"}
                </span>
              </div>
              {typeof forwardConnected === "boolean" ? (
                <div className="text-sm">
                  Forward:{" "}
                  <span className={forwardConnected ? "text-emerald-600" : "text-muted-foreground"}>
                    {forwardConnected ? "Connected" : "Not connected"}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Forward: Unknown</div>
              )}
              {fwdCollector?.version ? (
                <div className="text-xs text-muted-foreground">
                  Forward version: <span className="font-mono">{String(fwdCollector.version)}</span>
                </div>
              ) : null}
              {fwdCollector?.updateStatus ? (
                <div className="text-xs text-muted-foreground">
                  Forward update: <span className="font-mono">{String(fwdCollector.updateStatus)}</span>
                </div>
              ) : null}
              {fwdCollector?.externalIp ? (
                <div className="text-xs text-muted-foreground">
                  External IP: <span className="font-mono">{String(fwdCollector.externalIp)}</span>
                </div>
              ) : null}
              {Array.isArray(fwdCollector?.internalIps) && fwdCollector!.internalIps!.length > 0 ? (
                <div className="text-xs text-muted-foreground">
                  Internal IPs:{" "}
                  <span className="font-mono">{(fwdCollector!.internalIps ?? []).filter(Boolean).join(", ")}</span>
                </div>
              ) : null}
              {runtime?.podName ? (
                <div className="text-xs text-muted-foreground">
                  Pod: <span className="font-mono">{String(runtime.podName)}</span> ({String(runtime.podPhase ?? "")})
                </div>
              ) : null}
              {typeof runtime?.restartCount === "number" && runtime.restartCount > 0 ? (
                <div className="text-xs text-muted-foreground">
                  Restarts: <span className="font-mono">{String(runtime.restartCount)}</span>
                  {runtime?.lastReason ? (
                    <>
                      {" "}
                      (last: <span className="font-mono">{String(runtime.lastReason)}</span>
                      {typeof runtime?.lastExitCode === "number" ? (
                        <>
                          {" "}
                          code <span className="font-mono">{String(runtime.lastExitCode)}</span>
                        </>
                      ) : null}
                      )
                    </>
                  ) : null}
                </div>
              ) : null}
              {runtime?.image ? (
                <div className="text-xs text-muted-foreground">
                  Image: <span className="font-mono">{String(runtime.image)}</span>
                </div>
              ) : null}
              {runtime?.updateStatus ? (
                <div className="text-xs text-muted-foreground">
                  Update check:{" "}
                  <span className="font-mono">
                    {String(runtime.updateStatus)}
                    {runtime.updateAvailable ? " (update available)" : ""}
                  </span>
                </div>
              ) : null}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Logs</div>
                  <Button variant="outline" size="sm" onClick={() => setShowLogs((v) => !v)}>
                    {showLogs ? "Hide" : "Show"}
                  </Button>
                </div>
                {showLogs ? (
                  <pre className="bg-muted p-3 rounded-md overflow-auto font-mono text-xs whitespace-pre-wrap">
                    {logsQ.isLoading ? "Loading…" : logs || "No logs yet."}
                  </pre>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Not configured yet.</div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!authKey || restartMutation.isPending}
              onClick={() => restartMutation.mutate()}
            >
              {restartMutation.isPending ? "Restarting…" : "Restart (pull latest)"}
            </Button>
            <Button
              variant="outline"
              disabled={!authKey || resetMutation.isPending}
              onClick={() => resetMutation.mutate()}
            >
              {resetMutation.isPending ? "Resetting…" : "Reset collector"}
            </Button>
            <Button
              variant="destructive"
              disabled={!authKey || clearMutation.isPending}
              onClick={() => {
                if (!window.confirm("Deprovision collector? This deletes your stored Forward credentials and removes the in-cluster collector deployment.")) {
                  return;
                }
                clearMutation.mutate();
              }}
            >
              {clearMutation.isPending ? "Deprovisioning…" : "Deprovision"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forward credentials</CardTitle>
          <CardDescription>Used to create your per-user collector token in Forward.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Forward target</Label>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <input
                  id="forward-cloud"
                  type="radio"
                  name="forward-target"
                  className="h-4 w-4"
                  checked={target === "cloud"}
                  onChange={() => setTarget("cloud")}
                />
                <Label htmlFor="forward-cloud">Forward Cloud (https://fwd.app)</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="forward-onprem"
                  type="radio"
                  name="forward-target"
                  className="h-4 w-4"
                  checked={target === "onprem"}
                  onChange={() => setTarget("onprem")}
                />
                <Label htmlFor="forward-onprem">On-prem (enter IP/DNS)</Label>
              </div>
            </div>
            {target === "onprem" ? (
              <div className="space-y-2 pt-2">
                <div className="grid gap-2">
                  <Label>On-prem host</Label>
                  <Input
                    value={onPremHost}
                    onChange={(e) => setOnPremHost(e.target.value)}
                    placeholder="10.0.0.10 or forward.example.com"
                  />
                  <div className="text-xs text-muted-foreground">
                    Skyforge assumes <span className="font-mono">https://</span> unless you include a scheme.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={skipTlsVerify}
                    onCheckedChange={(v) => setSkipTlsVerify(Boolean(v))}
                    id="forward-skip-tls"
                  />
                  <Label htmlFor="forward-skip-tls">Skip TLS verification (default)</Label>
                </div>
              </div>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label>Forward username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="grid gap-2">
            <Label>Forward password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
            <div className="text-xs text-muted-foreground">Leave blank to keep existing password.</div>
          </div>

          <div className="flex justify-end">
            <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
