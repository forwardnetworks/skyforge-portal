import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getSession,
  getWorkspaces,
  type SkyforgeWorkspace,
  deleteWorkspace,
  updateWorkspaceMembers,
  updateWorkspaceSettings,
  listWorkspaceNetlabServers,
  upsertWorkspaceNetlabServer,
  deleteWorkspaceNetlabServer,
  listWorkspaceEveServers,
  upsertWorkspaceEveServer,
  deleteWorkspaceEveServer,
  getUserGitCredentials,
  updateUserGitCredentials,
  rotateUserGitDeployKey,
} from "../../../lib/skyforge-api";
import { queryKeys } from "../../../lib/query-keys";
import { canDeleteWorkspace, canEditWorkspace, workspaceAccess } from "../../../lib/workspace-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { Input } from "../../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Skeleton } from "../../../components/ui/skeleton";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { Textarea } from "../../../components/ui/textarea";
import { WorkspaceVariableGroups } from "../../../components/workspace-variable-groups";

export const Route = createFileRoute("/dashboard/workspaces/$workspaceId")({
  component: WorkspaceSettingsPage,
});

type ExternalRepoDraft = {
  id: string;
  name: string;
  repo: string;
  defaultBranch?: string;
};

function hostLabelFromURL(raw: string): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.hostname || s;
  } catch {
    return s.replace(/^https?:\/\//, "").split("/")[0] ?? s;
  }
}

function nameFromURL(raw: string): string {
  return hostLabelFromURL(raw) || "server";
}

function WorkspaceSettingsPage() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const session = useQuery({
    queryKey: queryKeys.session(),
    queryFn: getSession,
    staleTime: 30_000,
    retry: false,
  });

  const workspacesQ = useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: getWorkspaces,
  });

  const workspace = useMemo(() => {
    const ws = (workspacesQ.data?.workspaces ?? []) as SkyforgeWorkspace[];
    return ws.find((w) => w.id === workspaceId) ?? null;
  }, [workspacesQ.data, workspaceId]);

  const access = useMemo(() => workspaceAccess(session.data, workspace), [session.data, workspace]);
  const allowEdit = useMemo(() => canEditWorkspace(access), [access]);
  const allowDelete = useMemo(() => canDeleteWorkspace(access), [access]);

  const [viewersCSV, setViewersCSV] = useState("");
  const [ownersCSV, setOwnersCSV] = useState("");
  const [editorsCSV, setEditorsCSV] = useState("");

  const [externalRepos, setExternalRepos] = useState<ExternalRepoDraft[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [httpsUsername, setHttpsUsername] = useState("");
  const [httpsToken, setHttpsToken] = useState("");
  const [newNetlabURL, setNewNetlabURL] = useState("");
  const [newNetlabInsecure, setNewNetlabInsecure] = useState(true);
  const [newNetlabUser, setNewNetlabUser] = useState("");
  const [newNetlabPassword, setNewNetlabPassword] = useState("");
  const [newEveURL, setNewEveURL] = useState("");
  const [newEveSkipTLS, setNewEveSkipTLS] = useState(true);
  const [newEveUser, setNewEveUser] = useState("");
  const [newEvePassword, setNewEvePassword] = useState("");

  const deleteMutation = useMutation({
    mutationFn: async () => deleteWorkspace(workspaceId, { confirm: deleteConfirm.trim() || (workspace?.slug ?? workspaceId) }),
    onSuccess: async () => {
      toast.success("Workspace deleted");
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
      await navigate({ to: "/dashboard/deployments" });
    },
    onError: (e) => toast.error("Failed to delete workspace", { description: (e as Error).message }),
  });

  // Initialize local state once workspace loads
  useEffect(() => {
    if (!workspace) return;
    setOwnersCSV((workspace.owners ?? []).join(","));
    setEditorsCSV((workspace.editors ?? []).join(","));
    setViewersCSV((workspace.viewers ?? []).join(","));
    const next = (workspace.externalTemplateRepos ?? []) as ExternalRepoDraft[];
    setExternalRepos(
      next
        .filter((r) => !!r && typeof r.id === "string" && typeof r.name === "string" && typeof r.repo === "string")
        .map((r) => ({
          id: String(r.id ?? "").trim(),
          name: String(r.name ?? "").trim(),
          repo: String(r.repo ?? "").trim(),
          defaultBranch: String(r.defaultBranch ?? "").trim() || undefined,
        }))
    );
  }, [workspace]);

  const gitCredsQ = useQuery({
    queryKey: ["userGitCredentials"],
    queryFn: getUserGitCredentials,
    staleTime: 30_000,
  });

  useEffect(() => {
    const creds = gitCredsQ.data;
    if (!creds) return;
    setHttpsUsername(creds.httpsUsername ?? "");
  }, [gitCredsQ.data]);

  const updateGitCredsMutation = useMutation({
    mutationFn: async (payload: { httpsUsername?: string; httpsToken?: string; clearToken?: boolean }) => {
      return updateUserGitCredentials(payload);
    },
    onSuccess: async () => {
      toast.success("Git credentials updated");
      setHttpsToken("");
      await queryClient.invalidateQueries({ queryKey: ["userGitCredentials"] });
    },
    onError: (e) => toast.error("Failed to update git credentials", { description: (e as Error).message }),
  });

  const rotateKeyMutation = useMutation({
    mutationFn: rotateUserGitDeployKey,
    onSuccess: async () => {
      toast.success("Deploy key rotated");
      await queryClient.invalidateQueries({ queryKey: ["userGitCredentials"] });
    },
    onError: (e) => toast.error("Failed to rotate deploy key", { description: (e as Error).message }),
  });

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
    mutationFn: async (next: { externalTemplateRepos: unknown }) => {
      return updateWorkspaceSettings(workspaceId, {
        allowExternalTemplateRepos: ((next.externalTemplateRepos as any[]) ?? []).length > 0,
        // These legacy flags are intentionally always enabled; BYOS availability is
        // determined by whether servers are configured (and shown in the UI).
        allowCustomEveServers: true,
        allowCustomNetlabServers: true,
        externalTemplateRepos: (next.externalTemplateRepos as any[]) ?? [],
      });
    },
    onSuccess: async () => {
      toast.success("Workspace feature flags updated");
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
    },
    onError: (e) => toast.error("Failed to update settings", { description: (e as Error).message }),
  });

  // Forward integration is configured per-user in the Forward Collector page.

  const netlabServersQ = useQuery({
    queryKey: queryKeys.workspaceNetlabServers(workspaceId),
    queryFn: async () => listWorkspaceNetlabServers(workspaceId),
    staleTime: 30_000,
  });

  const eveServersQ = useQuery({
    queryKey: ["workspaceEveServers", workspaceId],
    queryFn: async () => listWorkspaceEveServers(workspaceId),
    staleTime: 30_000,
  });

  const upsertNetlabServerMutation = useMutation({
    mutationFn: async () => {
      return upsertWorkspaceNetlabServer(workspaceId, {
        name: nameFromURL(newNetlabURL),
        apiUrl: newNetlabURL.trim(),
        apiInsecure: newNetlabInsecure,
        apiUser: newNetlabUser.trim() || undefined,
        apiPassword: newNetlabPassword.trim() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Netlab server saved");
      setNewNetlabURL("");
      setNewNetlabInsecure(true);
      setNewNetlabUser("");
      setNewNetlabPassword("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaceNetlabServers(workspaceId) });
    },
    onError: (e) => toast.error("Failed to save Netlab server", { description: (e as Error).message }),
  });

  const deleteNetlabServerMutation = useMutation({
    mutationFn: async (serverId: string) => deleteWorkspaceNetlabServer(workspaceId, serverId),
    onSuccess: async () => {
      toast.success("Netlab server deleted");
      await queryClient.invalidateQueries({ queryKey: queryKeys.workspaceNetlabServers(workspaceId) });
    },
    onError: (e) => toast.error("Failed to delete Netlab server", { description: (e as Error).message }),
  });

  const upsertEveServerMutation = useMutation({
    mutationFn: async () => {
      return upsertWorkspaceEveServer(workspaceId, {
        name: nameFromURL(newEveURL),
        apiUrl: newEveURL.trim(),
        skipTlsVerify: newEveSkipTLS,
        apiUser: newEveUser.trim() || undefined,
        apiPassword: newEvePassword.trim() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("EVE-NG server saved");
      setNewEveURL("");
      setNewEveSkipTLS(true);
      setNewEveUser("");
      setNewEvePassword("");
      await queryClient.invalidateQueries({ queryKey: ["workspaceEveServers", workspaceId] });
    },
    onError: (e) => toast.error("Failed to save EVE-NG server", { description: (e as Error).message }),
  });

  const deleteEveServerMutation = useMutation({
    mutationFn: async (serverId: string) => deleteWorkspaceEveServer(workspaceId, serverId),
    onSuccess: async () => {
      toast.success("EVE-NG server deleted");
      await queryClient.invalidateQueries({ queryKey: ["workspaceEveServers", workspaceId] });
    },
    onError: (e) => toast.error("Failed to delete EVE-NG server", { description: (e as Error).message }),
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
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          {allowDelete && <TabsTrigger value="danger">Danger</TabsTrigger>}
        </TabsList>

        <TabsContent value="access" className="space-y-6">
          {!allowEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Read-only access</CardTitle>
                <CardDescription>You can view this workspace but cannot edit or delete it.</CardDescription>
              </CardHeader>
            </Card>
          )}
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
                disabled={!allowEdit}
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
                <Input value={ownersCSV} onChange={(e) => setOwnersCSV(e.target.value)} placeholder="alice,bob" disabled={!allowEdit} />
              </div>
              <div className="space-y-1">
                <Label>Editors</Label>
                <Input value={editorsCSV} onChange={(e) => setEditorsCSV(e.target.value)} placeholder="alice,bob" disabled={!allowEdit} />
              </div>
              <div className="space-y-1">
                <Label>Viewers</Label>
                <Input value={viewersCSV} onChange={(e) => setViewersCSV(e.target.value)} placeholder="alice,bob" disabled={!allowEdit} />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="default"
                  disabled={!allowEdit || membersMutation.isPending}
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

        <TabsContent value="variables" className="space-y-6">
          <WorkspaceVariableGroups workspaceId={workspaceId} allowEdit={allowEdit} />
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workspace features</CardTitle>
              <CardDescription>Configure external template sources and BYOS servers for this workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-3 space-y-3">
                <div className="text-sm font-medium">BYOS Netlab servers</div>
                <div className="text-xs text-muted-foreground">
                  Add one or more Netlab API endpoints. When at least one is configured, <span className="font-mono">Netlab (BYOS)</span> becomes available in Create deployment.
                </div>
                <div className="space-y-2">
                  {(netlabServersQ.data?.servers ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No Netlab servers configured.</div>
                  ) : (
                    (netlabServersQ.data?.servers ?? []).map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                        <div className="min-w-0">
                          <div className="font-medium">{hostLabelFromURL(s.apiUrl) || s.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {s.apiUrl} {s.apiInsecure ? "(insecure)" : ""} {s.apiUser ? `· ${s.apiUser}` : ""} {s.hasPassword ? "· password set" : ""}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={!allowEdit || deleteNetlabServerMutation.isPending}
                          onClick={() => deleteNetlabServerMutation.mutate(s.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>API URL</Label>
                    <Input value={newNetlabURL} disabled={!allowEdit} onChange={(e) => setNewNetlabURL(e.target.value)} placeholder="https://netlab.local.forwardnetworks.com:8080" />
                    <div className="text-xs text-muted-foreground">
                      Custom ports are supported (e.g. <span className="font-mono">:8080</span>) but won’t be shown in dropdown labels.
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Skip TLS verification</div>
                      <div className="text-xs text-muted-foreground">Disable certificate verification for this server.</div>
                    </div>
                    <Switch checked={newNetlabInsecure} onCheckedChange={setNewNetlabInsecure} disabled={!allowEdit} />
                  </div>
                  <div className="space-y-1">
                    <Label>Username</Label>
                    <Input value={newNetlabUser} disabled={!allowEdit} onChange={(e) => setNewNetlabUser(e.target.value)} placeholder="user" />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input value={newNetlabPassword} disabled={!allowEdit} onChange={(e) => setNewNetlabPassword(e.target.value)} placeholder="password" type="password" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={
                      !allowEdit ||
                      upsertNetlabServerMutation.isPending ||
                      !newNetlabURL.trim()
                    }
                    onClick={() => upsertNetlabServerMutation.mutate()}
                  >
                    {upsertNetlabServerMutation.isPending ? "Saving…" : "Add Netlab server"}
                  </Button>
                </div>
              </div>

              <div className="rounded-md border p-3 space-y-3">
                <div className="text-sm font-medium">BYOS EVE-NG servers (LabPP)</div>
                <div className="text-xs text-muted-foreground">
                  Add one or more EVE-NG API endpoints. When at least one is configured, <span className="font-mono">LabPP</span> becomes available in Create deployment.
                </div>
                <div className="space-y-2">
                  {(eveServersQ.data?.servers ?? []).length === 0 ? (
                    <div className="text-sm text-muted-foreground">No EVE-NG servers configured.</div>
                  ) : (
                    (eveServersQ.data?.servers ?? []).map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                        <div className="min-w-0">
                          <div className="font-medium">{hostLabelFromURL(s.apiUrl) || s.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {s.apiUrl} {s.skipTlsVerify ? "(skip TLS verify)" : ""} {s.apiUser ? `· ${s.apiUser}` : ""} {s.hasPassword ? "· password set" : ""}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={!allowEdit || deleteEveServerMutation.isPending}
                          onClick={() => deleteEveServerMutation.mutate(s.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>API URL</Label>
                    <Input value={newEveURL} disabled={!allowEdit} onChange={(e) => setNewEveURL(e.target.value)} placeholder="https://eve.example:8080/api" />
                    <div className="text-xs text-muted-foreground">
                      Custom ports are supported (e.g. <span className="font-mono">:8080</span>) but won’t be shown in dropdown labels.
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Skip TLS verification</div>
                      <div className="text-xs text-muted-foreground">Disable certificate verification for this server.</div>
                    </div>
                    <Switch checked={newEveSkipTLS} onCheckedChange={setNewEveSkipTLS} disabled={!allowEdit} />
                  </div>
                  <div className="space-y-1">
                    <Label>Username</Label>
                    <Input value={newEveUser} disabled={!allowEdit} onChange={(e) => setNewEveUser(e.target.value)} placeholder="user" />
                  </div>
                  <div className="space-y-1">
                    <Label>Password</Label>
                    <Input value={newEvePassword} disabled={!allowEdit} onChange={(e) => setNewEvePassword(e.target.value)} placeholder="password" type="password" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    disabled={
                      !allowEdit ||
                      upsertEveServerMutation.isPending ||
                      !newEveURL.trim()
                    }
                    onClick={() => upsertEveServerMutation.mutate()}
                  >
                    {upsertEveServerMutation.isPending ? "Saving…" : "Add EVE-NG server"}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>External template repos</Label>
                    <div className="text-xs text-muted-foreground">
                      Repos are either <span className="font-mono">owner/repo</span> (Gitea) or a git URL (https://… or git@host:repo.git). Used by the deployment UI when Template source is set to External repo.
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!allowEdit}
                    onClick={() =>
                      setExternalRepos((prev) => [
                        ...prev,
                        {
                          id: `repo-${prev.length + 1}`,
                          name: `Repo ${prev.length + 1}`,
                          repo: "",
                          defaultBranch: "",
                        },
                      ])
                    }
                  >
                    Add repo
                  </Button>
                </div>

                <div className="space-y-3">
                  {externalRepos.length === 0 ? (
                    <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                      No external repos configured.
                    </div>
                  ) : (
                    externalRepos.map((r, idx) => (
                      <div key={`${r.id}-${idx}`} className="rounded-md border p-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium">Repo {idx + 1}</div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!allowEdit}
                            onClick={() => setExternalRepos((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <Label>ID</Label>
                            <Input
                              value={r.id}
                              disabled={!allowEdit}
                              onChange={(e) =>
                                setExternalRepos((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, id: e.target.value } : p))
                                )
                              }
                              placeholder="my-repo"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Name</Label>
                            <Input
                              value={r.name}
                              disabled={!allowEdit}
                              onChange={(e) =>
                                setExternalRepos((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p))
                                )
                              }
                              placeholder="My templates"
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label>Repo</Label>
                            <Input
                              value={r.repo}
                              disabled={!allowEdit}
                              onChange={(e) =>
                                setExternalRepos((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, repo: e.target.value } : p))
                                )
                              }
                              placeholder="owner/repo"
                            />
                          </div>
                          <div className="space-y-1 md:col-span-2">
                            <Label>Default branch</Label>
                            <Input
                              value={r.defaultBranch ?? ""}
                              disabled={!allowEdit}
                              onChange={(e) =>
                                setExternalRepos((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, defaultBranch: e.target.value } : p))
                                )
                              }
                              placeholder="main"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-md border p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">Git credentials (your user)</div>
                    <div className="text-xs text-muted-foreground">Use this deploy key for SSH-based repos and an HTTPS token for https:// clones.</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={rotateKeyMutation.isPending || gitCredsQ.isLoading}
                      onClick={() => rotateKeyMutation.mutate()}
                    >
                      Rotate key
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!gitCredsQ.data?.sshPublicKey}
                      onClick={async () => {
                        const key = gitCredsQ.data?.sshPublicKey ?? "";
                        try {
                          await navigator.clipboard.writeText(key);
                          toast.success("Copied public key");
                        } catch {
                          toast.error("Failed to copy");
                        }
                      }}
                    >
                      Copy public key
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>SSH deploy key (public)</Label>
                  <Textarea readOnly value={gitCredsQ.data?.sshPublicKey ?? ""} placeholder="Loading…" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>HTTPS username</Label>
                    <Input value={httpsUsername} disabled={updateGitCredsMutation.isPending} onChange={(e) => setHttpsUsername(e.target.value)} placeholder="username" />
                  </div>
                  <div className="space-y-1">
                    <Label>HTTPS token</Label>
                    <Input value={httpsToken} disabled={updateGitCredsMutation.isPending} onChange={(e) => setHttpsToken(e.target.value)} placeholder="token" type="password" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={updateGitCredsMutation.isPending || gitCredsQ.isLoading || !gitCredsQ.data?.hasHttpsToken}
                    onClick={() => updateGitCredsMutation.mutate({ httpsUsername, clearToken: true })}
                  >
                    Clear token
                  </Button>
                  <Button
                    type="button"
                    disabled={updateGitCredsMutation.isPending || gitCredsQ.isLoading}
                    onClick={() => updateGitCredsMutation.mutate({ httpsUsername, httpsToken })}
                  >
                    Save git credentials
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="default"
                  disabled={!allowEdit || settingsMutation.isPending}
                  onClick={() => {
                    const trimmed = externalRepos
                      .map((r) => ({
                        id: String(r.id ?? "").trim(),
                        name: String(r.name ?? "").trim(),
                        repo: String(r.repo ?? "").trim(),
                        defaultBranch: String(r.defaultBranch ?? "").trim() || undefined,
                      }))
                      .filter((r) => r.id && r.name && r.repo);
                    if (trimmed.some((r) => !r.id || !r.name || !r.repo)) {
                      toast.error("External repos must include id, name, and repo");
                      return;
                    }
                    settingsMutation.mutate({
                      externalTemplateRepos: trimmed,
                    });
                  }}
                >
                  {settingsMutation.isPending ? "Saving…" : "Save settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {allowDelete && (
        <TabsContent value="danger" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delete workspace</CardTitle>
              <CardDescription>Deletes the workspace and backing resources. This cannot be undone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Type <span className="font-mono">{workspace.slug}</span> to confirm.
              </div>
              <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={workspace.slug} />
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending || deleteConfirm.trim().toLowerCase() !== workspace.slug.toLowerCase()}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete workspace"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
