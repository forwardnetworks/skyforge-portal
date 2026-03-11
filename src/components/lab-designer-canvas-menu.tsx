import type { LabDesignerWorkspaceProps } from "@/components/lab-designer-workspace-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = Pick<
	LabDesignerWorkspaceProps,
	| "canvasMenu"
	| "closeMenus"
	| "addNode"
	| "autoLayout"
	| "nodes"
	| "rfInstance"
>;

export function LabDesignerCanvasMenu(props: Props) {
	if (!props.canvasMenu) return null;

	return (
		<div
			className="absolute z-50"
			style={{ left: props.canvasMenu.x, top: props.canvasMenu.y }}
			onContextMenu={(e) => e.preventDefault()}
		>
			<Card className="w-60 shadow-lg border bg-background/95 backdrop-blur">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-sm">Canvas</CardTitle>
				</CardHeader>
				<CardContent className="p-3 pt-0 space-y-2">
					<Button
						size="sm"
						className="w-full"
						onClick={() => {
							props.addNode();
							props.closeMenus();
						}}
					>
						Add node
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						onClick={() => {
							props.autoLayout();
							props.closeMenus();
						}}
						disabled={props.nodes.length < 2}
					>
						Auto-layout
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						onClick={() => {
							props.rfInstance?.fitView({
								padding: 0.15,
								duration: 250,
							});
							props.closeMenus();
						}}
						disabled={!props.rfInstance}
					>
						Fit view
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
