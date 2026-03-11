import type { Edge, Node } from "@xyflow/react";

export type DesignNodeData = {
	label: string;
	kind: string;
	image: string;
};

export type DesignNode = Node<DesignNodeData>;

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
	vendor?: string;
	model?: string;
	role?: "host" | "router" | "switch" | "firewall" | "other";
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

export type DesignEdge = Edge;
