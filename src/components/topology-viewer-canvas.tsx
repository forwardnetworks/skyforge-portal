import { useDownloadImage } from "@/hooks/use-download-image";
import {
	Background,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	ReactFlow,
} from "@xyflow/react";
import type { RefObject } from "react";
import { toast } from "sonner";
import { topologyViewerNodeTypes } from "./topology-viewer-custom-node";
import { TopologyViewerToolsPanel } from "./topology-viewer-panels";

export function TopologyViewerCanvas(props: {
	ref: RefObject<HTMLDivElement | null>;
	nodes: Node[];
	edges: Edge[];
	onNodesChange: Parameters<typeof ReactFlow>[0]["onNodesChange"];
	onEdgesChange: Parameters<typeof ReactFlow>[0]["onEdgesChange"];
	onConnect: Parameters<typeof ReactFlow>[0]["onConnect"];
	onNodeContextMenu: Parameters<typeof ReactFlow>[0]["onNodeContextMenu"];
	onEdgeContextMenu: Parameters<typeof ReactFlow>[0]["onEdgeContextMenu"];
	onEdgeMouseEnter: Parameters<typeof ReactFlow>[0]["onEdgeMouseEnter"];
	onEdgeMouseMove: Parameters<typeof ReactFlow>[0]["onEdgeMouseMove"];
	onEdgeMouseLeave: Parameters<typeof ReactFlow>[0]["onEdgeMouseLeave"];
	onNodeDragStop: Parameters<typeof ReactFlow>[0]["onNodeDragStop"];
	search: string;
	setSearch: (value: string) => void;
	statsEnabled: boolean;
	toggleStats: () => void;
	statsAvailable: boolean;
	layoutMode: "grid" | "circle";
	toggleLayout: () => void;
	resetLayout: () => void;
	downloadInventory: () => void;
	downloadInventoryDisabled: boolean;
}) {
	const { downloadImage } = useDownloadImage();

	return (
		<ReactFlow
			nodes={props.nodes}
			edges={props.edges}
			onNodesChange={props.onNodesChange}
			onEdgesChange={props.onEdgesChange}
			onConnect={props.onConnect}
			onNodeContextMenu={props.onNodeContextMenu}
			onEdgeContextMenu={props.onEdgeContextMenu}
			onEdgeMouseEnter={props.onEdgeMouseEnter}
			onEdgeMouseMove={props.onEdgeMouseMove}
			onEdgeMouseLeave={props.onEdgeMouseLeave}
			onNodeDragStop={props.onNodeDragStop}
			nodeTypes={topologyViewerNodeTypes}
			fitView
			className="bg-muted/10"
		>
			<TopologyViewerToolsPanel
				search={props.search}
				setSearch={props.setSearch}
				statsEnabled={props.statsEnabled}
				toggleStats={props.toggleStats}
				statsAvailable={props.statsAvailable}
				layoutMode={props.layoutMode}
				toggleLayout={props.toggleLayout}
				resetLayout={props.resetLayout}
				downloadInventory={props.downloadInventory}
				downloadInventoryDisabled={props.downloadInventoryDisabled}
				downloadPng={() =>
					props.ref.current && downloadImage(props.ref.current, "topology.png")
				}
			/>
			<Controls />
			<MiniMap zoomable pannable className="bg-background border rounded-lg" />
			<Background gap={12} size={1} />
		</ReactFlow>
	);
}
