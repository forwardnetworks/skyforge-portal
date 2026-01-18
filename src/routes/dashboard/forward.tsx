import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { queryKeys } from "../../lib/query-keys";
import {
  clearUserForwardCollector,
  getUserForwardCollector,
  putUserForwardCollector,
  resetUserForwardCollector,
  type PutUserForwardCollectorRequest,
} from "../../lib/skyforge-api";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

export const Route = createFileRoute("/dashboard/forward")({
  component: ForwardCollectorPage,
});

function ForwardCollectorPage() {
  const queryClient = useQueryClient();

  const cfgQ = useQuery({
    queryKey: queryKeys.userForwardCollector(),
    queryFn: getUserForwardCollector,
  });

  const cfg = cfgQ.data;

  const [baseUrl, setBaseUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [deviceUsername, setDeviceUsername] = useState("");
  const [devicePassword, setDevicePassword] = useState("");
  const [jumpHost, setJumpHost] = useState("");
  const [jumpUsername, setJumpUsername] = useState("");
  const [jumpPrivateKey, setJumpPrivateKey] = useState("");
  const [jumpCert, setJumpCert] = useState("");

  useEffect(() => {
    if (!cfg) return;
    setBaseUrl(cfg.baseUrl ?? "https://fwd.app");
    setUsername(cfg.username ?? "");
  }, [cfg]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: PutUserForwardCollectorRequest = {
        baseUrl,
        username,
        password,
        deviceUsername,
        devicePassword,
        jumpHost,
        jumpUsername,
        jumpPrivateKey,
        jumpCert,
      };
      return putUserForwardCollector(body);
    },
    onSuccess: async () => {
      toast.success("Forward collector configured");
      setPassword("");
      setDevicePassword("");
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

  const authKey = (cfg?.authorizationKey ?? "").trim();

  return (
    <div className="space-y-6 p-6">
      <div className="border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight">Forward Collector</h1>
        <p className="text-sm text-muted-foreground">
          Stores your Forward credentials and provisions a per-user collector named <span className="font-mono">skyforge-{"{user}"}</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collector status</CardTitle>
          <CardDescription>Authorization key is used as the collector token.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {cfgQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : cfgQ.isError ? (
            <div className="text-sm text-destructive">Failed to load Forward collector settings.</div>
          ) : authKey ? (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Authorization key</div>
              <pre className="bg-muted p-3 rounded-md overflow-auto font-mono text-xs">{authKey}</pre>
              <div className="text-xs text-muted-foreground">
                Collector: <span className="font-mono">{cfg?.collectorUsername ?? ""}</span> ({cfg?.collectorId ?? ""})
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Not configured yet.</div>
          )}

          <div className="flex gap-2">
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
              onClick={() => clearMutation.mutate()}
            >
              {clearMutation.isPending ? "Clearing…" : "Clear"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
          <CardDescription>
            Used to create the collector via <span className="font-mono">POST /api/collectors</span> on your Forward instance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Forward base URL</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://fwd.app" />
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

          <div className="grid gap-2 pt-2">
            <Label>Device CLI username (optional)</Label>
            <Input value={deviceUsername} onChange={(e) => setDeviceUsername(e.target.value)} placeholder="admin" />
          </div>
          <div className="grid gap-2">
            <Label>Device CLI password (optional)</Label>
            <Input value={devicePassword} onChange={(e) => setDevicePassword(e.target.value)} type="password" placeholder="••••••••" />
          </div>

          <div className="grid gap-2 pt-2">
            <Label>SSH jump host (optional)</Label>
            <Input value={jumpHost} onChange={(e) => setJumpHost(e.target.value)} placeholder="jump.example.com:22" />
          </div>
          <div className="grid gap-2">
            <Label>SSH jump username (optional)</Label>
            <Input value={jumpUsername} onChange={(e) => setJumpUsername(e.target.value)} placeholder="ubuntu" />
          </div>
          <div className="grid gap-2">
            <Label>SSH jump private key (optional)</Label>
            <Textarea value={jumpPrivateKey} onChange={(e) => setJumpPrivateKey(e.target.value)} rows={6} placeholder="-----BEGIN OPENSSH PRIVATE KEY-----" />
          </div>
          <div className="grid gap-2">
            <Label>SSH jump certificate (optional)</Label>
            <Textarea value={jumpCert} onChange={(e) => setJumpCert(e.target.value)} rows={4} placeholder="ssh-ed25519-cert-v01@openssh.com AAAA..." />
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
