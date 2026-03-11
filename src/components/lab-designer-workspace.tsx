import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, Link2, Plus } from "lucide-react";
import { LabDesignerCanvasSurface } from "./lab-designer-canvas-surface";
import { LabDesignerPalettePanel } from "./lab-designer-palette-panel";
import type { LabDesignerWorkspaceProps } from "./lab-designer-workspace-types";

export function LabDesignerWorkspace(props: LabDesignerWorkspaceProps) {
	return (
		<Card className="flex flex-col min-h-0">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between gap-3">
					<CardTitle>Topology</CardTitle>
					<div className="flex items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => props.onSnapToGridChange(!props.snapToGrid)}
						>
							{props.snapToGrid ? "Snap: on" : "Snap: off"}
						</Button>
						<Button
							size="sm"
							variant={props.linkMode ? "default" : "outline"}
							onClick={props.onLinkModeToggle}
							title="Create links by clicking a source node, then a target node"
						>
							<Link2 className="mr-2 h-4 w-4" />
							{props.linkMode ? "Link: on" : "Link: off"}
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={props.autoLayout}
							disabled={props.nodes.length < 2}
						>
							<LayoutGrid className="mr-2 h-4 w-4" />
							Auto-layout
						</Button>
						<Button size="sm" variant="outline" onClick={props.addNode}>
							<Plus className="mr-2 h-4 w-4" />
							Add node
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex-1 min-h-0">
				<div className="flex h-full w-full border rounded-xl overflow-hidden bg-background/50">
					<LabDesignerPalettePanel {...props} />
					<LabDesignerCanvasSurface {...props} />
				</div>
			</CardContent>
		</Card>
	);
}
