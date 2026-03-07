import { useMemo } from "react";
import { SKYFORGE_PROXY_ROOT } from "@/lib/api-client";
import { WebsocketTerminal } from "@/components/websocket-terminal";

type Props = {
	userId: string;
	deploymentId: string;
	nodeId: string;
	nodeKind?: string;
	onClose?: () => void;
	className?: string;
};

export function TerminalView({
	userId,
	deploymentId,
	nodeId,
	nodeKind: _nodeKind,
	onClose,
	className,
}: Props) {
	const command = useMemo(() => {
		// `cli` is a semantic default: the server will translate it into the
		// correct in-container command (vrnetlab console, cEOS Cli, or shell fallback).
		return "cli";
	}, []);

	const wsURL = useMemo(() => {
		if (!userId || !deploymentId || !nodeId) return "";
		const proto = window.location.protocol === "https:" ? "wss" : "ws";
		const base = `${proto}://${window.location.host}${SKYFORGE_PROXY_ROOT}/api/users/${encodeURIComponent(
			userId,
		)}/deployments/${encodeURIComponent(deploymentId)}/terminal/ws`;
		const params = new URLSearchParams();
		params.set("node", nodeId);
		params.set("command", command);
		return `${base}?${params.toString()}`;
	}, [command, deploymentId, nodeId, userId]);

	return (
		<WebsocketTerminal
			wsURL={wsURL}
			headerTitle="Skyforge Terminal"
			headerSubtitle={nodeId}
			startupLines={[`Node: ${nodeId}  Command: ${command}`]}
			disconnectLabel={onClose ? "Close" : "Disconnect"}
			onDisconnect={onClose}
			className={className}
		/>
	);
}
