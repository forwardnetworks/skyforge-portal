import "@xyflow/react/dist/style.css";
import { useTopologyViewerSurface } from "@/hooks/use-topology-viewer-surface";
import type { DeploymentTopology } from "@/lib/api-client";
import { TopologyViewerCanvas } from "./topology-viewer-canvas";
import { TopologyViewerMenus } from "./topology-viewer-menus";
import { TopologyViewerModals } from "./topology-viewer-modals";
import {
	TopologyViewerLiveStatsOverlay,
	TopologyViewerRecentActivityPanel,
} from "./topology-viewer-panels";

export function TopologyViewerSurface({
	topology,
	userId,
	deploymentId,
	enableTerminal,
	fullHeight,
	className,
}: {
	topology?: DeploymentTopology | null;
	userId?: string;
	deploymentId?: string;
	enableTerminal?: boolean;
	fullHeight?: boolean;
	className?: string;
}) {
	const page = useTopologyViewerSurface({ topology, userId, deploymentId });

	return (
		<div
			className={`w-full bg-background/50 overflow-hidden relative ${fullHeight ? "h-full" : "h-[600px]"} border rounded-xl ${
				className ?? ""
			}`}
			ref={page.ref}
		>
			<TopologyViewerCanvas
				ref={page.ref}
				nodes={page.nodes}
				edges={page.edges}
				onNodesChange={page.onNodesChange}
				onEdgesChange={page.onEdgesChange}
				onConnect={page.onConnect}
				onNodeContextMenu={page.onNodeContextMenu}
				onEdgeContextMenu={page.onEdgeContextMenu}
				onEdgeMouseEnter={page.onEdgeMouseEnter}
				onEdgeMouseMove={page.onEdgeMouseMove}
				onEdgeMouseLeave={page.onEdgeMouseLeave}
				onNodeDragStop={page.onNodeDragStop}
				search={page.search}
				setSearch={page.setSearch}
				statsEnabled={page.statsEnabled}
				toggleStats={page.toggleStats}
				statsAvailable={page.statsAvailable}
				layoutMode={page.layoutMode}
				toggleLayout={page.toggleLayout}
				resetLayout={page.resetLayout}
				downloadInventory={page.downloadInventoryWithToast}
				downloadInventoryDisabled={page.downloadInventoryDisabled}
			/>

			<TopologyViewerLiveStatsOverlay
				statsEnabled={page.statsEnabled}
				statsError={page.statsError}
				hoverEdge={page.hoverEdge}
				edgeRates={page.edgeRates}
			/>
			<TopologyViewerRecentActivityPanel
				uiEventsEnabled={page.uiEventsEnabled}
				uiEvents={page.uiEvents}
			/>

			<TopologyViewerModals page={page} enableTerminal={enableTerminal} />
			<TopologyViewerMenus page={page} enableTerminal={enableTerminal} />
		</div>
	);
}
