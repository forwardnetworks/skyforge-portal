import type { LabDesignerWorkspaceProps } from "@/components/lab-designer-workspace-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Props = Pick<
	LabDesignerWorkspaceProps,
	| "nodeMenu"
	| "nodes"
	| "edges"
	| "closeMenus"
	| "setSelectedNodeId"
	| "importDeploymentId"
	| "openImportedTool"
	| "renameNode"
	| "setNodes"
	| "setEdges"
	| "selectedNodeId"
	| "selectedEdgeId"
	| "setLinkMode"
	| "setPendingLinkSource"
	| "setSelectedEdgeId"
	| "setInspectorTab"
	| "ensureInspectorVisible"
>;

export function LabDesignerNodeMenu(props: Props) {
	if (!props.nodeMenu) return null;

	return (
		<div
			className="absolute z-50"
			style={{ left: props.nodeMenu.x, top: props.nodeMenu.y }}
			onMouseDown={(e) => e.stopPropagation()}
			onContextMenu={(e) => e.preventDefault()}
		>
			<Card className="w-64 shadow-lg border bg-background/95 backdrop-blur">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-sm">Node</CardTitle>
					<div className="text-xs text-muted-foreground font-mono truncate">
						{String(
							props.nodes.find(
								(node) => String(node.id) === props.nodeMenu?.nodeId,
							)?.data?.label ?? props.nodeMenu.nodeId,
						)}
					</div>
				</CardHeader>
				<CardContent className="p-3 pt-0 space-y-2">
					<Button
						size="sm"
						className="w-full"
						onClick={() => {
							props.setSelectedNodeId(props.nodeMenu!.nodeId);
							props.setSelectedEdgeId("");
							props.ensureInspectorVisible();
							props.setInspectorTab("node");
							props.closeMenus();
						}}
					>
						Edit…
					</Button>
					{props.importDeploymentId ? (
						<div className="grid grid-cols-3 gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									props.openImportedTool({
										action: "terminal",
										node: props.nodeMenu!.nodeId,
									});
									props.closeMenus();
								}}
							>
								Terminal
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									props.openImportedTool({
										action: "logs",
										node: props.nodeMenu!.nodeId,
									});
									props.closeMenus();
								}}
							>
								Logs
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									props.openImportedTool({
										action: "describe",
										node: props.nodeMenu!.nodeId,
									});
									props.closeMenus();
								}}
							>
								Describe
							</Button>
						</div>
					) : null}
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						onClick={() => {
							props.renameNode(props.nodeMenu!.nodeId);
							props.closeMenus();
						}}
					>
						Rename…
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						onClick={() => {
							const node = props.nodes.find(
								(item) => String(item.id) === props.nodeMenu?.nodeId,
							);
							if (!node) return;
							const used = new Set(props.nodes.map((item) => String(item.id)));
							let i = props.nodes.length + 1;
							let nextId = `${String(node.id)}-${i}`;
							while (used.has(nextId)) {
								i++;
								nextId = `${String(node.id)}-${i}`;
							}
							const clone = {
								...node,
								id: nextId,
								position: {
									x: node.position.x + 32,
									y: node.position.y + 32,
								},
								data: { ...node.data, label: nextId },
							};
							props.setNodes((current) => [...current, clone]);
							props.setSelectedNodeId(nextId);
							props.closeMenus();
						}}
					>
						Duplicate
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						onClick={() => {
							props.setLinkMode(true);
							props.setPendingLinkSource(props.nodeMenu!.nodeId);
							props.closeMenus();
						}}
					>
						Start link
					</Button>
					<Button
						size="sm"
						variant="secondary"
						className="w-full"
						onClick={() => {
							const label =
								props.nodes.find(
									(node) => String(node.id) === props.nodeMenu?.nodeId,
								)?.data?.label ?? props.nodeMenu?.nodeId;
							void navigator.clipboard?.writeText(String(label));
							toast.success("Copied");
							props.closeMenus();
						}}
					>
						Copy name
					</Button>
					<Button
						size="sm"
						variant="destructive"
						className="w-full"
						onClick={() => {
							const id = props.nodeMenu!.nodeId;
							const deletingEdgeIds = new Set(
								props.edges
									.filter(
										(edge) =>
											String(edge.source) === id || String(edge.target) === id,
									)
									.map((edge) => String(edge.id)),
							);
							props.setNodes((current) =>
								current.filter((node) => String(node.id) !== id),
							);
							props.setEdges((current) =>
								current.filter(
									(edge) =>
										String(edge.source) !== id && String(edge.target) !== id,
								),
							);
							if (props.selectedNodeId === id) props.setSelectedNodeId("");
							if (deletingEdgeIds.has(props.selectedEdgeId)) {
								props.setSelectedEdgeId("");
							}
							props.closeMenus();
						}}
					>
						Delete
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
