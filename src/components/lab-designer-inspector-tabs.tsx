import {
	Tabs,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs";
import { LabDesignerInspectorTabsProps } from "@/components/lab-designer-inspector-tab-types";
import { LabDesignerLabTabPanel } from "@/components/lab-designer-inspector-lab-tab-panel";
import { LabDesignerLinkTab } from "@/components/lab-designer-inspector-link-tab";
import { LabDesignerNodeTab } from "@/components/lab-designer-inspector-node-tab";
import { LabDesignerYamlTabPanel } from "@/components/lab-designer-inspector-yaml-tab";

export function LabDesignerInspectorTabs({
	page,
	selectedEdge,
}: LabDesignerInspectorTabsProps) {
	return (
		<Tabs defaultValue="lab" className="flex h-full min-h-0 flex-col">
			<TabsList className="grid w-full grid-cols-4 bg-slate-100">
				<TabsTrigger value="lab">Lab</TabsTrigger>
				<TabsTrigger value="node">Node</TabsTrigger>
				<TabsTrigger value="link">Link</TabsTrigger>
				<TabsTrigger value="yaml">YAML</TabsTrigger>
			</TabsList>

			<LabDesignerLabTabPanel page={page} />
			<LabDesignerNodeTab page={page} />
			<LabDesignerLinkTab page={page} selectedEdge={selectedEdge} />
			<LabDesignerYamlTabPanel page={page} />
		</Tabs>
	);
}
