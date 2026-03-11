import type { LinkStatsSnapshot } from "@/lib/api-client";
import type { EdgeMouseHandler } from "@xyflow/react";
import { useCallback } from "react";
import { toast } from "sonner";

export function useTopologyViewerCanvasControls(args: {
	ref: React.RefObject<HTMLDivElement | null>;
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
	hoverEdge: { id: string; x: number; y: number } | null;
	setHoverEdge: React.Dispatch<
		React.SetStateAction<{ id: string; x: number; y: number } | null>
	>;
	downloadInventory: () => Promise<void>;
}) {
	const {
		ref,
		positionsKey,
		setPinnedPositions,
		setStatsEnabled,
		setStatsError,
		setEdgeRates,
		lastStatsRef,
		hoverEdge,
		setHoverEdge,
		downloadInventory,
	} = args;

	const toggleStats = useCallback(() => {
		setStatsEnabled((value) => {
			const next = !value;
			if (!next) {
				setStatsError(null);
				setEdgeRates({});
				lastStatsRef.current = null;
			}
			return next;
		});
	}, [lastStatsRef, setEdgeRates, setStatsEnabled, setStatsError]);

	const resetLayout = useCallback(() => {
		setPinnedPositions({});
		if (!positionsKey) return;
		try {
			window.localStorage.removeItem(positionsKey);
		} catch {
			// ignore
		}
	}, [positionsKey, setPinnedPositions]);

	const onEdgeMouseEnter: EdgeMouseHandler = useCallback(
		(event, edge) => {
			const rect = ref.current?.getBoundingClientRect();
			const x = rect ? event.clientX - rect.left : event.clientX;
			const y = rect ? event.clientY - rect.top : event.clientY;
			setHoverEdge({ id: String(edge.id), x, y });
		},
		[ref, setHoverEdge],
	);

	const onEdgeMouseMove: EdgeMouseHandler = useCallback(
		(event) => {
			if (!hoverEdge) return;
			const rect = ref.current?.getBoundingClientRect();
			const x = rect ? event.clientX - rect.left : event.clientX;
			const y = rect ? event.clientY - rect.top : event.clientY;
			setHoverEdge((prev) => (prev ? { ...prev, x, y } : null));
		},
		[hoverEdge, ref, setHoverEdge],
	);

	const onEdgeMouseLeave = useCallback(
		() => setHoverEdge(null),
		[setHoverEdge],
	);

	const onNodeDragStop = useCallback(
		(
			_: unknown,
			node: { id: string | number; position: { x: number; y: number } },
		) => {
			if (!positionsKey) return;
			setPinnedPositions((prev) => {
				const next = {
					...prev,
					[String(node.id)]: { x: node.position.x, y: node.position.y },
				};
				try {
					window.localStorage.setItem(positionsKey, JSON.stringify(next));
				} catch {
					// ignore
				}
				return next;
			});
		},
		[positionsKey, setPinnedPositions],
	);

	const downloadInventoryWithToast = useCallback(
		() =>
			downloadInventory().catch((error) =>
				toast.error("Failed to download inventory", {
					description: (error as Error).message,
				}),
			),
		[downloadInventory],
	);

	return {
		toggleStats,
		resetLayout,
		onEdgeMouseEnter,
		onEdgeMouseMove,
		onEdgeMouseLeave,
		onNodeDragStop,
		downloadInventoryWithToast,
	};
}
