import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Trash2, StopCircle, Play, Inbox, MoreHorizontal } from "lucide-react";
import { z } from "zod";
import { useDashboardEvents } from "../../lib/dashboard-events";
import { toast } from "sonner";
import {
  buildLoginUrl,
  destroyDeployment,
  getWorkspaces,
  startDeployment,
  stopDeployment,
  type DashboardSnapshot,
  type JSONMap,
  type SkyforgeWorkspace,
  type WorkspaceDeployment
} from "../../lib/skyforge-api";
import { loginWithPopup } from "../../lib/auth-popup";
import { queryKeys } from "../../lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button, buttonVariants } from "../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { TableWrapper } from "../../components/ui/table-wrapper";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";

// Search Schema
const deploymentsSearchSchema = z.object({
  workspace: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/deployments")({
  validateSearch: (search) => deploymentsSearchSchema.parse(search),
  loaderDeps: ({ search: { workspace } }) => ({ workspace }),
  loader: async ({ context: { queryClient } }) => {
    // Prefetch workspaces to ensure selector is ready
    await queryClient.ensureQueryData({
      queryKey: queryKeys.workspaces(),
      queryFn: getWorkspaces,
      staleTime: 30_000,
    });
    // We don't prefetch dashboard snapshot here because it's SSE-driven and might be heavy/ephemeral,
    // but ensuring workspaces improves the initial paint.
  },
  component: DeploymentsPage
});

function DeploymentsPage() {
  useDashboardEvents(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspace } = Route.useSearch();

  const snap = useQuery<DashboardSnapshot | null>({
    queryKey: queryKeys.dashboardSnapshot(),
    queryFn: async () => null,
    initialData: null,
    retry: false,
    staleTime: Infinity
  });

  const [destroyTarget, setDestroyTarget] = useState<WorkspaceDeployment | null>(null);
  const [destroyDialogOpen, setDestroyDialogOpen] = useState(false);

  const workspaces = snap.data?.workspaces ?? [];
  
  // Use URL param if available, otherwise fallback to first workspace
  const selectedWorkspaceId = useMemo(() => {
    if (workspace && workspaces.some((w: SkyforgeWorkspace) => w.id === workspace)) return workspace;
    return workspaces[0]?.id ?? "";
  }, [workspace, workspaces]);

  // Sync internal state selection to URL
  const handleWorkspaceChange = (newId: string) => {
    navigate({
      search: { workspace: newId } as any,
      replace: true,
    });
  };

  const deployments = useMemo(() => {
    const all = (snap.data?.deployments ?? []) as WorkspaceDeployment[];
    return selectedWorkspaceId ? all.filter((d: WorkspaceDeployment) => d.workspaceId === selectedWorkspaceId) : all;
  }, [selectedWorkspaceId, snap.data?.deployments]);

  const runs = useMemo(() => {
    const all = (snap.data?.runs ?? []) as JSONMap[];
    if (!selectedWorkspaceId) return all;
    return all.filter((r: JSONMap) => String(r.workspaceId ?? "") === selectedWorkspaceId);
  }, [selectedWorkspaceId, snap.data?.runs]);

  const loginHref = buildLoginUrl(window.location.pathname + window.location.search);

  const handleStart = async (d: WorkspaceDeployment) => {
    try {
      await startDeployment(d.workspaceId, d.id);
      toast.success("Deployment starting", {
        description: `${d.name} is queued to start.`
      });
    } catch (e) {
      toast.error("Failed to start deployment", {
        description: (e as Error).message
      });
    }
  };

  const handleStop = async (d: WorkspaceDeployment) => {
    try {
      await stopDeployment(d.workspaceId, d.id);
      toast.success("Deployment stopping", {
        description: `${d.name} is queued to stop.`
      });
    } catch (e) {
      toast.error("Failed to stop deployment", {
        description: (e as Error).message
      });
    }
  };

  const handleDestroy = async () => {
    if (!destroyTarget) return;
    try {
      await destroyDeployment(destroyTarget.workspaceId, destroyTarget.id);
      toast.success("Deployment destroyed", {
        description: `${destroyTarget.name} has been deleted.`
      });
      setDestroyDialogOpen(false);
      setDestroyTarget(null);
    } catch (e) {
      toast.error("Failed to destroy deployment", {
        description: (e as Error).message
      });
    }
  };

  const formatDeploymentType = (typ: string) => {
    switch (typ) {
      case "netlab":
        return "Netlab (BYOS)";
      case "netlab-c9s":
        return "Netlab";
      case "containerlab":
        return "Containerlab (BYOS)";
      case "clabernetes":
        return "Containerlab";
      case "labpp":
        return "LabPP";
      default:
        return typ;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>Live updates via SSE (`/api/dashboard/events`).</CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/dashboard/deployments/new"
                search={{ workspace: selectedWorkspaceId }}
                className={buttonVariants({ variant: "default", size: "sm" })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create deployment
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Workspace:</span>
                <Select
                  value={selectedWorkspaceId}
                  onValueChange={handleWorkspaceChange}
                  disabled={workspaces.length === 0}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((w: SkyforgeWorkspace) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!snap.data && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Skeleton className="h-4 w-64" />
              <div className="text-center text-muted-foreground">
                Waiting for dashboard stream…
                <div className="mt-2 text-xs">
                  If you are logged out,{" "}
                  <a
                    className="text-primary underline hover:no-underline"
                    href={loginHref}
                    onClick={(e) => {
                      e.preventDefault();
                      void (async () => {
                        const ok = await loginWithPopup({ loginHref });
                        if (!ok) {
                          window.location.href = loginHref;
                          return;
                        }
                        await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
                      })();
                    }}
                  >
                    login
                  </a>
                  .
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Deployments</CardTitle>
        </CardHeader>
        <CardContent>
          {!snap.data ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : deployments.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No deployments"
              description="You haven't created any deployments in this workspace yet."
              action={{
                label: "Create deployment",
                onClick: () => navigate({ to: "/dashboard/deployments/new", search: { workspace: selectedWorkspaceId } })
              }}
            />
          ) : (
            <TableWrapper className="border-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Queue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deployments.map((d: WorkspaceDeployment) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-foreground">{d.name}</TableCell>
                      <TableCell>{formatDeploymentType(d.type)}</TableCell>
                      <TableCell>
                         <StatusBadge status={d.activeTaskStatus ?? d.lastStatus ?? "unknown"} />
                      </TableCell>
                      <TableCell>{d.queueDepth ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStart(d)} disabled={!!d.activeTaskId}>
                              <Play className="mr-2 h-4 w-4" />
                              Start
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStop(d)} disabled={!d.activeTaskId}>
                              <StopCircle className="mr-2 h-4 w-4" />
                              Stop
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setDestroyTarget(d);
                                setDestroyDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                              disabled={!!d.activeTaskId}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Destroy
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent runs</CardTitle>
        </CardHeader>
        <CardContent>
          {!snap.data ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : runs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No runs found.</div>
          ) : (
            <TableWrapper className="border-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.slice(0, 30).map((r) => (
                    <TableRow key={String(r.id ?? Math.random())}>
                      <TableCell>
                        <Link
                          className="text-primary underline hover:no-underline font-mono text-xs"
                          to="/dashboard/runs/$runId"
                          params={{ runId: String(r.id ?? "") }}
                        >
                          {String(r.id ?? "")}
                        </Link>
                      </TableCell>
                      <TableCell>{String(r.type ?? "")}</TableCell>
                      <TableCell>
                         <StatusBadge status={String(r.status ?? "")} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{String(r.createdAt ?? "")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={destroyDialogOpen} onOpenChange={setDestroyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the deployment "{destroyTarget?.name}" and remove all associated infrastructure. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDestroy}
              className={buttonVariants({ variant: "destructive" })}
            >
              Destroy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  const s = status.toLowerCase();
  if (["running", "active", "healthy", "succeeded", "success"].includes(s)) variant = "default";
  if (["failed", "error", "stopped", "crashloopbackoff"].includes(s)) variant = "destructive";
  
  return <Badge variant={variant} className="capitalize">{status}</Badge>;
}
