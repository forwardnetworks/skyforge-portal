import { TabsContent } from "@/components/ui/tabs";
import { LabDesignerInspectorLabTabProps } from "@/components/lab-designer-inspector-tab-types";
import { LabDesignerLabTab } from "@/components/lab-designer-inspector-lab-tab";

export function LabDesignerLabTabPanel({ page }: LabDesignerInspectorLabTabProps) {
	return (
		<TabsContent value="lab" className="min-h-0 flex-1 overflow-auto">
			<LabDesignerLabTab page={page} />
		</TabsContent>
	);
}
