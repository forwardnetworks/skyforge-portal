import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeProps,
  Handle,
  Position,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Server, Network, Laptop, Cloud, Download } from "lucide-react";
import { useDownloadImage } from '@/hooks/use-download-image';
import { setDeploymentLinkImpairment, type DeploymentTopology } from "@/lib/skyforge-api";
import { TerminalModal } from "@/components/terminal-modal";
import { NodeLogsModal } from "@/components/node-logs-modal";
import { toast } from "sonner";

// Custom Node Component
const CustomNode = ({ data }: NodeProps) => {
  const Icon = data.icon === 'switch' ? Network : data.icon === 'cloud' ? Cloud : data.icon === 'client' ? Laptop : Server;
  const statusColor = data.status === 'running' ? 'default' : data.status === 'stopped' ? 'secondary' : 'destructive';

  return (
    <Card className="min-w-[180px] border-2 shadow-md">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="p-1.5 bg-muted rounded-md">
            <Icon className="w-4 h-4" />
          </div>
          <Badge variant={statusColor} className="text-[10px] h-5">
            {String(data.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <CardTitle className="text-sm font-bold truncate">{String(data.label)}</CardTitle>
        <div className="text-xs text-muted-foreground mt-1 truncate font-mono">
          {String(data.ip || '10.0.0.x')}
        </div>
        <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
        <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
      </CardContent>
    </Card>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

export function TopologyViewer({
  topology,
  workspaceId,
  deploymentId,
  enableTerminal,
}: {
  topology?: DeploymentTopology | null;
  workspaceId?: string;
  deploymentId?: string;
  enableTerminal?: boolean;
}) {
  const derived = useMemo(() => {
    if (!topology || !Array.isArray(topology.nodes) || topology.nodes.length === 0) {
      return { nodes: [] as Node[], edges: [] as Edge[] };
    }
    const gapX = 240;
    const gapY = 160;
    const cols = Math.max(1, Math.ceil(Math.sqrt(topology.nodes.length)));
    const nodes: Node[] = topology.nodes.map((n, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const kind = String(n.kind ?? "");
      const icon =
        kind.includes("linux") ? "client" : kind.includes("ceos") || kind.includes("eos") ? "switch" : "server";
      const status = String(n.status ?? "unknown");
      return {
        id: String(n.id),
        position: { x: col * gapX, y: row * gapY },
        data: { label: String(n.label ?? n.id), icon, status, ip: String(n.mgmtIp ?? ""), kind },
        type: "custom",
      };
    });
    const edges: Edge[] = (topology.edges ?? []).map((e) => ({
      id: String(e.id),
      source: String(e.source),
      target: String(e.target),
      label: e.label ? String(e.label) : undefined,
      animated: false,
    }));
    return { nodes, edges };
  }, [topology]);

  const [nodes, setNodes, onNodesChange] = useNodesState(derived.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(derived.edges);
  const ref = useRef<HTMLDivElement>(null);
  const { downloadImage } = useDownloadImage();
  const [terminalNode, setTerminalNode] = useState<{ id: string; kind?: string } | null>(null);
  const [logsNode, setLogsNode] = useState<{ id: string; kind?: string; ip?: string } | null>(null);
  const [edgeMenu, setEdgeMenu] = useState<{ x: number; y: number; edge: Edge } | null>(null);
  const [nodeMenu, setNodeMenu] = useState<{ x: number; y: number; node: Node } | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ id: string; label?: string } | null>(null);
  const [impairOpen, setImpairOpen] = useState(false);
  const [impairSaving, setImpairSaving] = useState(false);
  const [impair, setImpair] = useState<{ delayMs: string; jitterMs: string; lossPct: string; rateKbps: string }>({
    delayMs: "",
    jitterMs: "",
    lossPct: "",
    rateKbps: "",
  });

  useEffect(() => {
    setNodes(derived.nodes);
    setEdges(derived.edges);
  }, [derived.edges, derived.nodes, setEdges, setNodes]);

  useEffect(() => {
    if (!edgeMenu) return;
    const onClick = () => setEdgeMenu(null);
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setEdgeMenu(null);
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [edgeMenu]);

  useEffect(() => {
    if (!nodeMenu) return;
    const onClick = () => setNodeMenu(null);
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setNodeMenu(null);
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [nodeMenu]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      if (!workspaceId || !deploymentId) return;
      const rect = ref.current?.getBoundingClientRect();
      const x = rect ? event.clientX - rect.left : event.clientX;
      const y = rect ? event.clientY - rect.top : event.clientY;
      setNodeMenu({ x, y, node });
    },
    [deploymentId, workspaceId]
  );

  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      if (!workspaceId || !deploymentId) return;
      event.preventDefault();
      const rect = ref.current?.getBoundingClientRect();
      const x = rect ? event.clientX - rect.left : event.clientX;
      const y = rect ? event.clientY - rect.top : event.clientY;
      setEdgeMenu({ x, y, edge });
    },
    [deploymentId, workspaceId]
  );

  const applyImpairment = useCallback(async (action: "set" | "clear", edgeId: string) => {
    if (!workspaceId || !deploymentId) return;
    try {
      setImpairSaving(true);
      const body: any = { edgeId, action };
      if (action === "set") {
        const delayMs = impair.delayMs.trim() ? Number(impair.delayMs.trim()) : undefined;
        const jitterMs = impair.jitterMs.trim() ? Number(impair.jitterMs.trim()) : undefined;
        const lossPct = impair.lossPct.trim() ? Number(impair.lossPct.trim()) : undefined;
        const rateKbps = impair.rateKbps.trim() ? Number(impair.rateKbps.trim()) : undefined;
        if (Number.isFinite(delayMs)) body.delayMs = delayMs;
        if (Number.isFinite(jitterMs)) body.jitterMs = jitterMs;
        if (Number.isFinite(lossPct)) body.lossPct = lossPct;
        if (Number.isFinite(rateKbps)) body.rateKbps = rateKbps;
      }
      const resp = await setDeploymentLinkImpairment(workspaceId, deploymentId, body);
      const failed = resp.results.filter((r) => r.error);
      if (failed.length) {
        toast.error("Link impairment applied with errors", { description: failed.map((r) => `${r.node}: ${r.error}`).join("; ") });
      } else {
        toast.success(action === "clear" ? "Link impairment cleared" : "Link impairment applied");
      }
    } catch (e: any) {
      toast.error("Failed to apply link impairment", { description: e?.message ?? String(e) });
    } finally {
      setImpairSaving(false);
    }
  }, [deploymentId, impair.delayMs, impair.jitterMs, impair.lossPct, impair.rateKbps, workspaceId]);

  return (
    <div className="h-[600px] w-full border rounded-xl bg-background/50 overflow-hidden relative" ref={ref}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        nodeTypes={nodeTypes}
        fitView
        className="bg-muted/10"
      >
        <Panel position="top-right">
          <Button 
            variant="outline" 
            size="sm" 
            className="shadow-sm bg-background/80 backdrop-blur"
            onClick={() => ref.current && downloadImage(ref.current, 'topology.png')}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PNG
          </Button>
        </Panel>
        <Controls />
        <MiniMap zoomable pannable className="bg-background border rounded-lg" />
        <Background gap={12} size={1} />
      </ReactFlow>

      {enableTerminal && workspaceId && deploymentId ? (
        <TerminalModal
          open={!!terminalNode}
          onOpenChange={(open) => {
            if (!open) setTerminalNode(null);
          }}
          workspaceId={workspaceId}
          deploymentId={deploymentId}
          nodeId={terminalNode?.id ?? ""}
          nodeKind={terminalNode?.kind ?? ""}
        />
      ) : null}

      {workspaceId && deploymentId ? (
        <NodeLogsModal
          open={!!logsNode}
          onOpenChange={(open) => {
            if (!open) setLogsNode(null);
          }}
          workspaceId={workspaceId}
          deploymentId={deploymentId}
          nodeId={logsNode?.id ?? ""}
          nodeKind={logsNode?.kind ?? ""}
          nodeIp={logsNode?.ip ?? ""}
        />
      ) : null}

      {nodeMenu && workspaceId && deploymentId ? (
        <div
          className="absolute z-50"
          style={{ left: nodeMenu.x, top: nodeMenu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Card className="w-64 shadow-lg border bg-background/95 backdrop-blur">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Node Actions</CardTitle>
              <div className="text-xs text-muted-foreground font-mono truncate">
                {String((nodeMenu.node as any)?.data?.label ?? nodeMenu.node.id)}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <Button
                size="sm"
                className="w-full"
                disabled={!enableTerminal}
                onClick={() => {
                  const kind = String((nodeMenu.node as any)?.data?.kind ?? "");
                  setNodeMenu(null);
                  setTerminalNode({ id: String(nodeMenu.node.id), kind });
                }}
              >
                Open terminal…
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => {
                  const kind = String((nodeMenu.node as any)?.data?.kind ?? "");
                  const ip = String((nodeMenu.node as any)?.data?.ip ?? "");
                  setNodeMenu(null);
                  setLogsNode({ id: String(nodeMenu.node.id), kind, ip });
                }}
              >
                View logs…
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  const ip = String((nodeMenu.node as any)?.data?.ip ?? "").trim();
                  if (!ip) {
                    toast.error("No management IP available");
                    return;
                  }
                  void navigator.clipboard?.writeText(ip);
                  toast.success("Copied management IP");
                  setNodeMenu(null);
                }}
              >
                Copy management IP
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  const name = String(nodeMenu.node.id);
                  void navigator.clipboard?.writeText(name);
                  toast.success("Copied node name");
                  setNodeMenu(null);
                }}
              >
                Copy node name
              </Button>
              <Button size="sm" variant="ghost" className="w-full" onClick={() => setNodeMenu(null)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {edgeMenu && workspaceId && deploymentId ? (
        <div
          className="absolute z-50"
          style={{ left: edgeMenu.x, top: edgeMenu.y }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <Card className="w-64 shadow-lg border bg-background/95 backdrop-blur">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Link Actions</CardTitle>
              <div className="text-xs text-muted-foreground font-mono truncate">
                {String(edgeMenu.edge.label ?? edgeMenu.edge.id)}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelectedEdge({ id: String(edgeMenu.edge.id), label: String(edgeMenu.edge.label ?? "") });
                  setEdgeMenu(null);
                  setImpairOpen(true);
                }}
              >
                Configure impairment…
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                disabled={impairSaving}
                onClick={() => {
                  const id = String(edgeMenu.edge.id);
                  setEdgeMenu(null);
                  applyImpairment("clear", id);
                }}
              >
                Clear impairment
              </Button>
              <Button size="sm" variant="ghost" className="w-full" onClick={() => setEdgeMenu(null)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Dialog
        open={impairOpen}
        onOpenChange={(open) => {
          setImpairOpen(open);
          if (!open) setSelectedEdge(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Link Impairment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEdge?.label ? (
              <div className="text-xs text-muted-foreground font-mono truncate">{selectedEdge.label}</div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="delayMs">Delay (ms)</Label>
                <Input
                  id="delayMs"
                  inputMode="numeric"
                  placeholder="e.g. 50"
                  value={impair.delayMs}
                  onChange={(e) => setImpair((p) => ({ ...p, delayMs: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="jitterMs">Jitter (ms)</Label>
                <Input
                  id="jitterMs"
                  inputMode="numeric"
                  placeholder="e.g. 10"
                  value={impair.jitterMs}
                  onChange={(e) => setImpair((p) => ({ ...p, jitterMs: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="lossPct">Loss (%)</Label>
                <Input
                  id="lossPct"
                  inputMode="decimal"
                  placeholder="e.g. 1.0"
                  value={impair.lossPct}
                  onChange={(e) => setImpair((p) => ({ ...p, lossPct: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="rateKbps">Rate (kbit/s)</Label>
                <Input
                  id="rateKbps"
                  inputMode="numeric"
                  placeholder="e.g. 100000"
                  value={impair.rateKbps}
                  onChange={(e) => setImpair((p) => ({ ...p, rateKbps: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setImpairOpen(false)} disabled={impairSaving}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const id = String(selectedEdge?.id ?? "");
                  if (!id) {
                    toast.error("No link selected");
                    return;
                  }
                  applyImpairment("set", id).finally(() => setImpairOpen(false));
                }}
                disabled={impairSaving}
              >
                Apply
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Tip: Right-click a link in the topology to configure impairment.
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
