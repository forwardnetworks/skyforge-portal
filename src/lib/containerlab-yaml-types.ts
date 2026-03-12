export type LabNodeInterface = {
	id: string;
	name: string;
};

export type LabDesignNode = {
	id: string;
	label?: string;
	kind?: string;
	image?: string;
	mgmtIpv4?: string;
	startupConfig?: string;
	env?: Record<string, string>;
	interfaces?: LabNodeInterface[];
	notes?: string;
	position?: { x: number; y: number };
	status?: string;
};

export type LabDesignLink = {
	id: string;
	source: string;
	target: string;
	sourceIf?: string;
	targetIf?: string;
	label?: string;
	mtu?: number;
	notes?: string;
};

export type LabDesign = {
	name: string;
	defaultKind?: string;
	nodes: LabDesignNode[];
	links: LabDesignLink[];
};
