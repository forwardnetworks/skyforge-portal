import type { Node } from "@xyflow/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function TopologyViewerNodeMenu(props: {
	nodeMenu: { x: number; y: number; node: Node } | null;
	userId?: string;
	deploymentId?: string;
	enableTerminal?: boolean;
	saveConfigPending: boolean;
	onClose: () => void;
	onOpenTerminal: () => void;
	onOpenTerminalNewTab: () => void;
	onViewLogs: () => void;
	onViewLogsNewTab: () => void;
	onDescribe: () => void;
	onDescribeNewTab: () => void;
	onInterfaces: () => void;
	onInterfacesNewTab: () => void;
	onSaveConfig: () => void;
	onRunningConfig: () => void;
	onRunningConfigNewTab: () => void;
	onCopyManagementIP: () => void;
	onCopyNodeName: () => void;
	onCopySshCommand: () => void;
}) {
	if (!props.nodeMenu || !props.userId || !props.deploymentId) return null;
	const nodeLabel = String(
		(props.nodeMenu.node as any)?.data?.label ?? props.nodeMenu.node.id,
	);
	return (
		<div
			className="absolute z-50"
			style={{ left: props.nodeMenu.x, top: props.nodeMenu.y }}
			onContextMenu={(e) => e.preventDefault()}
		>
			<Card className="w-64 shadow-lg border bg-background/95 backdrop-blur">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-sm">Node Actions</CardTitle>
					<div className="text-xs text-muted-foreground font-mono truncate">
						{nodeLabel}
					</div>
				</CardHeader>
				<CardContent className="p-3 pt-0 space-y-2">
					<Button
						size="sm"
						className="w-full"
						disabled={!props.enableTerminal}
						onClick={props.onOpenTerminal}
					>
						Open terminal…
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						disabled={!props.enableTerminal}
						onClick={props.onOpenTerminalNewTab}
					>
						Open terminal (new tab)
					</Button>
					<Button
						size="sm"
						variant="secondary"
						className="w-full"
						onClick={props.onViewLogs}
					>
						View logs…
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						onClick={props.onViewLogsNewTab}
					>
						View logs (new tab)
					</Button>
					<Button
						size="sm"
						variant="secondary"
						className="w-full"
						onClick={props.onDescribe}
					>
						Describe…
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						onClick={props.onDescribeNewTab}
					>
						Describe (new tab)
					</Button>
					<Button
						size="sm"
						variant="secondary"
						className="w-full"
						onClick={props.onInterfaces}
					>
						Interfaces…
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						onClick={props.onInterfacesNewTab}
					>
						Interfaces (new tab)
					</Button>
					<Button
						size="sm"
						variant="secondary"
						className="w-full"
						disabled={props.saveConfigPending}
						onClick={props.onSaveConfig}
					>
						{props.saveConfigPending ? "Saving…" : "Save config"}
					</Button>
					<Button
						size="sm"
						variant="secondary"
						className="w-full"
						onClick={props.onRunningConfig}
					>
						Running config…
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						onClick={props.onRunningConfigNewTab}
					>
						Running config (new tab)
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="w-full"
						onClick={props.onCopyManagementIP}
					>
						Copy management IP
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="w-full"
						onClick={props.onCopyNodeName}
					>
						Copy node name
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="w-full"
						onClick={props.onCopySshCommand}
					>
						Copy SSH command
					</Button>
					<Button
						size="sm"
						variant="ghost"
						className="w-full"
						onClick={props.onClose}
					>
						Close
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
