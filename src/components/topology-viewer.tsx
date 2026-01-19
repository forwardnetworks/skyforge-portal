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
import { Server, Network, Laptop, Cloud, Download } from "lucide-react";
import { useDownloadImage } from '@/hooks/use-download-image';
import type { DeploymentTopology } from "@/lib/skyforge-api";
import { TerminalModal } from "@/components/terminal-modal";

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

  useEffect(() => {
    setNodes(derived.nodes);
    setEdges(derived.edges);
  }, [derived.edges, derived.nodes, setEdges, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (!enableTerminal) return;
      if (!workspaceId || !deploymentId) return;
      event.preventDefault();
      const kind = String((node as any)?.data?.kind ?? "");
      setTerminalNode({ id: String(node.id), kind });
    },
    [deploymentId, enableTerminal, workspaceId]
  );

  return (
    <div className="h-[600px] w-full border rounded-xl bg-background/50 overflow-hidden relative" ref={ref}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeContextMenu={onNodeContextMenu}
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
    </div>
  );
}
