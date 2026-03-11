import { useEffect } from "react";
import type { TopologyViewerMenusAndFetchEffectsArgs } from "./use-topology-viewer-effects-types";

export function useTopologyViewerMenusAndFetchEffects(
	args: TopologyViewerMenusAndFetchEffectsArgs,
) {
	const {
		edgeMenu,
		setEdgeMenu,
		nodeMenu,
		setNodeMenu,
		interfacesOpen,
		interfacesNodeId,
		interfacesAutoRefresh,
		fetchInterfaces,
		runningConfigOpen,
		runningConfigNodeId,
		fetchRunningConfig,
	} = args;

	useEffect(() => {
		if (!edgeMenu) return;
		const onClick = () => setEdgeMenu(null);
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setEdgeMenu(null);
		};
		window.addEventListener("click", onClick);
		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("click", onClick);
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [edgeMenu, setEdgeMenu]);

	useEffect(() => {
		if (!nodeMenu) return;
		const onClick = () => setNodeMenu(null);
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setNodeMenu(null);
		};
		window.addEventListener("click", onClick);
		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("click", onClick);
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [nodeMenu, setNodeMenu]);

	useEffect(() => {
		if (!interfacesOpen || !interfacesNodeId) return;
		fetchInterfaces.mutate(interfacesNodeId);
	}, [fetchInterfaces, interfacesNodeId, interfacesOpen]);

	useEffect(() => {
		if (!interfacesOpen || !interfacesAutoRefresh || !interfacesNodeId) return;
		const timer = window.setInterval(() => {
			fetchInterfaces.mutate(interfacesNodeId);
		}, 2000);
		return () => window.clearInterval(timer);
	}, [
		fetchInterfaces,
		interfacesAutoRefresh,
		interfacesNodeId,
		interfacesOpen,
	]);

	useEffect(() => {
		if (!runningConfigOpen || !runningConfigNodeId) return;
		fetchRunningConfig.mutate(runningConfigNodeId);
	}, [fetchRunningConfig, runningConfigNodeId, runningConfigOpen]);
}
