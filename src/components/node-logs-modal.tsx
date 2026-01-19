import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal, RefreshCw } from "lucide-react";
import { getDeploymentNodeLogs } from "@/lib/skyforge-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  deploymentId: string;
  nodeId: string;
  nodeKind?: string;
  nodeIp?: string;
};

export function NodeLogsModal({ open, onOpenChange, workspaceId, deploymentId, nodeId, nodeKind, nodeIp }: Props) {
  const tail = 400;
  const title = useMemo(() => {
    const parts = [nodeId];
    if (nodeKind) parts.push(String(nodeKind));
    return parts.join(" • ");
  }, [nodeId, nodeKind]);

  const logs = useQuery({
    queryKey: ["deploymentNodeLogs", workspaceId, deploymentId, nodeId, tail],
    enabled: open && !!workspaceId && !!deploymentId && !!nodeId,
    queryFn: async () => getDeploymentNodeLogs(workspaceId, deploymentId, nodeId, { tail }),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Node logs
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="truncate">
            <span className="font-mono">{title}</span>
            {nodeIp ? <span className="ml-2 font-mono">{nodeIp}</span> : null}
            {logs.data?.namespace && logs.data?.podName ? (
              <span className="ml-2">
                {logs.data.namespace}/{logs.data.podName}
                {logs.data.container ? ` (${logs.data.container})` : ""}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logs.refetch()}
              disabled={logs.isFetching}
            >
              <RefreshCw className={logs.isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-muted/30">
          <div className="h-[65vh] overflow-auto">
            <pre className="p-3 text-xs font-mono whitespace-pre-wrap">
              {logs.isLoading
                ? "Loading…"
                : logs.isError
                  ? `Failed to load logs: ${String(logs.error)}`
                  : logs.data?.logs || ""}
            </pre>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: For interactive access, right-click the node and open the terminal.
        </div>
      </DialogContent>
    </Dialog>
  );
}
