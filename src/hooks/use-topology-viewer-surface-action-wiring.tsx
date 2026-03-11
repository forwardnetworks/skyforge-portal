import type { LinkStatsSnapshot } from "@/lib/api-client";
import type { Edge, Node } from "@xyflow/react";
import { useTopologyViewerActivity } from "./use-topology-viewer-activity";
import { useTopologyViewerCanvasControls } from "./use-topology-viewer-canvas-controls";
import { useTopologyViewerInteractions } from "./use-topology-viewer-interactions";
import type {
	TopologyViewerHoverEdgeState,
	TopologyViewerImpairmentState,
} from "./use-topology-viewer-surface-primitives";

export function useTopologyViewerSurfaceActionWiring(args: {
	userId?: string;
	deploymentId?: string;
	ref: React.RefObject<HTMLDivElement | null>;
	setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
	setNodeMenu: React.Dispatch<
		React.SetStateAction<{ x: number; y: number; node: Node } | null>
	>;
	setEdgeMenu: React.Dispatch<
		React.SetStateAction<{ x: number; y: number; edge: Edge } | null>
	>;
	impair: TopologyViewerImpairmentState;
	setImpairSaving: React.Dispatch<React.SetStateAction<boolean>>;
	positionsKey: string;
	setPinnedPositions: React.Dispatch<
		React.SetStateAction<Record<string, { x: number; y: number }>>
	>;
	setStatsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
	setStatsError: React.Dispatch<React.SetStateAction<string | null>>;
	setEdgeRates: React.Dispatch<
		React.SetStateAction<
			Record<string, { bps: number; pps: number; drops: number }>
		>
	>;
	lastStatsRef: React.MutableRefObject<{
		atMs: number;
		byEdge: Record<string, LinkStatsSnapshot["edges"][number]>;
	} | null>;
	hoverEdge: TopologyViewerHoverEdgeState;
	setHoverEdge: React.Dispatch<
		React.SetStateAction<TopologyViewerHoverEdgeState>
	>;
}) {
	const {
		userId,
		deploymentId,
		ref,
		setEdges,
		setNodeMenu,
		setEdgeMenu,
		impair,
		setImpairSaving,
		positionsKey,
		setPinnedPositions,
		setStatsEnabled,
		setStatsError,
		setEdgeRates,
		lastStatsRef,
		hoverEdge,
		setHoverEdge,
	} = args;

	const { uiEventsEnabled, uiEvents, edgeFlags } = useTopologyViewerActivity(
		userId,
		deploymentId,
	);
	const interactions = useTopologyViewerInteractions({
		userId,
		deploymentId,
		ref,
		setEdges,
		setNodeMenu,
		setEdgeMenu,
		impair,
		setImpairSaving,
	});
	const canvasControls = useTopologyViewerCanvasControls({
		ref,
		positionsKey,
		setPinnedPositions,
		setStatsEnabled,
		setStatsError,
		setEdgeRates,
		lastStatsRef,
		hoverEdge,
		setHoverEdge,
		downloadInventory: interactions.downloadInventory,
	});

	return {
		uiEventsEnabled,
		uiEvents,
		edgeFlags,
		...interactions,
		...canvasControls,
	};
}
