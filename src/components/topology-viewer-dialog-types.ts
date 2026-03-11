import type {
	DeploymentNodeInterfacesResponse,
	DeploymentNodeRunningConfigResponse,
	LinkCaptureResponse,
} from "@/lib/api-client";

export type TopologyViewerFetchState<T> = {
	data?: T;
	isPending: boolean;
	isError: boolean;
	error?: unknown;
};

export type TopologyViewerCaptureState = {
	side: "source" | "target";
	duration: string;
	packets: string;
	snaplen: string;
};

export type TopologyViewerImpairState = {
	delayMs: string;
	jitterMs: string;
	lossPct: string;
	dupPct: string;
	corruptPct: string;
	reorderPct: string;
	rateKbps: string;
};

export type TopologyViewerDialogsProps = {
	interfacesOpen: boolean;
	setInterfacesOpen: (open: boolean) => void;
	interfacesNodeId: string;
	fetchInterfaces: TopologyViewerFetchState<DeploymentNodeInterfacesResponse>;
	interfacesAutoRefresh: boolean;
	toggleInterfacesAutoRefresh: () => void;
	runningConfigOpen: boolean;
	setRunningConfigOpen: (open: boolean) => void;
	runningConfigNodeId: string;
	fetchRunningConfig: TopologyViewerFetchState<DeploymentNodeRunningConfigResponse>;
	captureOpen: boolean;
	setCaptureOpen: (open: boolean) => void;
	captureEdgeLabel?: string;
	capture: TopologyViewerCaptureState;
	setCapture: (
		next:
			| TopologyViewerCaptureState
			| ((prev: TopologyViewerCaptureState) => TopologyViewerCaptureState),
	) => void;
	captureLinkPending: boolean;
	onRunCapture: () => Promise<LinkCaptureResponse | undefined>;
	impairOpen: boolean;
	setImpairOpen: (open: boolean) => void;
	selectedEdgeLabel?: string;
	impair: TopologyViewerImpairState;
	setImpair: (
		next:
			| TopologyViewerImpairState
			| ((prev: TopologyViewerImpairState) => TopologyViewerImpairState),
	) => void;
	impairSaving: boolean;
	onApplyImpairment: () => Promise<void>;
};
