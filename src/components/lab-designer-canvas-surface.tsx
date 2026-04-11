import type { DesignEdge, DesignNode } from "@/components/lab-designer-types";
import type { LabDesignerWorkspaceProps } from "@/components/lab-designer-workspace-types";
import {
	Background,
	Controls,
	MiniMap,
	ReactFlow,
	addEdge,
} from "@xyflow/react";
import { LabDesignerCanvasMenu } from "./lab-designer-canvas-menu";
import { LabDesignerEdgeMenu } from "./lab-designer-edge-menu";
import { LabDesignerNodeMenu } from "./lab-designer-node-menu";

type Props = Pick<
	LabDesignerWorkspaceProps,
	| "nodes"
	| "edges"
	| "rfRef"
	| "onDrop"
	| "onDragOver"
	| "onCanvasKeyDown"
	| "closeMenus"
	| "onNodesChangeWithWarnings"
	| "onEdgesChangeWithWarnings"
	| "nodeTypes"
	| "setRfInstance"
	| "setSelectedNodeId"
	| "selectedEdgeId"
	| "setSelectedEdgeId"
	| "setNodeMenu"
	| "setEdgeMenu"
	| "setCanvasMenu"
	| "nodeMenu"
	| "edgeMenu"
	| "canvasMenu"
	| "importDeploymentId"
	| "openImportedTool"
	| "renameNode"
	| "selectedNodeId"
	| "setNodes"
	| "setEdges"
	| "setLinkMode"
	| "setPendingLinkSource"
	| "rfInstance"
	| "setInspectorTab"
	| "ensureInspectorVisible"
	| "snapToGrid"
	| "linkMode"
	| "pendingLinkSource"
	| "addNode"
	| "autoLayout"
>;

function nextInterfaceName(
	nodes: DesignNode[],
	edges: DesignEdge[],
	nodeId: string,
): string {
	const used = new Set<string>();
	const node = nodes.find((item) => String(item.id) === nodeId);
	for (const iface of node?.data?.interfaces ?? []) {
		const name = String(iface.name ?? "").trim();
		if (name) used.add(name);
	}
	for (const edge of edges) {
		if (String(edge.source) === nodeId) {
			const name = String(edge.data?.sourceIf ?? "").trim();
			if (name) used.add(name);
		}
		if (String(edge.target) === nodeId) {
			const name = String(edge.data?.targetIf ?? "").trim();
			if (name) used.add(name);
		}
	}
	let index = 1;
	let candidate = `eth${index}`;
	while (used.has(candidate)) {
		index += 1;
		candidate = `eth${index}`;
	}
	return candidate;
}

function edgeLabel(
	source: string,
	sourceIf: string,
	target: string,
	targetIf: string,
): string {
	return `${source}:${sourceIf} ↔ ${target}:${targetIf}`;
}

export function LabDesignerCanvasSurface(props: Props) {
	return (
		<div
			className="flex-1 outline-none relative"
			ref={props.rfRef}
			onDrop={props.onDrop}
			onDragOver={props.onDragOver}
			tabIndex={0}
			onKeyDown={props.onCanvasKeyDown}
			onMouseDown={(event) => {
				(event.currentTarget as HTMLDivElement).focus();
				props.closeMenus();
			}}
			onContextMenu={(e) => e.preventDefault()}
		>
			{props.linkMode ? (
				<div className="absolute z-10 m-3 rounded-lg border bg-background/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
					{props.pendingLinkSource ? (
						<>
							Link mode: select target for{" "}
							<span className="font-mono text-foreground">
								{props.pendingLinkSource}
							</span>
						</>
					) : (
						<>Link mode: click a source node, then click a target node</>
					)}
				</div>
			) : null}
			<ReactFlow
				nodes={props.nodes}
				edges={props.edges}
				onNodesChange={props.onNodesChangeWithWarnings}
				onEdgesChange={props.onEdgesChangeWithWarnings}
				onConnect={(connection) => {
					if (!connection.source || !connection.target) return;
					const sourceIf = nextInterfaceName(
						props.nodes,
						props.edges,
						String(connection.source),
					);
					const targetIf = nextInterfaceName(
						props.nodes,
						props.edges,
						String(connection.target),
					);
					const label = edgeLabel(
						String(connection.source),
						sourceIf,
						String(connection.target),
						targetIf,
					);
					props.setEdges((current) =>
						addEdge(
							{
								...connection,
								label,
								data: {
									label,
									sourceIf,
									targetIf,
								},
							},
							current,
						),
					);
				}}
				fitView
				onNodeClick={(_, node) => {
					const id = String(node.id);
					if (props.linkMode) {
						if (!props.pendingLinkSource) {
							props.setPendingLinkSource(id);
							return;
						}
						if (props.pendingLinkSource === id) {
							props.setPendingLinkSource("");
							return;
						}
						const sourceIf = nextInterfaceName(
							props.nodes,
							props.edges,
							props.pendingLinkSource,
						);
						const targetIf = nextInterfaceName(props.nodes, props.edges, id);
						const edgeId = `e-${props.pendingLinkSource}-${id}-${Date.now()}`;
						props.setEdges((current) =>
							addEdge(
								{
									id: edgeId,
									source: props.pendingLinkSource,
									target: id,
									label: edgeLabel(
										props.pendingLinkSource,
										sourceIf,
										id,
										targetIf,
									),
									data: {
										label: edgeLabel(
											props.pendingLinkSource,
											sourceIf,
											id,
											targetIf,
										),
										sourceIf,
										targetIf,
									},
								},
								current,
							),
						);
						props.setPendingLinkSource("");
						return;
					}
					props.setSelectedNodeId(id);
					props.setSelectedEdgeId("");
					props.ensureInspectorVisible();
					props.setInspectorTab("node");
				}}
				onNodeContextMenu={(event, node) => {
					event.preventDefault();
					const rect = props.rfRef.current?.getBoundingClientRect();
					const x = rect ? event.clientX - rect.left : event.clientX;
					const y = rect ? event.clientY - rect.top : event.clientY;
					props.setNodeMenu({ x, y, nodeId: String(node.id) });
					props.setEdgeMenu(null);
					props.setCanvasMenu(null);
					props.ensureInspectorVisible();
					props.setInspectorTab("node");
				}}
				onEdgeClick={(_, edge) => {
					if (!edge?.id) return;
					props.setSelectedEdgeId(String(edge.id));
					props.setSelectedNodeId("");
					props.ensureInspectorVisible();
					props.setInspectorTab("link");
				}}
				onEdgeContextMenu={(event, edge) => {
					event.preventDefault();
					const rect = props.rfRef.current?.getBoundingClientRect();
					const x = rect ? event.clientX - rect.left : event.clientX;
					const y = rect ? event.clientY - rect.top : event.clientY;
					props.setEdgeMenu({ x, y, edgeId: String(edge.id) });
					props.setNodeMenu(null);
					props.setCanvasMenu(null);
					props.setSelectedEdgeId(String(edge.id));
					props.setSelectedNodeId("");
					props.ensureInspectorVisible();
					props.setInspectorTab("link");
				}}
				onPaneContextMenu={(event) => {
					event.preventDefault();
					const rect = props.rfRef.current?.getBoundingClientRect();
					const x = rect ? event.clientX - rect.left : event.clientX;
					const y = rect ? event.clientY - rect.top : event.clientY;
					props.setCanvasMenu({ x, y });
					props.setNodeMenu(null);
					props.setEdgeMenu(null);
				}}
				onInit={props.setRfInstance}
				snapToGrid={props.snapToGrid}
				snapGrid={[12, 12]}
				nodeTypes={props.nodeTypes}
			>
				<Controls />
				<MiniMap
					zoomable
					pannable
					className="bg-background border rounded-lg"
				/>
				<Background gap={12} size={1} />
			</ReactFlow>

			<LabDesignerNodeMenu {...props} />
			<LabDesignerEdgeMenu {...props} />
			<LabDesignerCanvasMenu {...props} />
		</div>
	);
}
