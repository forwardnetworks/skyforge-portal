import { TabsContent } from "@/components/ui/tabs";
import { LabDesignerInspectorLinkTabProps } from "@/components/lab-designer-inspector-tab-types";
import { LabDesignerLinkEditor } from "@/components/lab-designer-selection-editors";

function SelectionEmptyPanel({ message }: { message: string }) {
	return (
		<div className="space-y-4 pt-3">
			<div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
				{message}
			</div>
		</div>
	);
}

export function LabDesignerLinkTab({
	page,
	selectedEdge,
}: LabDesignerInspectorLinkTabProps) {
	return (
		<TabsContent value="link" className="min-h-0 flex-1 overflow-auto">
			{!selectedEdge ? (
				<SelectionEmptyPanel message="Select a link on the canvas to edit source and target interfaces, label, MTU, and notes." />
			) : (
				<LabDesignerLinkEditor page={page} selectedEdge={selectedEdge} />
			)}
		</TabsContent>
	);
}
