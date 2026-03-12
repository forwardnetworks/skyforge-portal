import type { SavedConfigRef } from "@/components/lab-designer-types";
import type { DesignEdge, DesignNode } from "@/components/lab-designer-types";
import type { QueryClient } from "@tanstack/react-query";

export type LabDesignerValidationState = {
	normalizedYAML: string;
	warnings: string[];
	errors: string[];
	valid: boolean;
};

export type UseLabDesignerDataOptions = {
	queryClient: QueryClient;
	userId: string;
	runtime: "clabernetes" | "containerlab";
	importOpen: boolean;
	importSource: "user" | "blueprints";
	importDir: string;
	importFile: string;
	containerlabServer: string;
	labName: string;
	effectiveYaml: string;
	effectiveTemplatesDir: string;
	effectiveTemplateFile: string;
	useSavedConfig: boolean;
	lastSaved: SavedConfigRef | null;
	openDeploymentOnCreate: boolean;
	setLastSaved: (value: SavedConfigRef | null) => void;
	setYamlMode: (value: "generated" | "custom") => void;
	setCustomYaml: (value: string) => void;
	setImportOpen: (value: boolean) => void;
	setLabName: (value: string) => void;
	setDefaultKind: (value: string) => void;
	setNodes: React.Dispatch<React.SetStateAction<DesignNode[]>>;
	setEdges: React.Dispatch<React.SetStateAction<DesignEdge[]>>;
	setSelectedNodeId: (value: string) => void;
	setUseSavedConfig: (value: boolean) => void;
};
