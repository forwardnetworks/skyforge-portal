import type {
	CanvasMenuState,
	DesignEdge,
	DesignNode,
	EdgeMenuState,
	LabDesignerInspectorTab,
	NodeMenuState,
	PaletteItem,
} from "@/components/lab-designer-types";
import type { ReactFlowInstance } from "@xyflow/react";
import type { DragEvent, KeyboardEvent, MutableRefObject } from "react";

export type LabDesignerWorkspaceProps = {
	snapToGrid: boolean;
	onSnapToGridChange: (value: boolean) => void;
	showPalette: boolean;
	onTogglePalette: () => void;
	showInspector: boolean;
	onToggleInspector: () => void;
	showCommandBar: boolean;
	onToggleCommandBar: () => void;
	isFocusMode: boolean;
	onToggleFocusMode: () => void;
	linkMode: boolean;
	onLinkModeToggle: () => void;
	pendingLinkSource: string;
	autoLayout: () => void;
	addNode: () => void;
	onAddPaletteItem: (item: PaletteItem) => void;
	paletteSearch: string;
	onPaletteSearchChange: (value: string) => void;
	paletteVendor: string;
	onPaletteVendorChange: (value: string) => void;
	paletteRole: string;
	onPaletteRoleChange: (value: string) => void;
	paletteVendors: string[];
	paletteItems: PaletteItem[];
	registryReposLoading: boolean;
	registryReposError: boolean;
	registryError: string;
	paletteIsFilteredEmpty: boolean;
	nodes: DesignNode[];
	edges: DesignEdge[];
	rfRef: MutableRefObject<HTMLDivElement | null>;
	onDrop: (event: DragEvent) => void | Promise<void>;
	onDragOver: (event: DragEvent) => void;
	onCanvasKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
	closeMenus: () => void;
	onNodesChangeWithWarnings: (changes: any[]) => void;
	onEdgesChangeWithWarnings: (changes: any[]) => void;
	nodeTypes: { designerNode: any };
	setRfInstance: (
		value: ReactFlowInstance<DesignNode, DesignEdge> | null,
	) => void;
	setSelectedNodeId: (value: string) => void;
	selectedEdgeId: string;
	setSelectedEdgeId: (value: string) => void;
	setNodeMenu: (value: NodeMenuState | null) => void;
	setEdgeMenu: (value: EdgeMenuState | null) => void;
	setCanvasMenu: (value: CanvasMenuState | null) => void;
	nodeMenu: NodeMenuState | null;
	edgeMenu: EdgeMenuState | null;
	canvasMenu: CanvasMenuState | null;
	importDeploymentId: string;
	openImportedTool: (opts: {
		action: "terminal" | "logs" | "describe";
		node: string;
	}) => void;
	renameNode: (nodeId: string) => void;
	selectedNodeId: string;
	setNodes: React.Dispatch<React.SetStateAction<DesignNode[]>>;
	setEdges: React.Dispatch<React.SetStateAction<DesignEdge[]>>;
	setLinkMode: React.Dispatch<React.SetStateAction<boolean>>;
	setPendingLinkSource: React.Dispatch<React.SetStateAction<string>>;
	rfInstance: ReactFlowInstance<DesignNode, DesignEdge> | null;
	setInspectorTab: (value: LabDesignerInspectorTab) => void;
	ensureInspectorVisible: () => void;
};
