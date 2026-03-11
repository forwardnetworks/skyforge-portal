import type { LinkStatsSnapshot } from "@/lib/api-client";
import type { Edge, Node } from "@xyflow/react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

type TopologyNodeTarget = { id: string; kind?: string };
type TopologyNodeTargetWithIp = { id: string; kind?: string; ip?: string };

export type TopologyViewerPersistAndDeepLinkEffectsArgs = {
	positionsKey: string;
	setPinnedPositions: Dispatch<
		SetStateAction<Record<string, { x: number; y: number }>>
	>;
	userId?: string;
	deploymentId?: string;
	deepLinkHandledRef: MutableRefObject<boolean>;
	setTerminalNode: Dispatch<SetStateAction<TopologyNodeTarget | null>>;
	setLogsNode: Dispatch<SetStateAction<TopologyNodeTargetWithIp | null>>;
	setDescribeNode: Dispatch<SetStateAction<TopologyNodeTargetWithIp | null>>;
	setInterfacesNode: Dispatch<SetStateAction<TopologyNodeTargetWithIp | null>>;
	setInterfacesOpen: Dispatch<SetStateAction<boolean>>;
	setRunningConfigNode: Dispatch<SetStateAction<{ id: string } | null>>;
	setRunningConfigOpen: Dispatch<SetStateAction<boolean>>;
	derivedNodes: Node[];
	derivedEdges: Edge[];
	layoutMode: "grid" | "circle";
	pinnedPositions: Record<string, { x: number; y: number }>;
	search: string;
	setNodes: (nodes: Node[]) => void;
	setEdges: Dispatch<SetStateAction<Edge[]>>;
	edgeRates: Record<string, { bps: number; pps: number; drops: number }>;
	statsEnabled: boolean;
	baseEdgeLabelsRef: MutableRefObject<Record<string, string | undefined>>;
	edgeFlags: {
		edgeDown: Set<string>;
		lastCaptureByEdge: Record<string, string>;
	};
};

export type TopologyViewerMenusAndFetchEffectsArgs = {
	edgeMenu: { x: number; y: number; edge: Edge } | null;
	setEdgeMenu: Dispatch<
		SetStateAction<{ x: number; y: number; edge: Edge } | null>
	>;
	nodeMenu: { x: number; y: number; node: Node } | null;
	setNodeMenu: Dispatch<
		SetStateAction<{ x: number; y: number; node: Node } | null>
	>;
	interfacesOpen: boolean;
	interfacesNodeId: string;
	interfacesAutoRefresh: boolean;
	fetchInterfaces: { mutate: (nodeId: string) => void };
	runningConfigOpen: boolean;
	runningConfigNodeId: string;
	fetchRunningConfig: { mutate: (nodeId: string) => void };
};

export type TopologyViewerStatsStreamEffectsArgs = {
	userId?: string;
	deploymentId?: string;
	statsEnabled: boolean;
	lastStatsRef: MutableRefObject<{
		atMs: number;
		byEdge: Record<string, LinkStatsSnapshot["edges"][number]>;
	} | null>;
	setStatsError: Dispatch<SetStateAction<string | null>>;
	setEdgeRates: Dispatch<
		SetStateAction<Record<string, { bps: number; pps: number; drops: number }>>
	>;
};

export type UseTopologyViewerEffectsArgs =
	TopologyViewerPersistAndDeepLinkEffectsArgs &
		TopologyViewerMenusAndFetchEffectsArgs &
		TopologyViewerStatsStreamEffectsArgs;
