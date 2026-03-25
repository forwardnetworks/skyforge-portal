import type { TopologyViewerSurfacePage } from "@/hooks/use-topology-viewer-surface";
import { TopologyViewerEdgeMenu } from "./topology-viewer-edge-menu";
import { TopologyViewerNodeMenu } from "./topology-viewer-node-menu";

export function TopologyViewerMenus({
	page,
	enableTerminal,
}: {
	page: TopologyViewerSurfacePage;
	enableTerminal?: boolean;
}) {
	return (
		<>
			<TopologyViewerNodeMenu
				nodeMenu={page.nodeMenu}
				userId={page.userId}
				deploymentId={page.deploymentId}
				enableTerminal={enableTerminal}
				saveConfigPending={page.saveConfigPending}
				onClose={page.closeNodeMenu}
				onOpenTerminal={page.openTerminal}
				onOpenTerminalNewTab={() => page.openNodeActionTab("terminal")}
				onViewLogs={page.openLogs}
				onViewLogsNewTab={() => page.openNodeActionTab("logs")}
				onDescribe={page.openDescribe}
				onDescribeNewTab={() => page.openNodeActionTab("describe")}
				onInterfaces={page.openInterfaces}
				onInterfacesNewTab={() => page.openNodeActionTab("interfaces")}
				onSaveConfig={page.saveConfigForNode}
					onRunningConfig={page.openRunningConfig}
					onRunningConfigNewTab={() => page.openNodeActionTab("running-config")}
					onCopyManagementIP={page.copyManagementIP}
					onCopyNodeName={page.copyNodeName}
					onCopySshCommand={page.copySshCommand}
					onOpenBrowser={page.openBrowser}
					onCopyBrowserURL={page.copyBrowserURL}
				/>

			<TopologyViewerEdgeMenu
				edgeMenu={page.edgeMenu}
				userId={page.userId}
				deploymentId={page.deploymentId}
				linkAdminPending={page.linkAdminPending}
				captureLinkPending={page.captureLinkPending}
				impairSaving={page.impairSaving}
				edgeDown={page.edgeDown.has(String(page.edgeMenu?.edge.id))}
				lastCaptureKey={
					page.edgeMenu
						? page.lastCaptureByEdge[String(page.edgeMenu.edge.id)]
						: undefined
				}
				onClose={page.closeEdgeMenu}
				onToggleLinkAdmin={page.toggleLinkAdmin}
				onCapture={page.openCapture}
				onDownloadLastPcap={page.downloadLastPcap}
				onConfigureImpairment={page.openImpairment}
				onClearImpairment={page.clearImpairment}
			/>
		</>
	);
}
