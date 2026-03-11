import { LabDesignerSidebarMetadataSection } from "@/components/lab-designer-sidebar-metadata-section";
import { LabDesignerSidebarNodeSection } from "@/components/lab-designer-sidebar-node-section";
import { LabDesignerSidebarYamlSection } from "@/components/lab-designer-sidebar-yaml-section";
import type {
	DesignNode,
	SavedConfigRef,
} from "@/components/lab-designer-types";

type Option = {
	value: string;
	label: string;
};

type Props = {
	labName: string;
	onLabNameChange: (value: string) => void;
	userId: string;
	onUserIdChange: (value: string) => void;
	userScopeOptions: Option[];
	userScopesLoading: boolean;
	runtime: "clabernetes" | "containerlab";
	onRuntimeChange: (value: "clabernetes" | "containerlab") => void;
	templatesDir: string;
	onTemplatesDirChange: (value: string) => void;
	templateFile: string;
	onTemplateFileChange: (value: string) => void;
	effectiveTemplatesDir: string;
	effectiveTemplateFile: string;
	onCopyRepoPath: () => void;
	onOpenMap: () => void;
	lastSaved: SavedConfigRef | null;
	useSavedConfig: boolean;
	onUseSavedConfigChange: (value: boolean) => void;
	containerlabServer: string;
	onContainerlabServerChange: (value: string) => void;
	containerlabServerOptions: Option[];
	containerlabServersLoading: boolean;
	onCreateDeployment: () => void;
	createDeploymentPending: boolean;
	openDeploymentOnCreate: boolean;
	onOpenDeploymentOnCreateChange: (value: boolean) => void;
	selectedNode: DesignNode | null;
	onSelectedNodeLabelChange: (value: string) => void;
	onSelectedNodeKindChange: (value: string) => void;
	onSelectedNodeImageChange: (value: string) => void;
	yamlMode: "generated" | "custom";
	onYamlModeChange: (value: "generated" | "custom") => void;
	yaml: string;
	effectiveYaml: string;
	customYaml: string;
	onCustomYamlChange: (value: string) => void;
	otherWarnings: string[];
	showWarnings: boolean;
	missingImageWarnings: string[];
	onCopyYaml: () => void;
};

export function LabDesignerSidebar(props: Props) {
	return (
		<div className="space-y-6">
			<LabDesignerSidebarMetadataSection {...props} />
			<LabDesignerSidebarNodeSection {...props} />
			<LabDesignerSidebarYamlSection {...props} />
		</div>
	);
}
