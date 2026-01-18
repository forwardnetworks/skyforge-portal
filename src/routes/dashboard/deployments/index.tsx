import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  StopCircle,
  Play,
  Inbox,
  MoreHorizontal,
  Info,
  Search,
  Filter,
  Activity,
  Box,
  Settings,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { z } from "zod";
import { cn } from "../../../lib/utils";
import { useDashboardEvents } from "../../../lib/dashboard-events";
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
} from "../../../lib/skyforge-api";
import { loginWithPopup } from "../../../lib/auth-popup";
import { queryKeys } from "../../../lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button, buttonVariants } from "../../../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { TableWrapper } from "../../../components/ui/table-wrapper";
import { Badge } from "../../../components/ui/badge";
import { Skeleton } from "../../../components/ui/skeleton";
import { EmptyState } from "../../../components/ui/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../../../components/ui/dropdown-menu";

// Search Schema
const deploymentsSearchSchema = z.object({
  workspace: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/deployments/")({
  validateSearch: (search) => deploymentsSearchSchema.parse(search),
  loaderDeps: ({ search: { workspace } }) => ({ workspace }),
  loader: async ({ context: { queryClient } }) => {
    // Prefetch workspaces to ensure selector is ready
    await queryClient.ensureQueryData({
      queryKey: queryKeys.workspaces(),
      queryFn: getWorkspaces,
      staleTime: 30_000,
    });
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

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  // UI state
  const [isFeedOpen, setIsFeedOpen] = useState(true);

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

  const allDeployments = useMemo(() => {
    const all = (snap.data?.deployments ?? []) as WorkspaceDeployment[];
    return selectedWorkspaceId ? all.filter((d: WorkspaceDeployment) => d.workspaceId === selectedWorkspaceId) : all;
  }, [selectedWorkspaceId, snap.data?.deployments]);

  // Apply filters
  const deployments = useMemo(() => {
    return allDeployments.filter(d => {
      // Search
      if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Status
      if (statusFilter !== "all") {
        const status = (d.activeTaskStatus ?? d.lastStatus ?? "unknown").toLowerCase();
        if (statusFilter === "running" && !["running", "active", "healthy"].includes(status)) return false;
        if (statusFilter === "stopped" && !["created", "stopped", "success", "succeeded"].includes(status)) return false;
        if (statusFilter === "failed" && !["failed", "error", "crashloopbackoff"].includes(status)) return false;
      }
      // Type
      if (typeFilter !== "all") {
        if (typeFilter === "netlab" && !d.type.startsWith("netlab")) return false;
        if (typeFilter === "containerlab" && !["containerlab", "clabernetes"].includes(d.type)) return false;
        if (typeFilter === "terraform" && d.type !== "terraform") return false;
        if (typeFilter === "labpp" && d.type !== "labpp") return false;
      }
      return true;
    });
  }, [allDeployments, searchQuery, statusFilter, typeFilter]);

  const runs = useMemo(() => {
    const all = (snap.data?.runs ?? []) as JSONMap[];
    if (!selectedWorkspaceId) return all;
    return all.filter((r: JSONMap) => String(r.workspaceId ?? "") === selectedWorkspaceId);
  }, [selectedWorkspaceId, snap.data?.runs]);

  const loginHref = buildLoginUrl(window.location.pathname + window.location.search);

  const handleStart = async (d: WorkspaceDeployment) => {
    try {
      await startDeployment(d.workspaceId, d.id);
      toast.success("Deployment starting", { description: `${d.name} is queued to start.` });
    } catch (e) {
      toast.error("Failed to start", { description: (e as Error).message });
    }
  };

  const handleStop = async (d: WorkspaceDeployment) => {
    try {
      await stopDeployment(d.workspaceId, d.id);
      toast.success("Deployment stopping", { description: `${d.name} is queued to stop.` });
    } catch (e) {
      toast.error("Failed to stop", { description: (e as Error).message });
    }
  };

  const handleDestroy = async () => {
    if (!destroyTarget) return;
    try {
      await destroyDeployment(destroyTarget.workspaceId, destroyTarget.id);
      toast.success("Deployment destroyed", { description: `${destroyTarget.name} has been deleted.` });
      setDestroyDialogOpen(false);
      setDestroyTarget(null);
    } catch (e) {
      toast.error("Failed to destroy", { description: (e as Error).message });
    }
  };

  const formatDeploymentType = (typ: string) => {
    switch (typ) {
      case "netlab": return "Netlab (BYOS)";
      case "netlab-c9s": return "Netlab";
      case "containerlab": return "Containerlab (BYOS)";
      case "clabernetes": return "Containerlab";
      case "labpp": return "LabPP";
      default: return typ;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Top Header / Workspace Context */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deployments</h1>
          <p className="text-muted-foreground text-sm">Manage deployments and monitor workspace activity.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
            <Select
              value={selectedWorkspaceId}
              onValueChange={handleWorkspaceChange}
              disabled={workspaces.length === 0}
            >
              <SelectTrigger className="w-[200px] h-8 bg-transparent border-0 focus:ring-0 shadow-none">
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
            <div className="h-4 w-px bg-border" />
            <Link
              to="/dashboard/workspaces/new"
              title="Create workspace"
              className={buttonVariants({ variant: "ghost", size: "icon", className: "h-8 w-8" })}
            >
              <Plus className="h-4 w-4" />
            </Link>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Workspace Settings (Coming Soon)">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {!snap.data && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Skeleton className="h-4 w-64" />
              <div className="text-center text-muted-foreground">
                Waiting for platform stream…
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

      {/* Main Content Flex Layout */}
      <div className="flex flex-col lg:flex-row gap-6 relative items-start">
        
        {/* Left Column: Deployments (Flexible) */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deployments..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="stopped">Stopped</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <Box className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="netlab">Netlab</SelectItem>
                <SelectItem value="containerlab">Containerlab</SelectItem>
                <SelectItem value="terraform">Terraform</SelectItem>
                <SelectItem value="labpp">LabPP</SelectItem>
              </SelectContent>
            </Select>
            <Link
              to="/dashboard/deployments/new"
              search={{ workspace: selectedWorkspaceId }}
              className={buttonVariants({ variant: "default" })}
            >
              <Plus className="mr-2 h-4 w-4" /> Create
            </Link>
          </div>

          <Card>
            <CardContent className="p-0">
              {!snap.data ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : deployments.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No deployments found"
                  description={
                    searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your filters." 
                      : "You haven't created any deployments in this workspace yet."
                  }
                  action={!searchQuery && statusFilter === "all" ? {
                    label: "Create deployment",
                    onClick: () => navigate({ to: "/dashboard/deployments/new", search: { workspace: selectedWorkspaceId } })
                  } : undefined}
                />
              ) : (
                <TableWrapper className="border-none">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deployments.map((d: WorkspaceDeployment) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium text-foreground">
                            <Link
                              to="/dashboard/deployments/$deploymentId"
                              params={{ deploymentId: d.id }}
                              className="hover:underline flex items-center gap-2"
                            >
                              {d.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDeploymentType(d.type)}</TableCell>
                          <TableCell>
                             <StatusBadge status={d.activeTaskStatus ?? d.lastStatus ?? "unknown"} />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => navigate({
                                    to: "/dashboard/deployments/$deploymentId",
                                    params: { deploymentId: d.id }
                                  })}
                                >
                                  <Info className="mr-2 h-4 w-4" />
                                  Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
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
        </div>

        {/* Right Column: Activity Feed (Collapsible) */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out border-l space-y-4 shrink-0",
            isFeedOpen ? "w-full lg:w-80 xl:w-96 pl-6 opacity-100" : "w-0 lg:w-12 pl-0 opacity-100 border-none lg:border-l"
          )}
        >
          <div className={cn("flex items-center gap-2 h-[40px]", !isFeedOpen && "justify-center")}>
            {isFeedOpen ? (
              <>
                <Activity className="h-4 w-4 text-muted-foreground" />
                <h3 className="flex-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Activity Feed</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsFeedOpen(false)}
                  title="Collapse feed"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsFeedOpen(true)}
                title="Expand activity feed"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className={cn("space-y-3", !isFeedOpen && "hidden")}>
            {!snap.data ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : runs.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No recent activity.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {runs.slice(0, 15).map((r) => {
                  const isFinished = ["success", "failed", "canceled", "error"].includes(String(r.status ?? "").toLowerCase());
                  return (
                    <Link
                      key={String(r.id ?? Math.random())}
                      to="/dashboard/runs/$runId"
                      params={{ runId: String(r.id ?? "") }}
                      className="block group"
                    >
                      <Card className="hover:border-primary/50 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-medium text-foreground">#{String(r.id ?? "")}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                  {String(r.tpl_alias ?? r.type ?? "Run")}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {String(r.message || "No message")}
                              </div>
                            </div>
                            <StatusBadge status={String(r.status ?? "")} size="xs" />
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{String(r.user_name ?? "system")}</span>
                            <span>{new Date(String(r.created)).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
                            })}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

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

function StatusBadge({ status, size = "default" }: { status: string, size?: "default" | "xs" }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  const s = status.toLowerCase();
  if (["running", "active", "healthy", "succeeded", "success"].includes(s)) variant = "default";
  if (["failed", "error", "stopped", "crashloopbackoff"].includes(s)) variant = "destructive";
  
  return <Badge variant={variant} className={`capitalize ${size === "xs" ? "px-1.5 py-0 text-[10px] h-5" : ""}`}>{status}</Badge>;
}

