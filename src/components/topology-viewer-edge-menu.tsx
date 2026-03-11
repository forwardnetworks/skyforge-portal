import type { Edge } from "@xyflow/react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function TopologyViewerEdgeMenu(props: {
	edgeMenu: { x: number; y: number; edge: Edge } | null;
	userId?: string;
	deploymentId?: string;
	linkAdminPending: boolean;
	captureLinkPending: boolean;
	impairSaving: boolean;
	edgeDown: boolean;
	lastCaptureKey?: string;
	onClose: () => void;
	onToggleLinkAdmin: () => void;
	onCapture: () => void;
	onDownloadLastPcap: () => void;
	onConfigureImpairment: () => void;
	onClearImpairment: () => void;
}) {
	if (!props.edgeMenu || !props.userId || !props.deploymentId) return null;

	return (
		<div
			className="absolute z-50"
			style={{ left: props.edgeMenu.x, top: props.edgeMenu.y }}
			onContextMenu={(e) => e.preventDefault()}
		>
			<Card className="w-64 shadow-lg border bg-background/95 backdrop-blur">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-sm">Link Actions</CardTitle>
					<div className="text-xs text-muted-foreground font-mono truncate">
						{String(props.edgeMenu.edge.label ?? props.edgeMenu.edge.id)}
					</div>
				</CardHeader>
				<CardContent className="p-3 pt-0 space-y-2">
					<Button
						size="sm"
						variant={props.edgeDown ? "secondary" : "destructive"}
						className="w-full"
						disabled={props.linkAdminPending}
						onClick={props.onToggleLinkAdmin}
					>
						{props.edgeDown ? "Bring link up" : "Bring link down"}
					</Button>
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						disabled={props.captureLinkPending}
						onClick={props.onCapture}
					>
						Capture pcap…
					</Button>
					{props.lastCaptureKey ? (
						<Button
							size="sm"
							variant="secondary"
							className="w-full"
							onClick={props.onDownloadLastPcap}
						>
							Download last pcap
						</Button>
					) : null}
					<Button
						size="sm"
						className="w-full"
						onClick={props.onConfigureImpairment}
					>
						Configure impairment…
					</Button>
					<Button
						size="sm"
						variant="secondary"
						className="w-full"
						disabled={props.impairSaving}
						onClick={props.onClearImpairment}
					>
						Clear impairment
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
