import { LabDesignerLabTabPanel } from "@/components/lab-designer-inspector-lab-tab-panel";
import { LabDesignerLinkTab } from "@/components/lab-designer-inspector-link-tab";
import { LabDesignerNodeTab } from "@/components/lab-designer-inspector-node-tab";
import type { LabDesignerInspectorTabsProps } from "@/components/lab-designer-inspector-tab-types";
import { LabDesignerYamlTabPanel } from "@/components/lab-designer-inspector-yaml-tab";
import type { LabDesignerInspectorTab } from "@/components/lab-designer-types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LabDesignerInspectorTabs({
	page,
	selectedEdge,
}: LabDesignerInspectorTabsProps) {
	return (
		<Tabs
			value={page.inspectorTab}
			onValueChange={(value) =>
				page.setInspectorTab(value as LabDesignerInspectorTab)
			}
			className="flex h-full min-h-0 flex-col"
		>
			<TabsList className="grid w-full grid-cols-4 bg-muted text-muted-foreground">
				<TabsTrigger value="lab">Lab</TabsTrigger>
				<TabsTrigger value="node">
					{page.selectedNode ? "Node *" : "Node"}
				</TabsTrigger>
				<TabsTrigger value="link">
					{selectedEdge ? "Link *" : "Link"}
				</TabsTrigger>
				<TabsTrigger value="yaml">YAML</TabsTrigger>
			</TabsList>

			<LabDesignerLabTabPanel page={page} />
			<LabDesignerNodeTab page={page} />
			<LabDesignerLinkTab page={page} selectedEdge={selectedEdge} />
			<LabDesignerYamlTabPanel page={page} />
		</Tabs>
	);
}
