import { LabDesignerLinkEditorContent } from "@/components/lab-designer-link-editor";
import { LabDesignerNodeEditorContent } from "@/components/lab-designer-node-editor";
import type { LabDesignerLinkEditorProps, LabDesignerNodeEditorProps } from "@/components/lab-designer-editor-utils";

function SelectionEmptyPanel({ message }: { message: string }) {
	return (
		<div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
			{message}
		</div>
	);
}

export function LabDesignerNodeEditor({ page }: LabDesignerNodeEditorProps) {
	return (
		<div className="space-y-4 pt-3">
			{!page.selectedNode ? (
				<SelectionEmptyPanel message="Select a node on the canvas to edit kind, image, mgmt address, startup config, interfaces, and environment." />
			) : (
				<LabDesignerNodeEditorContent page={page} />
			)}
		</div>
	);
}

export function LabDesignerLinkEditor({
	page,
	selectedEdge,
}: LabDesignerLinkEditorProps) {
	return (
		<div className="space-y-4 pt-3">
			<LabDesignerLinkEditorContent page={page} selectedEdge={selectedEdge} />
		</div>
	);
}
