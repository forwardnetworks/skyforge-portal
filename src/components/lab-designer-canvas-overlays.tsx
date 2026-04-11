import type {
	DesignNode,
	DesignerAnnotation,
	DesignerGroup,
} from "@/components/lab-designer-types";

type Viewport = { x: number; y: number; zoom: number };

function projectFlowPoint(
	viewport: Viewport,
	point: { x: number; y: number },
): { x: number; y: number } {
	const zoom = Number.isFinite(viewport.zoom) && viewport.zoom > 0 ? viewport.zoom : 1;
	return {
		x: point.x * zoom + viewport.x,
		y: point.y * zoom + viewport.y,
	};
}

export function LabDesignerCanvasOverlays(props: {
	annotations: DesignerAnnotation[];
	groups: DesignerGroup[];
	nodes: DesignNode[];
	viewport: Viewport;
}) {
	const nodeIDs = new Set(props.nodes.map((node) => String(node.id)));
	const groups = props.groups
		.map((group) => ({
			...group,
			activeNodeCount: group.nodeIds.filter((id) => nodeIDs.has(String(id))).length,
		}))
		.filter((group) => group.label.trim() || group.nodeIds.length > 0);

	const annotations = props.annotations.filter(
		(annotation) => annotation.title.trim() || annotation.text.trim(),
	);

	if (annotations.length === 0 && groups.length === 0) return null;

	return (
		<div className="pointer-events-none absolute inset-0 z-20">
			{groups.length > 0 ? (
				<div
					data-testid="designer-group-overlay"
					className="absolute right-3 top-3 max-w-[280px] space-y-1 rounded-lg border bg-background/85 px-3 py-2 text-xs backdrop-blur"
				>
					<div className="font-semibold text-foreground">Groups</div>
					{groups.map((group) => (
						<div key={group.id} className="text-muted-foreground">
							<span className="text-foreground">
								{group.label.trim() || group.id}
							</span>{" "}
							({group.activeNodeCount}/{group.nodeIds.length})
						</div>
					))}
				</div>
			) : null}

			{annotations.map((annotation) => {
				const point = projectFlowPoint(props.viewport, {
					x: annotation.x,
					y: annotation.y,
				});
				return (
					<div
						key={annotation.id}
						data-testid="designer-annotation-overlay"
						className="absolute max-w-[260px] rounded-md border border-amber-400/30 bg-amber-100/85 px-2 py-1 text-xs text-amber-950 shadow-sm dark:bg-amber-200/80"
						style={{ left: `${point.x}px`, top: `${point.y}px` }}
					>
						{annotation.title.trim() ? (
							<div className="font-semibold">{annotation.title}</div>
						) : null}
						{annotation.text.trim() ? <div>{annotation.text}</div> : null}
					</div>
				);
			})}
		</div>
	);
}
