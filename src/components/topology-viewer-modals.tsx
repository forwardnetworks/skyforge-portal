import { NodeDescribeModal } from "@/components/node-describe-modal";
import { NodeLogsModal } from "@/components/node-logs-modal";
import { TerminalModal } from "@/components/terminal-modal";
import type { TopologyViewerSurfacePage } from "@/hooks/use-topology-viewer-surface";
import { TopologyViewerDialogs } from "./topology-viewer-dialogs";

export function TopologyViewerModals({
	page,
	enableTerminal,
}: {
	page: TopologyViewerSurfacePage;
	enableTerminal?: boolean;
}) {
	return (
		<>
			{enableTerminal && page.userId && page.deploymentId ? (
				<TerminalModal
					open={!!page.terminalNode}
					onOpenChange={(open) => {
						if (!open) page.setTerminalNode(null);
					}}
					userId={page.userId}
					deploymentId={page.deploymentId}
					nodeId={page.terminalNode?.id ?? ""}
					nodeKind={page.terminalNode?.kind ?? ""}
				/>
			) : null}

			{page.userId && page.deploymentId ? (
				<NodeLogsModal
					open={!!page.logsNode}
					onOpenChange={(open) => {
						if (!open) page.setLogsNode(null);
					}}
					userId={page.userId}
					deploymentId={page.deploymentId}
					nodeId={page.logsNode?.id ?? ""}
					nodeKind={page.logsNode?.kind ?? ""}
					nodeIp={page.logsNode?.ip ?? ""}
				/>
			) : null}

			{page.userId && page.deploymentId ? (
				<NodeDescribeModal
					open={!!page.describeNode}
					onOpenChange={(open) => {
						if (!open) page.setDescribeNode(null);
					}}
					userId={page.userId}
					deploymentId={page.deploymentId}
					nodeId={page.describeNode?.id ?? ""}
					nodeKind={page.describeNode?.kind ?? ""}
					nodeIp={page.describeNode?.ip ?? ""}
				/>
			) : null}

			<TopologyViewerDialogs
				interfacesOpen={page.interfacesOpen}
				setInterfacesOpen={(open) => {
					page.setInterfacesOpen(open);
					if (!open) page.setInterfacesNode(null);
				}}
				interfacesNodeId={page.interfacesNode?.id ?? ""}
				fetchInterfaces={page.fetchInterfaces}
				interfacesAutoRefresh={page.interfacesAutoRefresh}
				toggleInterfacesAutoRefresh={page.toggleInterfacesAutoRefresh}
				runningConfigOpen={page.runningConfigOpen}
				setRunningConfigOpen={(open) => {
					page.setRunningConfigOpen(open);
					if (!open) page.setRunningConfigNode(null);
				}}
				runningConfigNodeId={page.runningConfigNode?.id ?? ""}
				fetchRunningConfig={page.fetchRunningConfig}
				captureOpen={page.captureOpen}
				setCaptureOpen={(open) => {
					page.setCaptureOpen(open);
					if (!open) page.setCaptureEdge(null);
				}}
				captureEdgeLabel={page.captureEdge?.label}
				capture={page.capture}
				setCapture={page.setCapture}
				captureLinkPending={page.captureLinkPending}
				onRunCapture={page.runCapture}
				impairOpen={page.impairOpen}
				setImpairOpen={(open) => {
					page.setImpairOpen(open);
					if (!open) page.setSelectedEdge(null);
				}}
				selectedEdgeLabel={page.selectedEdge?.label}
				impair={page.impair}
				setImpair={page.setImpair}
				impairSaving={page.impairSaving}
				onApplyImpairment={page.applySelectedImpairment}
			/>
		</>
	);
}
