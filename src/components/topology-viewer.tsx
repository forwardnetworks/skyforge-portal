import { useCallback, useRef } from 'react';
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

const initialNodes: Node[] = [
  { id: '1', position: { x: 250, y: 0 }, data: { label: 'Internet', icon: 'cloud', status: 'running', ip: '0.0.0.0/0' }, type: 'custom' },
  { id: '2', position: { x: 100, y: 150 }, data: { label: 'Leaf-01', icon: 'switch', status: 'running', ip: '192.168.1.11' }, type: 'custom' },
  { id: '3', position: { x: 400, y: 150 }, data: { label: 'Leaf-02', icon: 'switch', status: 'running', ip: '192.168.1.12' }, type: 'custom' },
  { id: '4', position: { x: 50, y: 300 }, data: { label: 'Server-A', icon: 'server', status: 'running', ip: '192.168.1.101' }, type: 'custom' },
  { id: '5', position: { x: 200, y: 300 }, data: { label: 'Server-B', icon: 'server', status: 'stopped', ip: '192.168.1.102' }, type: 'custom' },
  { id: '6', position: { x: 350, y: 300 }, data: { label: 'Client-1', icon: 'client', status: 'running', ip: '192.168.1.201' }, type: 'custom' },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-3', source: '2', target: '3', style: { strokeDasharray: '5,5' } },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e2-5', source: '2', target: '5' },
  { id: 'e3-6', source: '3', target: '6' },
];

export function TopologyViewer() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const ref = useRef<HTMLDivElement>(null);
  const { downloadImage } = useDownloadImage();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="h-[600px] w-full border rounded-xl bg-background/50 overflow-hidden relative" ref={ref}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
    </div>
  );
}