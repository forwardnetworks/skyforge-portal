import { paletteMimeType } from "@/components/lab-designer-palette";
import type {
	CanvasMenuState,
	DesignNode,
	EdgeMenuState,
	NodeMenuState,
	PaletteItem,
	SavedConfigRef,
} from "@/components/lab-designer-types";
import type { QueryClient } from "@tanstack/react-query";
import type { Edge, ReactFlowInstance } from "@xyflow/react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

export type LabDesignerActionsOptions = {
	queryClient: QueryClient;
	rfRef: MutableRefObject<HTMLDivElement | null>;
	rfInstance: ReactFlowInstance<DesignNode, Edge> | null;
	nodes: DesignNode[];
	edges: Edge[];
	labName: string;
	qsName: string;
	qsSpines: number;
	qsLeaves: number;
	qsHostsPerLeaf: number;
	qsSwitchKind: string;
	qsSwitchImage: string;
	qsHostKind: string;
	qsHostImage: string;
	selectedNodeId: string;
	importDeploymentId: string;
	userId: string;
	effectiveYaml: string;
	effectiveTemplatesDir: string;
	effectiveTemplateFile: string;
	lastSaved: SavedConfigRef | null;
	setLabName: (value: string) => void;
	setNodes: React.Dispatch<React.SetStateAction<DesignNode[]>>;
	setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
	setSelectedNodeId: (value: string) => void;
	setYamlMode: (value: "generated" | "custom") => void;
	setCustomYaml: (value: string) => void;
	setQuickstartOpen: (value: boolean) => void;
	setNodeMenu: Dispatch<SetStateAction<NodeMenuState | null>>;
	setEdgeMenu: Dispatch<SetStateAction<EdgeMenuState | null>>;
	setCanvasMenu: Dispatch<SetStateAction<CanvasMenuState | null>>;
	setUseSavedConfig: (value: boolean) => void;
	setLastSaved: Dispatch<SetStateAction<SavedConfigRef | null>>;
	setUserScopeId: (value: string) => void;
	setContainerlabServer: (value: string) => void;
	setRuntime: (value: "clabernetes" | "containerlab") => void;
	markWarningsVisible: () => void;
};

export type LabDesignerPaletteItem = PaletteItem;
export const labDesignerPaletteMimeType = paletteMimeType;
