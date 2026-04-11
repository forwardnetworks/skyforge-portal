import { Button } from "@/components/ui/button";
import {
	ChevronsDownUp,
	ChevronsUpDown,
	LayoutGrid,
	Link2,
	Maximize2,
	Minimize2,
	PanelLeftClose,
	PanelLeftOpen,
	PanelRightClose,
	PanelRightOpen,
	Plus,
} from "lucide-react";
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
						variant={props.isFocusMode ? "default" : "outline"}
						onClick={props.onToggleFocusMode}
						title={
							props.isFocusMode
								? "Restore header and side panels"
								: "Focus canvas by collapsing header and side panels"
						}
					>
						{props.isFocusMode ? (
							<Minimize2 className="mr-2 h-4 w-4" />
						) : (
							<Maximize2 className="mr-2 h-4 w-4" />
						)}
						{props.isFocusMode ? "Focus: on" : "Focus: off"}
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={props.onToggleCommandBar}
						title={
							props.showCommandBar
								? "Collapse header controls"
								: "Expand header controls"
						}
					>
						{props.showCommandBar ? (
							<ChevronsDownUp className="mr-2 h-4 w-4" />
						) : (
							<ChevronsUpDown className="mr-2 h-4 w-4" />
						)}
						{props.showCommandBar ? "Header: on" : "Header: off"}
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={props.onTogglePalette}
						title={props.showPalette ? "Collapse palette" : "Expand palette"}
					>
						{props.showPalette ? (
							<PanelLeftClose className="mr-2 h-4 w-4" />
						) : (
							<PanelLeftOpen className="mr-2 h-4 w-4" />
						)}
						{props.showPalette ? "Palette: on" : "Palette: off"}
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={props.onToggleInspector}
						title={
							props.showInspector ? "Collapse inspector" : "Expand inspector"
						}
					>
						{props.showInspector ? (
							<PanelRightClose className="mr-2 h-4 w-4" />
						) : (
							<PanelRightOpen className="mr-2 h-4 w-4" />
						)}
						{props.showInspector ? "Inspector: on" : "Inspector: off"}
					</Button>
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
				{props.showPalette ? <LabDesignerPalettePanel {...props} /> : null}
				<LabDesignerCanvasSurface {...props} />
			</div>
		</div>
	);
}
