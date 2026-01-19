import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal, RefreshCw } from "lucide-react";
import { getDeploymentNodeDescribe } from "@/lib/skyforge-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  deploymentId: string;
  nodeId: string;
  nodeKind?: string;
  nodeIp?: string;
};

export function NodeDescribeModal({ open, onOpenChange, workspaceId, deploymentId, nodeId, nodeKind, nodeIp }: Props) {
  const title = useMemo(() => {
    const parts = [nodeId];
    if (nodeKind) parts.push(String(nodeKind));
    return parts.join(" • ");
  }, [nodeId, nodeKind]);

  const data = useQuery({
    queryKey: ["deploymentNodeDescribe", workspaceId, deploymentId, nodeId],
    enabled: open && !!workspaceId && !!deploymentId && !!nodeId,
    queryFn: async () => getDeploymentNodeDescribe(workspaceId, deploymentId, nodeId),
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Node status
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="truncate">
            <span className="font-mono">{title}</span>
            {nodeIp ? <span className="ml-2 font-mono">{nodeIp}</span> : null}
            {data.data?.namespace && data.data?.podName ? (
              <span className="ml-2">
                {data.data.namespace}/{data.data.podName}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => data.refetch()} disabled={data.isFetching}>
              <RefreshCw className={data.isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-muted/30">
          <div className="max-h-[65vh] overflow-auto">
            <pre className="p-3 text-xs font-mono whitespace-pre-wrap">
              {data.isLoading
                ? "Loading…"
                : data.isError
                  ? `Failed to load node status: ${String(data.error)}`
                  : JSON.stringify(data.data ?? {}, null, 2)}
            </pre>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Tip: If the pod is Running but the NOS CLI is unavailable, check the node logs and the launcher container.
        </div>
      </DialogContent>
    </Dialog>
  );
}

