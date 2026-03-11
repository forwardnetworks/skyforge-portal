import type { LinkStatsSnapshot } from "@/lib/api-client";
import {
	type Edge,
	type Node,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useMemo, useRef, useState } from "react";

export type TopologyViewerNodeTarget = { id: string; kind?: string };
export type TopologyViewerNodeTargetWithIp = {
	id: string;
	kind?: string;
	ip?: string;
};
export type TopologyViewerEdgeMenuState = {
	x: number;
	y: number;
	edge: Edge;
} | null;
export type TopologyViewerNodeMenuState = {
	x: number;
	y: number;
	node: Node;
} | null;
export type TopologyViewerEdgeSelection = {
	id: string;
	label?: string;
} | null;
export type TopologyViewerCaptureState = {
	side: "source" | "target";
	duration: string;
	packets: string;
	snaplen: string;
};
export type TopologyViewerHoverEdgeState = {
	id: string;
	x: number;
	y: number;
} | null;
export type TopologyViewerImpairmentState = {
	delayMs: string;
	jitterMs: string;
	lossPct: string;
	dupPct: string;
	corruptPct: string;
	reorderPct: string;
	rateKbps: string;
};

export function useTopologyViewerSurfacePrimitives(args: {
	derivedNodes: Node[];
	derivedEdges: Edge[];
	userId?: string;
	deploymentId?: string;
}) {
	const { derivedNodes, derivedEdges, userId, deploymentId } = args;
	const [nodes, setNodes, onNodesChange] = useNodesState(derivedNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(derivedEdges);
	const ref = useRef<HTMLDivElement>(null);
	const [terminalNode, setTerminalNode] =
		useState<TopologyViewerNodeTarget | null>(null);
	const [logsNode, setLogsNode] =
		useState<TopologyViewerNodeTargetWithIp | null>(null);
	const [describeNode, setDescribeNode] =
		useState<TopologyViewerNodeTargetWithIp | null>(null);
	const [edgeMenu, setEdgeMenu] = useState<TopologyViewerEdgeMenuState>(null);
	const [nodeMenu, setNodeMenu] = useState<TopologyViewerNodeMenuState>(null);
	const [selectedEdge, setSelectedEdge] =
		useState<TopologyViewerEdgeSelection>(null);
	const [impairOpen, setImpairOpen] = useState(false);
	const [impairSaving, setImpairSaving] = useState(false);
	const [statsEnabled, setStatsEnabled] = useState(false);
	const [statsError, setStatsError] = useState<string | null>(null);
	const [edgeRates, setEdgeRates] = useState<
		Record<string, { bps: number; pps: number; drops: number }>
	>({});
	const lastStatsRef = useRef<{
		atMs: number;
		byEdge: Record<string, LinkStatsSnapshot["edges"][number]>;
	} | null>(null);
	const baseEdgeLabelsRef = useRef<Record<string, string | undefined>>({});
	const deepLinkHandledRef = useRef(false);
	const [search, setSearch] = useState("");
	const [layoutMode, setLayoutMode] = useState<"grid" | "circle">("grid");
	const positionsKey = useMemo(() => {
		if (!userId || !deploymentId) return "";
		return `skyforge.topology.positions.${userId}.${deploymentId}`;
	}, [deploymentId, userId]);
	const [pinnedPositions, setPinnedPositions] = useState<
		Record<string, { x: number; y: number }>
	>({});
	const [interfacesNode, setInterfacesNode] =
		useState<TopologyViewerNodeTargetWithIp | null>(null);
	const [interfacesOpen, setInterfacesOpen] = useState(false);
	const [runningConfigNode, setRunningConfigNode] = useState<{
		id: string;
	} | null>(null);
	const [runningConfigOpen, setRunningConfigOpen] = useState(false);
	const [captureOpen, setCaptureOpen] = useState(false);
	const [captureEdge, setCaptureEdge] =
		useState<TopologyViewerEdgeSelection>(null);
	const [capture, setCapture] = useState<TopologyViewerCaptureState>({
		side: "source",
		duration: "10",
		packets: "2500",
		snaplen: "192",
	});
	const [interfacesAutoRefresh, setInterfacesAutoRefresh] = useState(false);
	const [hoverEdge, setHoverEdge] =
		useState<TopologyViewerHoverEdgeState>(null);
	const [impair, setImpair] = useState<TopologyViewerImpairmentState>({
		delayMs: "",
		jitterMs: "",
		lossPct: "",
		dupPct: "",
		corruptPct: "",
		reorderPct: "",
		rateKbps: "",
	});

	return {
		ref,
		nodes,
		setNodes,
		onNodesChange,
		edges,
		setEdges,
		onEdgesChange,
		terminalNode,
		setTerminalNode,
		logsNode,
		setLogsNode,
		describeNode,
		setDescribeNode,
		edgeMenu,
		setEdgeMenu,
		nodeMenu,
		setNodeMenu,
		selectedEdge,
		setSelectedEdge,
		impairOpen,
		setImpairOpen,
		impairSaving,
		setImpairSaving,
		statsEnabled,
		setStatsEnabled,
		statsError,
		setStatsError,
		edgeRates,
		setEdgeRates,
		lastStatsRef,
		baseEdgeLabelsRef,
		deepLinkHandledRef,
		search,
		setSearch,
		layoutMode,
		setLayoutMode,
		positionsKey,
		pinnedPositions,
		setPinnedPositions,
		interfacesNode,
		setInterfacesNode,
		interfacesOpen,
		setInterfacesOpen,
		runningConfigNode,
		setRunningConfigNode,
		runningConfigOpen,
		setRunningConfigOpen,
		captureOpen,
		setCaptureOpen,
		captureEdge,
		setCaptureEdge,
		capture,
		setCapture,
		interfacesAutoRefresh,
		setInterfacesAutoRefresh,
		hoverEdge,
		setHoverEdge,
		impair,
		setImpair,
	};
}
