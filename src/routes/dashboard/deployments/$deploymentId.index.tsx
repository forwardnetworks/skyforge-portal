import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { 
  Play, 
  StopCircle, 
  Trash2, 
  ArrowLeft, 
  Terminal, 
  Network, 
  FileJson,
  Box
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardEvents } from "../../../lib/dashboard-events";
import {
  destroyDeployment,
  startDeployment,
  stopDeployment,
  getDeploymentTopology,
  type DashboardSnapshot, type JSONMap,
  type WorkspaceDeployment
} from "../../../lib/skyforge-api";
import { queryKeys } from "../../../lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button, buttonVariants } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Skeleton } from "../../../components/ui/skeleton";
import { EmptyState } from "../../../components/ui/empty-state";
import { TopologyViewer } from "../../../components/topology-viewer";
import { useRunEvents, type RunLogState, type TaskLogEntry } from "../../../lib/run-events";
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

export const Route = createFileRoute("/dashboard/deployments/$deploymentId/")({
  component: DeploymentDetailPage
});

function DeploymentDetailPage() {
  const { deploymentId } = Route.useParams();
  const navigate = useNavigate();
  useDashboardEvents(true);

  const [destroyDialogOpen, setDestroyDialogOpen] = useState(false);

  const snap = useQuery<DashboardSnapshot | null>({
    queryKey: queryKeys.dashboardSnapshot(),
    queryFn: async () => null,
    initialData: null,
    retry: false,
    staleTime: Infinity
  });

  const deployment = useMemo(() => {
    return (snap.data?.deployments ?? []).find((d: WorkspaceDeployment) => d.id === deploymentId);
  }, [snap.data?.deployments, deploymentId]);

  const activeRunId = String(deployment?.activeTaskId ?? "");
  useRunEvents(activeRunId, Boolean(activeRunId));
  const activeLogs = useQuery({
    queryKey: queryKeys.runLogs(activeRunId),
    queryFn: async () => ({ cursor: 0, entries: [] }) as RunLogState,
    retry: false,
    staleTime: Infinity,
    enabled: Boolean(activeRunId),
  });

  if (!snap.data && !deployment) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Box}
          title="Deployment not found"
          description="This deployment may have been deleted or you don't have access."
          action={{
            label: "Back to Deployments",
            onClick: () => navigate({ to: "/dashboard/deployments" })
          }}
        />
      </div>
    );
  }

  const handleStart = async () => {
    try {
      await startDeployment(deployment.workspaceId, deployment.id);
      toast.success("Deployment starting", { description: `${deployment.name} is queued to start.` });
    } catch (e) {
      toast.error("Failed to start", { description: (e as Error).message });
    }
  };

  const handleStop = async () => {
    try {
      await stopDeployment(deployment.workspaceId, deployment.id);
      toast.success("Deployment stopping", { description: `${deployment.name} is queued to stop.` });
    } catch (e) {
      toast.error("Failed to stop", { description: (e as Error).message });
    }
  };

  const handleDestroy = async () => {
    try {
      await destroyDeployment(deployment.workspaceId, deployment.id);
      toast.success("Deployment destroyed");
      navigate({ to: "/dashboard/deployments" });
    } catch (e) {
      toast.error("Failed to destroy", { description: (e as Error).message });
    }
  };

  const status = deployment.activeTaskStatus ?? deployment.lastStatus ?? "unknown";
  const isBusy = !!deployment.activeTaskId;

  const runsForDeployment = useMemo(() => {
    const all = (snap.data?.runs ?? []) as JSONMap[];
    const filtered = all.filter((r) => String(r.workspaceId ?? "") === deployment.workspaceId);
    const depRuns = filtered.filter((r) => String(r.deploymentId ?? "") === deployment.id);
    if (depRuns.length > 0) return depRuns;

    // Fallback for older snapshots that didn't include deploymentId on the run payload.
    return filtered;
  }, [deployment.id, deployment.workspaceId, snap.data?.runs]);

  const topology = useQuery({
    queryKey: queryKeys.deploymentTopology(deployment.workspaceId, deployment.id),
    queryFn: async () => getDeploymentTopology(deployment.workspaceId, deployment.id),
    enabled: ["containerlab", "netlab-c9s", "clabernetes"].includes(deployment.type),
    retry: false,
    staleTime: 10_000
  });

  return (
    <div className="space-y-6 p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link 
            to="/dashboard/deployments" 
            className={buttonVariants({ variant: "outline", size: "icon", className: "h-9 w-9" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              {deployment.name}
              <StatusBadge status={status} />
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{deployment.id}</span>
              <span>•</span>
              <span className="capitalize">{deployment.type}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleStart} disabled={isBusy}>
            <Play className="mr-2 h-4 w-4" /> Start
          </Button>
          <Button variant="outline" size="sm" onClick={handleStop} disabled={isBusy}>
            <StopCircle className="mr-2 h-4 w-4" /> Stop
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setDestroyDialogOpen(true)} 
            disabled={isBusy}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Destroy
          </Button>
        </div>
      </div>

      <Tabs defaultValue="topology" className="space-y-6">
        <TabsList>
          <TabsTrigger value="topology" className="gap-2">
            <Network className="h-4 w-4" /> Topology
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Terminal className="h-4 w-4" /> Logs & Events
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <FileJson className="h-4 w-4" /> Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topology" className="space-y-6 animate-in fade-in-50">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Network Topology</CardTitle>
                  <CardDescription>
                    {deployment.type === "containerlab"
                      ? "Derived from containerlab after deploy (includes resolved mgmt IPs)."
                      : deployment.type === "netlab-c9s"
                        ? "Derived from clabernetes after deploy (includes resolved mgmt IPs)."
                        : deployment.type === "clabernetes"
                          ? "Derived from clabernetes after deploy (includes resolved mgmt IPs)."
                          : "Topology is provider-dependent; not yet implemented for this deployment type."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TopologyViewer topology={topology.data} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6 animate-in fade-in-50">
          <Card>
            <CardHeader>
              <CardTitle>Logs & Events</CardTitle>
              <CardDescription>Live task output.</CardDescription>
            </CardHeader>
            <CardContent>
              {deployment.activeTaskId ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Active run: {String(deployment.activeTaskId)}</div>
                    <Link
                      to="/dashboard/runs/$runId"
                      params={{ runId: String(deployment.activeTaskId) }}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Open run details
                    </Link>
                  </div>
                  <div className="rounded-md border bg-zinc-950 p-4 font-mono text-xs text-zinc-100">
                    <RunOutput entries={activeLogs.data?.entries ?? []} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                  <Terminal className="h-10 w-10 mb-3 opacity-20" />
                  <p>No active run.</p>
                  <p className="text-xs mt-1">Start/stop/destroy will queue runs that appear here.</p>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <div className="text-sm font-medium">Recent runs</div>
                <div className="space-y-2">
                  {runsForDeployment.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No runs yet.</div>
                  ) : (
                    runsForDeployment.slice(0, 10).map((r) => {
                      const id = String(r.id ?? "");
                      return (
                        <div key={id} className="flex items-center justify-between gap-3 rounded-md border p-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">{id}</span>
                              <Badge variant="secondary" className="capitalize">{String(r.status ?? "")}</Badge>
                              <span className="text-xs text-muted-foreground truncate">{String(r.tpl_alias ?? r.type ?? "")}</span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate mt-1">
                              {String(r.status_text ?? r.message ?? "")}
                            </div>
                          </div>
                          <Link
                            to="/dashboard/runs/$runId"
                            params={{ runId: id }}
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            View
                          </Link>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6 animate-in fade-in-50">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Read-only view of the deployment parameters.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto font-mono text-xs max-h-[500px]">
                {JSON.stringify(deployment.config, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={destroyDialogOpen} onOpenChange={setDestroyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Destroy deployment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deployment.name}</strong> and all associated resources.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDestroy} className={buttonVariants({ variant: "destructive" })}>
              Destroy Deployment
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

function RunOutput(props: { entries: TaskLogEntry[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [props.entries.length]);

  if (props.entries.length === 0) return <div className="text-zinc-500">Waiting for output…</div>;

  return (
    <div ref={containerRef} className="max-h-[65vh] overflow-auto whitespace-pre-wrap">
      {props.entries.map((e, idx) => (
        <div key={`${e.time}-${idx}`}>
          <span className="text-zinc-500 select-none">{e.time ? `${e.time} ` : ""}</span>
          <span>{e.output}</span>
        </div>
      ))}
    </div>
  );
}
