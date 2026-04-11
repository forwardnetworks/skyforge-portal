import type {
	DesignerAnnotation,
	DesignerGroup,
	SavedConfigRef,
} from "@/components/lab-designer-types";
import type { ImportTopologyResponse } from "@/lib/api-client";
import type { DesignEdge, DesignNode } from "@/components/lab-designer-types";
import type { ReactFlowInstance } from "@xyflow/react";
import type { QueryClient } from "@tanstack/react-query";

export type LabDesignerValidationState = {
	normalizedYAML: string;
	warnings: string[];
	errors: string[];
	valid: boolean;
};

export type LabDesignerImportState = ImportTopologyResponse;

export type UseLabDesignerDataOptions = {
	queryClient: QueryClient;
	userId: string;
	runtime: "kne";
	importOpen: boolean;
	importSource: "user" | "blueprints";
	importDir: string;
	importFile: string;
	kneServer: string;
	labName: string;
	defaultKind: string;
	nodes: DesignNode[];
	edges: DesignEdge[];
	annotations: DesignerAnnotation[];
	groups: DesignerGroup[];
	effectiveYaml: string;
	effectiveTemplatesDir: string;
	effectiveTemplateFile: string;
	useSavedConfig: boolean;
	lastSaved: SavedConfigRef | null;
	rfInstance: ReactFlowInstance<DesignNode, DesignEdge> | null;
	openDeploymentOnCreate: boolean;
	setLastSaved: (value: SavedConfigRef | null) => void;
	setYamlMode: (value: "generated" | "custom") => void;
	setCustomYaml: (value: string) => void;
	setImportOpen: (value: boolean) => void;
	setLabName: (value: string) => void;
	setDefaultKind: (value: string) => void;
	setNodes: React.Dispatch<React.SetStateAction<DesignNode[]>>;
	setEdges: React.Dispatch<React.SetStateAction<DesignEdge[]>>;
	setAnnotations: React.Dispatch<React.SetStateAction<DesignerAnnotation[]>>;
	setGroups: React.Dispatch<React.SetStateAction<DesignerGroup[]>>;
	setSelectedNodeId: (value: string) => void;
	setUseSavedConfig: (value: boolean) => void;
};
