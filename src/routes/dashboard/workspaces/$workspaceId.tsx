import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getWorkspaces,
  type SkyforgeWorkspace,
  updateWorkspaceMembers,
  updateWorkspaceSettings,
  getWorkspaceForwardConfig,
  putWorkspaceForwardConfig,
  listWorkspaceForwardCollectors,
} from "../../../lib/skyforge-api";
import { queryKeys } from "../../../lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { Input } from "../../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Skeleton } from "../../../components/ui/skeleton";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";

export const Route = createFileRoute("/dashboard/workspaces/$workspaceId")({
  component: WorkspaceSettingsPage,
});

function WorkspaceSettingsPage() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const workspacesQ = useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: getWorkspaces,
  });

  const workspace = useMemo(() => {
    const ws = (workspacesQ.data?.workspaces ?? []) as SkyforgeWorkspace[];
    return ws.find((w) => w.id === workspaceId) ?? null;
  }, [workspacesQ.data, workspaceId]);

  const [viewersCSV, setViewersCSV] = useState("");
  const [ownersCSV, setOwnersCSV] = useState("");
  const [editorsCSV, setEditorsCSV] = useState("");

  const [allowExternalTemplateRepos, setAllowExternalTemplateRepos] = useState(false);
  const [allowCustomEveServers, setAllowCustomEveServers] = useState(false);
  const [allowCustomNetlabServers, setAllowCustomNetlabServers] = useState(false);
  const [externalReposText, setExternalReposText] = useState("");

  const [forwardBaseURL, setForwardBaseURL] = useState("");
  const [forwardUsername, setForwardUsername] = useState("");
  const [forwardPassword, setForwardPassword] = useState("");
  const [forwardCollectorId, setForwardCollectorId] = useState("");
  const [forwardCollectorUsername, setForwardCollectorUsername] = useState("");
  const [forwardJumpPrivateKey, setForwardJumpPrivateKey] = useState("");
  const [forwardJumpCert, setForwardJumpCert] = useState("");

  const forwardQ = useQuery({
    queryKey: queryKeys.workspaceForwardConfig(workspaceId),
    queryFn: () => getWorkspaceForwardConfig(workspaceId),
    enabled: !!workspaceId,
  });

  const collectorsQ = useQuery({
    queryKey: queryKeys.workspaceForwardCollectors(workspaceId),
    queryFn: () => listWorkspaceForwardCollectors(workspaceId),
    enabled: !!workspaceId,
  });

  // Initialize local state once workspace loads
  useMemo(() => {
    if (!workspace) return;
    setOwnersCSV((workspace.owners ?? []).join(","));
    setEditorsCSV((workspace.editors ?? []).join(","));
    setViewersCSV((workspace.viewers ?? []).join(","));
    setAllowExternalTemplateRepos(!!workspace.allowExternalTemplateRepos);
    setAllowCustomEveServers(!!workspace.allowCustomEveServers);
    setAllowCustomNetlabServers(!!workspace.allowCustomNetlabServers);
    setExternalReposText(JSON.stringify(workspace.externalTemplateRepos ?? [], null, 2));
  }, [workspace]);

  useMemo(() => {
    if (!forwardQ.data) return;
    setForwardBaseURL(forwardQ.data.baseUrl ?? "");
    setForwardUsername(forwardQ.data.username ?? "");
    setForwardCollectorId(forwardQ.data.collectorId ?? "");
  }, [forwardQ.data]);

  const membersMutation = useMutation({
    mutationFn: async (next: { isPublic: boolean; owners: string[]; editors: string[]; viewers: string[] }) => {
      return updateWorkspaceMembers(workspaceId, {
        isPublic: next.isPublic,
        owners: next.owners,
        ownerGroups: workspace?.ownerGroups ?? [],
        editors: next.editors,
        editorGroups: workspace?.editorGroups ?? [],
        viewers: next.viewers,
        viewerGroups: workspace?.viewerGroups ?? [],
      });
    },
    onSuccess: async () => {
      toast.success("Workspace updated");
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
    },
    onError: (e) => toast.error("Failed to update workspace", { description: (e as Error).message }),
  });

  const settingsMutation = useMutation({
    mutationFn: async (next: {
      allowExternalTemplateRepos: boolean;
      allowCustomEveServers: boolean;
      allowCustomNetlabServers: boolean;
      externalTemplateRepos: unknown;
    }) => {
      return updateWorkspaceSettings(workspaceId, {
        allowExternalTemplateRepos: next.allowExternalTemplateRepos,
        allowCustomEveServers: next.allowCustomEveServers,
        allowCustomNetlabServers: next.allowCustomNetlabServers,
        externalTemplateRepos: (next.externalTemplateRepos as any[]) ?? [],
      });
    },
    onSuccess: async () => {
      toast.success("Workspace feature flags updated");
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
    },
    onError: (e) => toast.error("Failed to update settings", { description: (e as Error).message }),
  });

  const forwardMutation = useMutation({
    mutationFn: async () => {
      return putWorkspaceForwardConfig(workspaceId, {
        baseUrl: forwardBaseURL,
        username: forwardUsername,
        password: forwardPassword,
        collectorId: forwardCollectorId,
        collectorUsername: forwardCollectorUsername,
        jumpPrivateKey: forwardJumpPrivateKey,
        jumpCert: forwardJumpCert,
      });
    },
    onSuccess: async () => {
      toast.success("Forward integration updated");
      setForwardPassword("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaceForwardConfig(workspaceId) });
    },
    onError: (e) => toast.error("Failed to update Forward config", { description: (e as Error).message }),
  });

  const parseCSV = (s: string) =>
    s
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

  if (workspacesQ.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-sm text-muted-foreground">Workspace not found.</div>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/workspaces" })}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{workspace.name}</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{workspace.slug}</span>{" "}
            <Badge variant={workspace.isPublic ? "default" : "secondary"}>{workspace.isPublic ? "Public" : "Private"}</Badge>
          </div>
        </div>
        <Link to="/dashboard/deployments" search={{ workspace: workspace.id }}>
          <Button variant="outline">Back to deployments</Button>
        </Link>
      </div>

      <Tabs defaultValue="access" className="space-y-6">
        <TabsList>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="forward">Forward</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
              <CardDescription>BYOS Netlab via `topologyUrl` requires public access to the selected topology.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Public workspace</Label>
                <div className="text-xs text-muted-foreground">Controls Gitea repo visibility and template accessibility.</div>
              </div>
              <Switch
                checked={!!workspace.isPublic}
                onCheckedChange={(checked) => {
                  const owners = parseCSV(ownersCSV);
                  membersMutation.mutate({ isPublic: checked, owners, editors: parseCSV(editorsCSV), viewers: parseCSV(viewersCSV) });
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>Comma-separated usernames. (Groups are not editable here yet.)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Owners</Label>
                <Input value={ownersCSV} onChange={(e) => setOwnersCSV(e.target.value)} placeholder="alice,bob" />
              </div>
              <div className="space-y-1">
                <Label>Editors</Label>
                <Input value={editorsCSV} onChange={(e) => setEditorsCSV(e.target.value)} placeholder="alice,bob" />
              </div>
              <div className="space-y-1">
                <Label>Viewers</Label>
                <Input value={viewersCSV} onChange={(e) => setViewersCSV(e.target.value)} placeholder="alice,bob" />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="default"
                  disabled={membersMutation.isPending}
                  onClick={() =>
                    membersMutation.mutate({
                      isPublic: !!workspace.isPublic,
                      owners: parseCSV(ownersCSV),
                      editors: parseCSV(editorsCSV),
                      viewers: parseCSV(viewersCSV),
                    })
                  }
                >
                  {membersMutation.isPending ? "Saving…" : "Save members"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace feature flags</CardTitle>
              <CardDescription>Enable template repo sources and BYOS server support for this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow external template repos</Label>
                  <div className="text-xs text-muted-foreground">Expose user-defined repo sources in the deployment UI.</div>
                </div>
                <Switch checked={allowExternalTemplateRepos} onCheckedChange={setAllowExternalTemplateRepos} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow custom EVE servers</Label>
                  <div className="text-xs text-muted-foreground">Enable BYOS EVE servers per workspace.</div>
                </div>
                <Switch checked={allowCustomEveServers} onCheckedChange={setAllowCustomEveServers} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow custom Netlab servers</Label>
                  <div className="text-xs text-muted-foreground">Enable BYOS Netlab API servers per workspace.</div>
                </div>
                <Switch checked={allowCustomNetlabServers} onCheckedChange={setAllowCustomNetlabServers} />
              </div>

              <div className="space-y-1">
                <Label>External template repos (JSON)</Label>
                <div className="text-xs text-muted-foreground">
                  Array of {`{ id, name, repo, defaultBranch }`} objects. Saved only when external repos are enabled.
                </div>
                <textarea
                  className="w-full min-h-[160px] rounded-md border bg-background p-3 font-mono text-xs"
                  value={externalReposText}
                  onChange={(e) => setExternalReposText(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="default"
                  disabled={settingsMutation.isPending}
                  onClick={() => {
                    let parsed: unknown = [];
                    try {
                      parsed = JSON.parse(externalReposText || "[]");
                    } catch (e) {
                      toast.error("External repos JSON is invalid");
                      return;
                    }
                    settingsMutation.mutate({
                      allowExternalTemplateRepos,
                      allowCustomEveServers,
                      allowCustomNetlabServers,
                      externalTemplateRepos: parsed,
                    });
                  }}
                >
                  {settingsMutation.isPending ? "Saving…" : "Save settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forward" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Forward integration</CardTitle>
              <CardDescription>Credentials and jump host material used for device onboarding and sync.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {forwardQ.isError ? <div className="text-sm text-destructive">Failed to load Forward config.</div> : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Base URL</Label>
                  <Input value={forwardBaseURL} onChange={(e) => setForwardBaseURL(e.target.value)} placeholder="https://fwd.app" />
                </div>
                <div className="space-y-1">
                  <Label>Username</Label>
                  <Input value={forwardUsername} onChange={(e) => setForwardUsername(e.target.value)} placeholder="you@company.com" />
                </div>
                <div className="space-y-1">
                  <Label>Password</Label>
                  <Input value={forwardPassword} onChange={(e) => setForwardPassword(e.target.value)} placeholder={forwardQ.data?.hasPassword ? "(unchanged)" : ""} type="password" />
                </div>
                <div className="space-y-1">
                  <Label>Collector</Label>
                  <Select value={forwardCollectorId} onValueChange={setForwardCollectorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select collector" />
                    </SelectTrigger>
                    <SelectContent>
                      {(collectorsQ.data?.collectors ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Collector username</Label>
                  <Input value={forwardCollectorUsername} onChange={(e) => setForwardCollectorUsername(e.target.value)} placeholder="collector-user" />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Jump private key (optional)</Label>
                <textarea className="w-full min-h-[120px] rounded-md border bg-background p-3 font-mono text-xs" value={forwardJumpPrivateKey} onChange={(e) => setForwardJumpPrivateKey(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Jump cert (optional)</Label>
                <textarea className="w-full min-h-[120px] rounded-md border bg-background p-3 font-mono text-xs" value={forwardJumpCert} onChange={(e) => setForwardJumpCert(e.target.value)} />
              </div>

              <div className="flex justify-end">
                <Button variant="default" disabled={forwardMutation.isPending} onClick={() => forwardMutation.mutate()}>
                  {forwardMutation.isPending ? "Saving…" : "Save Forward config"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

