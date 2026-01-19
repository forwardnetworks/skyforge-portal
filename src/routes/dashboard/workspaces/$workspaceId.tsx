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

export const Route = createFileRoute("/dashboard/workspaces/$workspaceId")({
  component: WorkspaceSettingsPage,
});

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

  const [allowExternalTemplateRepos, setAllowExternalTemplateRepos] = useState(false);
  const [allowCustomNetlabServers, setAllowCustomNetlabServers] = useState(false);
  const [externalReposText, setExternalReposText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

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
    setAllowExternalTemplateRepos(!!workspace.allowExternalTemplateRepos);
    setAllowCustomNetlabServers(!!workspace.allowCustomNetlabServers);
    setExternalReposText(JSON.stringify(workspace.externalTemplateRepos ?? [], null, 2));
  }, [workspace]);

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
      allowCustomNetlabServers: boolean;
      externalTemplateRepos: unknown;
    }) => {
      return updateWorkspaceSettings(workspaceId, {
        allowExternalTemplateRepos: next.allowExternalTemplateRepos,
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

  // Forward integration is configured per-user in the Forward Collector page.

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
                <Switch checked={allowExternalTemplateRepos} onCheckedChange={setAllowExternalTemplateRepos} disabled={!allowEdit} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow custom Netlab servers</Label>
                  <div className="text-xs text-muted-foreground">Enable BYOS Netlab API servers per workspace.</div>
                </div>
                <Switch checked={allowCustomNetlabServers} onCheckedChange={setAllowCustomNetlabServers} disabled={!allowEdit} />
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
                  disabled={!allowEdit}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="default"
                  disabled={!allowEdit || settingsMutation.isPending}
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

          <Card>
            <CardHeader>
              <CardTitle>Forward</CardTitle>
              <CardDescription>Forward integration is configured per-user and enabled per-deployment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/dashboard/forward">
                <Button variant="outline">Open Forward Collector settings</Button>
              </Link>
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
