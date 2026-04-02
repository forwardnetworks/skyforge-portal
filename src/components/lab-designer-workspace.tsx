import { Button } from "@/components/ui/button";
import { LayoutGrid, Link2, Plus } from "lucide-react";
import { LabDesignerCanvasSurface } from "./lab-designer-canvas-surface";
import { LabDesignerPalettePanel } from "./lab-designer-palette-panel";
import type { LabDesignerWorkspaceProps } from "./lab-designer-workspace-types";

export function LabDesignerWorkspace(props: LabDesignerWorkspaceProps) {
	return (
		<div className="flex min-h-0 flex-col rounded-2xl border border-border/70 bg-card/85 p-3 dark:bg-card/95">
			<div className="flex items-center justify-between gap-3 pb-3">
				<div>
					<div className="text-sm font-semibold text-foreground">Canvas</div>
					<div className="text-xs text-muted-foreground">
						Palette-driven topology editing with explicit interfaces.
					</div>
				</div>
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
			<div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border bg-background/50">
				<LabDesignerPalettePanel {...props} />
				<LabDesignerCanvasSurface {...props} />
			</div>
		</div>
	);
}
