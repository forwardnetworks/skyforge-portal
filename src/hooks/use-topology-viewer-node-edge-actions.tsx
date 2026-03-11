import type { LinkCaptureResponse } from "@/lib/api-client";
import { useCallback } from "react";
import { toast } from "sonner";

export function useTopologyViewerNodeEdgeActions(args: {
	nodeMenu: { node: any } | null;
	edgeMenu: { edge: any } | null;
	captureEdge: { id: string; label?: string } | null;
	selectedEdge: { id: string; label?: string } | null;
	capture: {
		side: "source" | "target";
		duration: string;
		packets: string;
		snaplen: string;
	};
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
	edgeDown: Set<string>;
	lastCaptureByEdge: Record<string, string>;
	setTerminalNode: React.Dispatch<
		React.SetStateAction<{ id: string; kind?: string } | null>
	>;
	setLogsNode: React.Dispatch<
		React.SetStateAction<{ id: string; kind?: string; ip?: string } | null>
	>;
	setDescribeNode: React.Dispatch<
		React.SetStateAction<{ id: string; kind?: string; ip?: string } | null>
	>;
	setInterfacesNode: React.Dispatch<
		React.SetStateAction<{ id: string; kind?: string; ip?: string } | null>
	>;
	setInterfacesOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setRunningConfigNode: React.Dispatch<
		React.SetStateAction<{ id: string } | null>
	>;
	setRunningConfigOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setCaptureEdge: React.Dispatch<
		React.SetStateAction<{ id: string; label?: string } | null>
	>;
	setCaptureOpen: React.Dispatch<React.SetStateAction<boolean>>;
	setSelectedEdge: React.Dispatch<
		React.SetStateAction<{ id: string; label?: string } | null>
	>;
	setImpairOpen: React.Dispatch<React.SetStateAction<boolean>>;
	closeNodeMenu: () => void;
	closeEdgeMenu: () => void;
	openNodeActionTab: (action: string) => void;
}) {
	const {
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
		edgeDown,
		lastCaptureByEdge,
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
	} = args;

	const copyText = useCallback(
		(value: string, success: string, empty?: string) => {
			const next = value.trim();
			if (!next) {
				if (empty) toast.error(empty);
				return;
			}
			void navigator.clipboard?.writeText(next);
			toast.success(success);
		},
		[],
	);

	const runCapture = useCallback(async () => {
		const edgeId = String(captureEdge?.id ?? "");
		if (!edgeId) {
			toast.error("No link selected");
			return;
		}
		const resp = await captureLink.mutateAsync({
			edgeId,
			side: capture.side,
			durationSeconds: Number(capture.duration.trim() || "10"),
			maxPackets: Number(capture.packets.trim() || "2500"),
			snaplen: Number(capture.snaplen.trim() || "192"),
		});
		toast.success("Pcap ready", { description: resp.artifactKey });
		await downloadPcap(resp.artifactKey).catch(() => {});
		return resp;
	}, [capture, captureEdge?.id, captureLink, downloadPcap]);

	const applySelectedImpairment = useCallback(async () => {
		const edgeId = String(selectedEdge?.id ?? "");
		if (!edgeId) {
			toast.error("No link selected");
			return;
		}
		await applyImpairment("set", edgeId);
	}, [applyImpairment, selectedEdge?.id]);

	const openTerminal = useCallback(() => {
		const kind = String(nodeMenu?.node?.data?.kind ?? "");
		setTerminalNode({ id: String(nodeMenu?.node.id), kind });
		closeNodeMenu();
	}, [closeNodeMenu, nodeMenu, setTerminalNode]);

	const openLogs = useCallback(() => {
		const kind = String(nodeMenu?.node?.data?.kind ?? "");
		const ip = String(nodeMenu?.node?.data?.ip ?? "");
		setLogsNode({ id: String(nodeMenu?.node.id), kind, ip });
		closeNodeMenu();
	}, [closeNodeMenu, nodeMenu, setLogsNode]);

	const openDescribe = useCallback(() => {
		const kind = String(nodeMenu?.node?.data?.kind ?? "");
		const ip = String(nodeMenu?.node?.data?.ip ?? "");
		setDescribeNode({ id: String(nodeMenu?.node.id), kind, ip });
		closeNodeMenu();
	}, [closeNodeMenu, nodeMenu, setDescribeNode]);

	const openInterfaces = useCallback(() => {
		const id = String(nodeMenu?.node.id);
		const kind = String(nodeMenu?.node?.data?.kind ?? "");
		const ip = String(nodeMenu?.node?.data?.ip ?? "");
		setInterfacesNode({ id, kind, ip });
		setInterfacesOpen(true);
		closeNodeMenu();
	}, [closeNodeMenu, nodeMenu, setInterfacesNode, setInterfacesOpen]);

	const openRunningConfig = useCallback(() => {
		setRunningConfigNode({ id: String(nodeMenu?.node.id) });
		setRunningConfigOpen(true);
		closeNodeMenu();
	}, [closeNodeMenu, nodeMenu, setRunningConfigNode, setRunningConfigOpen]);

	const copyManagementIP = useCallback(() => {
		copyText(
			String(nodeMenu?.node?.data?.ip ?? ""),
			"Copied management IP",
			"No management IP available",
		);
		closeNodeMenu();
	}, [closeNodeMenu, copyText, nodeMenu]);

	const copyNodeName = useCallback(() => {
		copyText(String(nodeMenu?.node.id ?? ""), "Copied node name");
		closeNodeMenu();
	}, [closeNodeMenu, copyText, nodeMenu]);

	const copySshCommand = useCallback(() => {
		const ip = String(nodeMenu?.node?.data?.ip ?? "");
		copyText(
			ip ? `ssh admin@${ip.trim()}` : "",
			"Copied SSH command",
			"No management IP available",
		);
		closeNodeMenu();
	}, [closeNodeMenu, copyText, nodeMenu]);

	const saveConfigForNode = useCallback(() => {
		saveConfig.mutate(String(nodeMenu?.node.id));
		closeNodeMenu();
	}, [closeNodeMenu, nodeMenu, saveConfig]);

	const toggleLinkAdmin = useCallback(() => {
		const edgeId = String(edgeMenu?.edge.id);
		linkAdmin.mutate({
			edgeId,
			action: edgeDown.has(edgeId) ? "up" : "down",
		});
		closeEdgeMenu();
	}, [closeEdgeMenu, edgeDown, edgeMenu, linkAdmin]);

	const openCapture = useCallback(() => {
		setCaptureEdge({
			id: String(edgeMenu?.edge.id),
			label: String(edgeMenu?.edge.label ?? ""),
		});
		setCaptureOpen(true);
		closeEdgeMenu();
	}, [closeEdgeMenu, edgeMenu, setCaptureEdge, setCaptureOpen]);

	const downloadLastPcap = useCallback(() => {
		const key = edgeMenu ? lastCaptureByEdge[String(edgeMenu.edge.id)] : "";
		closeEdgeMenu();
		if (!key) return;
		downloadPcap(key).catch((error) =>
			toast.error("Failed to download pcap", {
				description: (error as Error).message,
			}),
		);
	}, [closeEdgeMenu, downloadPcap, edgeMenu, lastCaptureByEdge]);

	const openImpairment = useCallback(() => {
		setSelectedEdge({
			id: String(edgeMenu?.edge.id),
			label: String(edgeMenu?.edge.label ?? ""),
		});
		setImpairOpen(true);
		closeEdgeMenu();
	}, [closeEdgeMenu, edgeMenu, setImpairOpen, setSelectedEdge]);

	const clearImpairment = useCallback(() => {
		void applyImpairment("clear", String(edgeMenu?.edge.id ?? ""));
		closeEdgeMenu();
	}, [applyImpairment, closeEdgeMenu, edgeMenu]);

	return {
		runCapture,
		applySelectedImpairment,
		openTerminal,
		openNodeActionTab,
		openLogs,
		openDescribe,
		openInterfaces,
		saveConfigForNode,
		openRunningConfig,
		copyManagementIP,
		copyNodeName,
		copySshCommand,
		toggleLinkAdmin,
		openCapture,
		downloadLastPcap,
		openImpairment,
		clearImpairment,
	};
}
