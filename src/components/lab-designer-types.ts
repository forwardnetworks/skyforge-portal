import type { Edge, Node } from "@xyflow/react";

export type LabNodeInterface = {
	id: string;
	name: string;
};

export type StartupConfigData = {
	mode: "path" | "inline";
	path?: string;
	content?: string;
};

export type ImportedNodeMetadata = {
	isPlaceholder?: boolean;
	sourceType?: string;
	sourceTemplate?: string;
	sourceImage?: string;
};

export type DesignNodeData = {
	label: string;
	kind: string;
	image: string;
	mgmtIpv4?: string;
	runtime?: string;
	startupConfig?: StartupConfigData;
	env?: Record<string, string>;
	interfaces?: LabNodeInterface[];
	notes?: string;
	status?: string;
	importMeta?: ImportedNodeMetadata;
};

export type DesignNode = Node<DesignNodeData>;

export type DesignEdgeData = {
	label?: string;
	sourceIf?: string;
	targetIf?: string;
	mtu?: number;
	notes?: string;
};

export type PaletteCategory =
	| "Hosts"
	| "Routers"
	| "Switches"
	| "Firewalls"
	| "Other";

export type PaletteItem = {
	id: string;
	label: string;
	category: PaletteCategory;
	kind: string;
	repo?: string;
	defaultTag?: string;
	image?: string;
	vendor?: string;
	model?: string;
	role?: "host" | "router" | "switch" | "firewall" | "other";
};

export type DesignerAnnotation = {
	id: string;
	title: string;
	text: string;
	x: number;
	y: number;
};

export type DesignerGroup = {
	id: string;
	label: string;
	nodeIds: string[];
};

export type SavedConfigRef = {
	userId: string;
	templatesDir: string;
	template: string;
	filePath: string;
	branch: string;
};

export type NodeMenuState = {
	x: number;
	y: number;
	nodeId: string;
};

export type EdgeMenuState = {
	x: number;
	y: number;
	edgeId: string;
};

export type CanvasMenuState = {
	x: number;
	y: number;
};

export type LabDesignerSearch = {
	userId?: string;
	importDeploymentId?: string;
};

export type LabDesignerInspectorTab = "lab" | "node" | "link" | "yaml";

export type DesignEdge = Edge<DesignEdgeData>;
