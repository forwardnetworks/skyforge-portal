import { TopologyViewerCaptureDialog } from "./topology-viewer-capture-dialog";
import type { TopologyViewerDialogsProps } from "./topology-viewer-dialog-types";
import { TopologyViewerImpairmentDialog } from "./topology-viewer-impairment-dialog";
import { TopologyViewerInterfacesDialog } from "./topology-viewer-interfaces-dialog";
import { TopologyViewerRunningConfigDialog } from "./topology-viewer-running-config-dialog";

export function TopologyViewerDialogs(props: TopologyViewerDialogsProps) {
	return (
		<>
			<TopologyViewerInterfacesDialog {...props} />
			<TopologyViewerRunningConfigDialog {...props} />
			<TopologyViewerCaptureDialog {...props} />
			<TopologyViewerImpairmentDialog {...props} />
		</>
	);
}
