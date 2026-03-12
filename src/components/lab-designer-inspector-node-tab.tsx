import { TabsContent } from "@/components/ui/tabs";
import { LabDesignerInspectorPageState } from "@/components/lab-designer-inspector-tab-types";
import { LabDesignerNodeEditor } from "@/components/lab-designer-selection-editors";

export function LabDesignerNodeTab({ page }: { page: LabDesignerInspectorPageState }) {
	return (
		<TabsContent value="node" className="min-h-0 flex-1 overflow-auto">
			<LabDesignerNodeEditor page={page} />
		</TabsContent>
	);
}
