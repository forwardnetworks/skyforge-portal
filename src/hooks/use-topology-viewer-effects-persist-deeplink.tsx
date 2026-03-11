import {
	applyLayoutAndHighlights,
	decorateEdges,
} from "@/components/topology-viewer-utils";
import { useEffect } from "react";
import type { TopologyViewerPersistAndDeepLinkEffectsArgs } from "./use-topology-viewer-effects-types";

export function useTopologyViewerPersistAndDeepLinkEffects(
	args: TopologyViewerPersistAndDeepLinkEffectsArgs,
) {
	const {
		positionsKey,
		setPinnedPositions,
		userId,
		deploymentId,
		deepLinkHandledRef,
		setTerminalNode,
		setLogsNode,
		setDescribeNode,
		setInterfacesNode,
		setInterfacesOpen,
		setRunningConfigNode,
		setRunningConfigOpen,
		derivedNodes,
		derivedEdges,
		layoutMode,
		pinnedPositions,
		search,
		setNodes,
		setEdges,
		edgeRates,
		statsEnabled,
		baseEdgeLabelsRef,
		edgeFlags,
	} = args;

	useEffect(() => {
		if (!positionsKey) return;
		try {
			const raw = window.localStorage.getItem(positionsKey);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Record<
				string,
				{ x: number; y: number }
			>;
			if (parsed && typeof parsed === "object") setPinnedPositions(parsed);
		} catch {
			// ignore
		}
	}, [positionsKey, setPinnedPositions]);

	useEffect(() => {
		setNodes(
			applyLayoutAndHighlights(
				derivedNodes,
				layoutMode,
				pinnedPositions,
				search,
			),
		);
		baseEdgeLabelsRef.current = Object.fromEntries(
			derivedEdges.map((edge) => [
				String(edge.id),
				typeof edge.label === "string" ? edge.label : undefined,
			]),
		);
		setEdges(
			decorateEdges(
				derivedEdges,
				edgeRates,
				statsEnabled,
				baseEdgeLabelsRef.current,
				edgeFlags,
			),
		);
	}, [
		baseEdgeLabelsRef,
		derivedEdges,
		derivedNodes,
		edgeFlags,
		edgeRates,
		layoutMode,
		pinnedPositions,
		search,
		setEdges,
		setNodes,
		statsEnabled,
	]);

	useEffect(() => {
		setEdges((prev) =>
			decorateEdges(
				prev,
				edgeRates,
				statsEnabled,
				baseEdgeLabelsRef.current,
				edgeFlags,
			),
		);
	}, [baseEdgeLabelsRef, edgeFlags, edgeRates, setEdges, statsEnabled]);

	useEffect(() => {
		if (!userId || !deploymentId) return;
		if (deepLinkHandledRef.current) return;
		const params = new URLSearchParams(window.location.search);
		const node = params.get("node")?.trim();
		const action = params.get("action")?.trim();
		if (!node || !action) {
			deepLinkHandledRef.current = true;
			return;
		}
		if (action === "terminal") setTerminalNode({ id: node });
		if (action === "logs") setLogsNode({ id: node });
		if (action === "describe") setDescribeNode({ id: node });
		if (action === "interfaces") {
			setInterfacesNode({ id: node });
			setInterfacesOpen(true);
		}
		if (action === "running-config") {
			setRunningConfigNode({ id: node });
			setRunningConfigOpen(true);
		}
		deepLinkHandledRef.current = true;
		params.delete("node");
		params.delete("action");
		const suffix = params.toString();
		const nextUrl = `${window.location.pathname}${suffix ? `?${suffix}` : ""}${window.location.hash || ""}`;
		window.history.replaceState(null, "", nextUrl);
	}, [
		deepLinkHandledRef,
		deploymentId,
		setDescribeNode,
		setInterfacesNode,
		setInterfacesOpen,
		setLogsNode,
		setRunningConfigNode,
		setRunningConfigOpen,
		setTerminalNode,
		userId,
	]);
}
