import type { components, operations } from "./openapi.gen";

export type ISO8601 = string;

export type JSONValue =
	| null
	| boolean
	| number
	| string
	| JSONValue[]
	| { [key: string]: JSONValue };
export type JSONMap = Record<string, JSONValue>;

export type ExternalTemplateRepo =
	components["schemas"]["skyforge.ExternalTemplateRepo"];
export type SkyforgeUserScope = components["schemas"]["skyforge.UserScope"];
export type NotificationRecord =
	components["schemas"]["skyforge.NotificationRecord"];

export type UserScopeDeployment = {
	id: string;
	userId: string;
	name: string;
	family: "terraform" | "kne" | "byos" | string;
	engine: "terraform" | "netlab" | "containerlab" | string;
	config: JSONMap;
	lifecycleState?: string;
	primaryAction?: "bring_up" | "shut_down" | "none" | string;
	actionReason?: string;
	syncState?: "idle" | "syncing" | "synced" | "sync_failed" | string;
	lastSyncAt?: ISO8601;
	lastSyncStatus?: string;
	lastSyncError?: string;
	autoSyncOnBringUp?: boolean;
	createdBy?: string;
	createdAt?: ISO8601;
	updatedAt?: ISO8601;
	lastTaskUserScopeId?: number;
	lastTaskId?: number;
	lastStatus?: string;
	lastStartedAt?: ISO8601;
	lastFinishedAt?: ISO8601;
	activeTaskId?: number;
	activeTaskStatus?: string;
	queueDepth?: number;
};

export type DeploymentTopology = {
	generatedAt: ISO8601;
	source: string;
	artifactKey?: string;
	nodes: Array<{
		id: string;
		label: string;
		kind?: string;
		mgmtIp?: string;
		mgmtHost?: string;
		pingIp?: string;
		status?: string;
	}>;
	edges: Array<{
		id: string;
		source: string;
		target: string;
		sourceIf?: string;
		targetIf?: string;
		label?: string;
	}>;
};

export type LinkImpairmentRequest = {
	edgeId: string;
	action: "set" | "clear";
	delayMs?: number;
	jitterMs?: number;
	lossPct?: number;
	dupPct?: number;
	corruptPct?: number;
	reorderPct?: number;
	rateKbps?: number;
};

export type LinkImpairmentResponse = {
	appliedAt: ISO8601;
	edge: DeploymentTopology["edges"][number];
	results: Array<{
		node: string;
		namespace: string;
		pod: string;
		container: string;
		ifName: string;
		command: string;
		stdout?: string;
		stderr?: string;
		error?: string;
	}>;
};

export type LinkAdminRequest = {
	edgeId: string;
	action: "down" | "up";
};

export type LinkAdminResponse = {
	appliedAt: ISO8601;
	action: string;
	edgeId: string;
	results: Array<{
		node: string;
		namespace: string;
		pod: string;
		container: string;
		ifName: string;
		command: string;
		stdout?: string;
		stderr?: string;
		error?: string;
	}>;
};

export type LinkCaptureRequest = {
	edgeId: string;
	side?: "source" | "target";
	durationSeconds?: number;
	maxPackets?: number;
	snaplen?: number;
	maxBytes?: number;
};

export type LinkCaptureResponse = {
	capturedAt: ISO8601;
	edgeId: string;
	side: string;
	node: string;
	ifName: string;
	artifactKey: string;
	sizeBytes: number;
	stderr?: string;
};

export type DeploymentNodeInterfacesResponse = {
	namespace?: string;
	podName?: string;
	node?: string;
	generatedAt?: ISO8601;
	interfaces: Array<{
		ifName: string;
		operState?: string;
		rxBytes?: number;
		txBytes?: number;
		rxPackets?: number;
		txPackets?: number;
		rxDropped?: number;
		txDropped?: number;
		peerNode?: string;
		peerIf?: string;
		edgeId?: string;
	}>;
};

export type DeploymentInventoryResponse = {
	generatedAt: ISO8601;
	userId: string;
	deploymentId: string;
	format: string;
	nodes?: Array<{
		id: string;
		kind?: string;
		mgmtIp?: string;
		sshPort?: number;
	}>;
	csv?: string;
};

export type DeploymentUIEvent = {
	id: number;
	createdAt: ISO8601;
	createdBy?: string;
	eventType: string;
	payload?: unknown;
};

export type DeploymentUIEventsResponse = {
	userId: string;
	deploymentId: string;
	events: DeploymentUIEvent[];
};

export type ForwardCollectorSummary = {
	id: string;
	name: string;
	username: string;
};

export type ListForwardCollectorsResponse = {
	collectors: ForwardCollectorSummary[];
};

export type GetUserScopesResponse =
	operations["GET:skyforge.GetUserScopes"]["responses"][200]["content"]["application/json"];
