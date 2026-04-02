import { useLabDesignerPage } from "@/hooks/use-lab-designer-page";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

type LabDesignerPageState = ReturnType<typeof useLabDesignerPage>;

type SelectedEdge = LabDesignerPageState["selectedEdge"];

export function LabDesignerStatusRail({
	page,
	selectedEdge,
}: {
	page: LabDesignerPageState;
	selectedEdge: SelectedEdge;
}) {
	return (
		<div className="grid gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr] dark:bg-card/95">
			<div className="space-y-1">
				<div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
					Status
				</div>
				<div className="flex items-center gap-2 text-sm text-foreground">
					{page.lastValidation?.valid ? (
						<CheckCircle2 className="h-4 w-4 text-emerald-600" />
					) : (
						<AlertTriangle className="h-4 w-4 text-amber-600" />
					)}
					{page.lastValidation?.valid
						? "Topology validated against the shared contract"
						: "Draft topology has not passed validation yet"}
				</div>
			</div>
			<div className="space-y-1">
				<div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
					Selection
				</div>
				<div className="text-sm text-foreground">
					{page.selectedNode
						? `Node ${String(page.selectedNode.data?.label ?? page.selectedNode.id)}`
						: selectedEdge
							? `Link ${selectedEdge.id}`
							: "Lab metadata"}
				</div>
			</div>
			<div className="space-y-1">
				<div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
					Warnings
				</div>
				<div className="text-sm text-foreground">
					{(page.lastValidation?.warnings?.length ?? 0) +
						page.missingImageWarnings.length +
						page.otherWarnings.length}
				</div>
			</div>
			<div className="space-y-1">
				<div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
					Deploy target
				</div>
				<div className="text-sm text-foreground">
					KNE in-cluster
				</div>
			</div>
		</div>
	);
}
