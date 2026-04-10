import { paletteMimeType } from "@/components/lab-designer-palette";
import type {
	CanvasMenuState,
	DesignEdge,
	DesignNode,
	EdgeMenuState,
	LabDesignerInspectorTab,
	NodeMenuState,
	PaletteItem,
	SavedConfigRef,
} from "@/components/lab-designer-types";
import type { QueryClient } from "@tanstack/react-query";
import type { ReactFlowInstance } from "@xyflow/react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

export type LabDesignerActionsOptions = {
	queryClient: QueryClient;
	rfRef: MutableRefObject<HTMLDivElement | null>;
	rfInstance: ReactFlowInstance<DesignNode, DesignEdge> | null;
	nodes: DesignNode[];
	edges: DesignEdge[];
	labName: string;
	defaultKind: string;
	qsName: string;
	qsSpines: number;
	qsLeaves: number;
	qsHostsPerLeaf: number;
	qsSwitchKind: string;
	qsSwitchImage: string;
	qsHostKind: string;
	qsHostImage: string;
	quickstartImageByKind: Record<string, string>;
	selectedNodeId: string;
	importDeploymentId: string;
	userId: string;
	effectiveYaml: string;
	effectiveTemplatesDir: string;
	effectiveTemplateFile: string;
	lastSaved: SavedConfigRef | null;
	setLabName: (value: string) => void;
	setDefaultKind: (value: string) => void;
	setNodes: React.Dispatch<React.SetStateAction<DesignNode[]>>;
	setEdges: React.Dispatch<React.SetStateAction<DesignEdge[]>>;
	setSelectedNodeId: (value: string) => void;
	setYamlMode: (value: "generated" | "custom") => void;
	setCustomYaml: (value: string) => void;
	setQuickstartOpen: (value: boolean) => void;
	setNodeMenu: Dispatch<SetStateAction<NodeMenuState | null>>;
	setEdgeMenu: Dispatch<SetStateAction<EdgeMenuState | null>>;
	setCanvasMenu: Dispatch<SetStateAction<CanvasMenuState | null>>;
	setInspectorTab: (value: LabDesignerInspectorTab) => void;
	setUseSavedConfig: (value: boolean) => void;
	setLastSaved: Dispatch<SetStateAction<SavedConfigRef | null>>;
	setUserScopeId: (value: string) => void;
	setKNEServer: (value: string) => void;
	setRuntime: (value: "kne") => void;
	markWarningsVisible: () => void;
};

export type LabDesignerPaletteItem = PaletteItem;
export const labDesignerPaletteMimeType = paletteMimeType;
