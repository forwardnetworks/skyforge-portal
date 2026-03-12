import { useLabDesignerPage } from "@/hooks/use-lab-designer-page";

type LabDesignerPageState = ReturnType<typeof useLabDesignerPage>;
type SelectedEdge = LabDesignerPageState["selectedEdge"];

export type LabDesignerInspectorTabsProps = {
	page: LabDesignerPageState;
	selectedEdge: SelectedEdge;
};

export type LabDesignerInspectorLabTabProps = {
	page: LabDesignerPageState;
};

export type LabDesignerInspectorLinkTabProps = {
	page: LabDesignerPageState;
	selectedEdge: SelectedEdge;
};

export type LabDesignerInspectorPageState = LabDesignerPageState;
