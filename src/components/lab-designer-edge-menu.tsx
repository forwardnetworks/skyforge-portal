import type { LabDesignerWorkspaceProps } from "@/components/lab-designer-workspace-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = Pick<
	LabDesignerWorkspaceProps,
	| "edgeMenu"
	| "edges"
	| "setEdges"
	| "closeMenus"
	| "selectedEdgeId"
	| "setSelectedEdgeId"
	| "setSelectedNodeId"
	| "setInspectorTab"
	| "ensureInspectorVisible"
>;

export function LabDesignerEdgeMenu(props: Props) {
	if (!props.edgeMenu) return null;

	return (
		<div
			className="absolute z-50"
			style={{ left: props.edgeMenu.x, top: props.edgeMenu.y }}
			onMouseDown={(e) => e.stopPropagation()}
			onContextMenu={(e) => e.preventDefault()}
		>
			<Card className="w-60 shadow-lg border bg-background/95 backdrop-blur">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-sm">Link</CardTitle>
					<div className="text-xs text-muted-foreground font-mono truncate">
						{props.edges.find(
							(edge) => String(edge.id) === props.edgeMenu?.edgeId,
						)?.label ?? props.edgeMenu.edgeId}
					</div>
				</CardHeader>
				<CardContent className="p-3 pt-0 space-y-2">
					<Button
						size="sm"
						className="w-full"
						onClick={() => {
							props.setSelectedEdgeId(props.edgeMenu!.edgeId);
							props.setSelectedNodeId("");
							props.ensureInspectorVisible();
							props.setInspectorTab("link");
							props.closeMenus();
						}}
					>
						Edit…
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						onClick={() => {
							const edge = props.edges.find(
								(item) => String(item.id) === props.edgeMenu?.edgeId,
							);
							if (!edge) return;
							const next = window.prompt(
								"Link label",
								String(edge.label ?? ""),
							);
							if (next == null) return;
							props.setEdges((current) =>
								current.map((item) =>
									String(item.id) === props.edgeMenu?.edgeId
										? {
												...item,
												label: next,
												data: {
													...item.data,
													label: next || undefined,
												},
											}
										: item,
								),
							);
							props.closeMenus();
						}}
					>
						Rename…
					</Button>
					<Button
						size="sm"
						variant="destructive"
						className="w-full"
						onClick={() => {
							props.setEdges((current) =>
								current.filter(
									(edge) => String(edge.id) !== props.edgeMenu?.edgeId,
								),
							);
							if (props.selectedEdgeId === props.edgeMenu?.edgeId) {
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
