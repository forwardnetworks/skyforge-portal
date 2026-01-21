import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { getDeploymentNodeLogs } from "@/lib/skyforge-api";

type Props = {
  workspaceId: string;
  deploymentId: string;
  nodeId: string;
  nodeKind?: string;
  nodeIp?: string;
  onClose?: () => void;
  className?: string;
};

export function NodeLogsView({ workspaceId, deploymentId, nodeId, nodeKind, nodeIp, onClose, className }: Props) {
  const tail = 400;
  const title = useMemo(() => {
    const parts = [nodeId];
    if (nodeKind) parts.push(String(nodeKind));
    return parts.join(" • ");
  }, [nodeId, nodeKind]);

  const logs = useQuery({
    queryKey: ["deploymentNodeLogs", workspaceId, deploymentId, nodeId, tail],
    enabled: !!workspaceId && !!deploymentId && !!nodeId,
    queryFn: async () => getDeploymentNodeLogs(workspaceId, deploymentId, nodeId, { tail, container: nodeId }),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return (
    <div className={`flex flex-col h-full w-full ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/40 text-xs">
        <div className="truncate flex items-center gap-2">
            <span className="font-mono font-medium">{title}</span>
            {nodeIp ? <span className="font-mono text-muted-foreground">{nodeIp}</span> : null}
            {logs.data?.namespace && logs.data?.podName ? (
              <span className="text-muted-foreground">
                {logs.data.namespace}/{logs.data.podName}
              </span>
            ) : null}
        </div>
        <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => logs.refetch()}
              disabled={logs.isFetching}
            >
              <RefreshCw className={logs.isFetching ? "mr-2 h-3 w-3 animate-spin" : "mr-2 h-3 w-3"} />
              Refresh
            </Button>
            {onClose ? (
                <Button variant="ghost" size="sm" className="h-7" onClick={onClose}>
                Close
                </Button>
            ) : null}
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-muted/10 p-4">
        <pre className="text-xs font-mono whitespace-pre-wrap">
            {logs.isLoading
            ? "Loading…"
            : logs.isError
                ? `Failed to load logs: ${String(logs.error)}`
                : logs.data?.logs || ""}
        </pre>
      </div>
    </div>
  );
}
