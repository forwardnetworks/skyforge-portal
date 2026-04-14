export type LabNodeInterface = {
	id: string;
	name: string;
};

export type LabDesignNode = {
	id: string;
	label?: string;
	kind?: string;
	image?: string;
	runtime?: string;
	mgmtIpv4?: string;
	startupConfig?: {
		mode: "path" | "inline";
		path?: string;
		content?: string;
	};
	env?: Record<string, string>;
	interfaces?: LabNodeInterface[];
	notes?: string;
	position?: { x: number; y: number };
	status?: string;
	importMeta?: {
		isPlaceholder?: boolean;
		sourceType?: string;
		sourceTemplate?: string;
		sourceImage?: string;
	};
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
