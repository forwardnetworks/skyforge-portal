import { useMemo } from "react";
import { SKYFORGE_PROXY_ROOT } from "@/lib/api-client";
import { WebsocketTerminal } from "@/components/websocket-terminal";

export function InfobloxConsoleView(props: {
	className?: string;
	onDisconnect?: () => void;
}) {
	const wsURL = useMemo(() => {
		const proto = window.location.protocol === "https:" ? "wss" : "ws";
		return `${proto}://${window.location.host}${SKYFORGE_PROXY_ROOT}/api/me/integrations/infoblox/console/ws`;
	}, []);

	return (
		<WebsocketTerminal
			wsURL={wsURL}
			headerTitle="Infoblox VM Console"
			headerSubtitle="infoblox console"
			className={props.className}
			onDisconnect={props.onDisconnect}
		/>
	);
}
