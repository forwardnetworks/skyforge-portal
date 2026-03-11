import type { LinkCaptureResponse } from "@/lib/api-client";
import type { Edge, Node } from "@xyflow/react";
import { useTopologyViewerNodeEdgeActions } from "./use-topology-viewer-node-edge-actions";
import type {
	TopologyViewerCaptureState,
	TopologyViewerEdgeSelection,
	TopologyViewerNodeTarget,
	TopologyViewerNodeTargetWithIp,
} from "./use-topology-viewer-surface-primitives";

export function useTopologyViewerSurfaceDialogCoordination(args: {
	nodeMenu: { x: number; y: number; node: Node } | null;
	setNodeMenu: React.Dispatch<
		React.SetStateAction<{ x: number; y: number; node: Node } | null>
	>;
	edgeMenu: { x: number; y: number; edge: Edge } | null;
	setEdgeMenu: React.Dispatch<
		React.SetStateAction<{ x: number; y: number; edge: Edge } | null>
	>;
	captureEdge: TopologyViewerEdgeSelection;
	selectedEdge: TopologyViewerEdgeSelection;
	capture: TopologyViewerCaptureState;
	saveConfig: { mutate: (nodeId: string) => void };
	linkAdmin: {
		mutate: (payload: { edgeId: string; action: "up" | "down" }) => void;
	};
	captureLink: {
		mutateAsync: (payload: {
			edgeId: string;
			side: "source" | "target";
			durationSeconds: number;
			maxPackets: number;
			snaplen: number;
		}) => Promise<LinkCaptureResponse>;
	};
	downloadPcap: (key: string) => Promise<void>;
	applyImpairment: (action: "set" | "clear", edgeId: string) => Promise<void>;
	edgeFlags: {
		edgeDown: Set<string>;
		lastCaptureByEdge: Record<string, string>;
	};
	setTerminalNode: React.Dispatch<
		React.SetStateAction<TopologyViewerNodeTarget | null>
	>;
	setLogsNode: React.Dispatch<
		React.SetStateAction<TopologyViewerNodeTargetWithIp | null>
	>;
	setDescribeNode: React.Dispatch<
		React.SetStateAction<TopologyViewerNodeTargetWithIp | null>
	>;
	setInterfacesNode: React.Dispatch<
		React.SetStateAction<TopologyViewerNodeTargetWithIp | null>
	>;
	setInterfacesOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setRunningConfigNode: React.Dispatch<
		React.SetStateAction<{ id: string } | null>
	>;
	setRunningConfigOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setCaptureEdge: React.Dispatch<
		React.SetStateAction<TopologyViewerEdgeSelection>
	>;
	setCaptureOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setSelectedEdge: React.Dispatch<
		React.SetStateAction<TopologyViewerEdgeSelection>
	>;
	setImpairOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const {
		nodeMenu,
		setNodeMenu,
		edgeMenu,
		setEdgeMenu,
		captureEdge,
		selectedEdge,
		capture,
		saveConfig,
		linkAdmin,
		captureLink,
		downloadPcap,
		applyImpairment,
		edgeFlags,
		setTerminalNode,
		setLogsNode,
		setDescribeNode,
		setInterfacesNode,
		setInterfacesOpen,
		setRunningConfigNode,
		setRunningConfigOpen,
		setCaptureEdge,
		setCaptureOpen,
		setSelectedEdge,
		setImpairOpen,
	} = args;

	const closeNodeMenu = () => setNodeMenu(null);
	const closeEdgeMenu = () => setEdgeMenu(null);
	const openNodeActionTab = (action: string) => {
		const id = String(nodeMenu?.node.id ?? "");
		if (!id) return;
		window.open(
			`${window.location.pathname}?node=${encodeURIComponent(id)}&action=${encodeURIComponent(action)}`,
			"_blank",
			"noopener,noreferrer",
		);
		closeNodeMenu();
	};
	const nodeEdgeActions = useTopologyViewerNodeEdgeActions({
		nodeMenu,
		edgeMenu,
		captureEdge,
		selectedEdge,
		capture,
		saveConfig,
		linkAdmin,
		captureLink,
		downloadPcap,
		applyImpairment,
		edgeDown: edgeFlags.edgeDown,
		lastCaptureByEdge: edgeFlags.lastCaptureByEdge,
		setTerminalNode,
		setLogsNode,
		setDescribeNode,
		setInterfacesNode,
		setInterfacesOpen,
		setRunningConfigNode,
		setRunningConfigOpen,
		setCaptureEdge,
		setCaptureOpen,
		setSelectedEdge,
		setImpairOpen,
		closeNodeMenu,
		closeEdgeMenu,
		openNodeActionTab,
	});

	return {
		closeNodeMenu,
		closeEdgeMenu,
		...nodeEdgeActions,
	};
}
