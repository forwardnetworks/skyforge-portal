import type { DeploymentUIEventsState } from "@/lib/deployment-ui-events";
import { Panel } from "@xyflow/react";
import { Activity, Download, LayoutGrid, Search } from "lucide-react";
import { formatBps } from "./topology-viewer-utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

export function TopologyViewerToolsPanel(props: {
	search: string;
	setSearch: (value: string) => void;
	statsEnabled: boolean;
	toggleStats: () => void;
	statsAvailable: boolean;
	layoutMode: "grid" | "circle";
	toggleLayout: () => void;
	resetLayout: () => void;
	downloadInventory: () => void;
	downloadInventoryDisabled: boolean;
	downloadPng: () => void;
}) {
	return (
		<Panel position="top-right">
			<Card className="shadow-sm border bg-background/85 backdrop-blur">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-sm">Tools</CardTitle>
				</CardHeader>
				<CardContent className="p-3 pt-0 space-y-2">
					<div className="flex items-center gap-2 rounded-md border bg-background/70 px-2 py-1">
						<Search className="h-4 w-4 text-muted-foreground" />
						<Input
							value={props.search}
							onChange={(e) => props.setSearch(e.target.value)}
							placeholder="Search nodes…"
							className="h-7 w-56 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
						/>
						{props.search.trim() ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2"
								onClick={() => props.setSearch("")}
							>
								Clear
							</Button>
						) : null}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant={props.statsEnabled ? "default" : "outline"}
							size="sm"
							onClick={props.toggleStats}
							disabled={!props.statsAvailable}
							title="Show live link utilization (SSE)"
						>
							<Activity className="mr-2 h-4 w-4" />
							Live stats
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={props.toggleLayout}
							title="Toggle layout"
						>
							<LayoutGrid className="mr-2 h-4 w-4" />
							{props.layoutMode === "grid" ? "Grid" : "Circle"}
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={props.resetLayout}
							title="Reset pinned node positions"
						>
							Reset
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={props.downloadInventory}
							disabled={props.downloadInventoryDisabled}
							title="Download inventory CSV"
						>
							Inventory
						</Button>
						<Button variant="outline" size="sm" onClick={props.downloadPng}>
							<Download className="mr-2 h-4 w-4" />
							PNG
						</Button>
					</div>
					<div className="text-[11px] text-muted-foreground">
						Tip: Right-click a node or link for actions.
					</div>
				</CardContent>
			</Card>
		</Panel>
	);
}

export function TopologyViewerLiveStatsOverlay(props: {
	statsEnabled: boolean;
	statsError: string | null;
	hoverEdge: { id: string; x: number; y: number } | null;
	edgeRates: Record<string, { bps: number; pps: number; drops: number }>;
}) {
	return (
		<>
			{props.statsEnabled && props.statsError ? (
				<div className="absolute bottom-2 left-2 z-40 rounded-md border bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
					Live stats: {props.statsError}
				</div>
			) : null}

			{props.hoverEdge &&
			props.statsEnabled &&
			props.edgeRates[props.hoverEdge.id] ? (
				<div
					className="absolute z-40 rounded-md border bg-background/90 px-3 py-2 text-xs shadow-sm"
					style={{
						left: props.hoverEdge.x + 12,
						top: props.hoverEdge.y + 12,
					}}
				>
					<div className="font-mono">{props.hoverEdge.id}</div>
					<div className="text-muted-foreground">
						{formatBps(props.edgeRates[props.hoverEdge.id].bps)} •{" "}
						{Math.round(props.edgeRates[props.hoverEdge.id].pps)} pps •{" "}
						{props.edgeRates[props.hoverEdge.id].drops.toFixed(1)} drops/s
					</div>
				</div>
			) : null}
		</>
	);
}

export function TopologyViewerRecentActivityPanel(props: {
	uiEventsEnabled: boolean;
	uiEvents?: DeploymentUIEventsState | null;
}) {
	if (!props.uiEventsEnabled || (props.uiEvents?.events?.length ?? 0) === 0) {
		return null;
	}

	return (
		<div className="absolute bottom-2 right-2 z-40 w-[420px] max-w-[92vw]">
			<Card className="shadow-sm border bg-background/90 backdrop-blur">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-sm">Recent activity</CardTitle>
				</CardHeader>
				<CardContent className="p-3 pt-0 space-y-2">
					{(props.uiEvents?.events ?? [])
						.slice(-8)
						.reverse()
						.map((ev) => (
							<div
								key={String(ev.id)}
								className="flex items-start justify-between gap-2 text-xs"
							>
								<div className="min-w-0">
									<div className="font-mono truncate">{ev.eventType}</div>
									<div className="text-muted-foreground truncate">
										{ev.createdAt}
									</div>
								</div>
								<div className="text-muted-foreground font-mono truncate">
									{ev.createdBy ? ev.createdBy : ""}
								</div>
							</div>
						))}
				</CardContent>
			</Card>
		</div>
	);
}
