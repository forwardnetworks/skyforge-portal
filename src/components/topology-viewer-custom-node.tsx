import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Cloud, Laptop, Network, Server } from "lucide-react";

function CustomNode({ data }: NodeProps) {
	const Icon =
		data.icon === "switch"
			? Network
			: data.icon === "cloud"
				? Cloud
				: data.icon === "client"
					? Laptop
					: Server;
	const statusColor =
		data.status === "running"
			? "default"
			: data.status === "stopped"
				? "secondary"
				: "destructive";
	const highlight = Boolean((data as any)?.highlight);
	const vendor = String((data as any)?.vendor ?? "");

	const VendorMark = ({ vendor }: { vendor: string }) => {
		const v = String(vendor).toLowerCase();
		if (v === "cisco") {
			return (
				<div
					className="h-6 w-6 rounded-md flex items-center justify-center"
					title="Cisco"
					style={{
						background: "rgba(0, 142, 204, 0.15)",
						color: "rgb(0, 142, 204)",
					}}
				>
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						{[
							{ x: 4, h: 8 },
							{ x: 7, h: 10 },
							{ x: 10, h: 12 },
							{ x: 13, h: 10 },
							{ x: 16, h: 8 },
						].map((b) => (
							<rect
								key={b.x}
								x={b.x}
								y={14 - b.h}
								width="2"
								height={b.h}
								rx="1"
								fill="currentColor"
							/>
						))}
					</svg>
				</div>
			);
		}
		if (v === "arista") {
			return (
				<div
					className="h-6 w-6 rounded-md flex items-center justify-center"
					title="Arista"
					style={{
						background: "rgba(232, 43, 44, 0.14)",
						color: "rgb(232, 43, 44)",
					}}
				>
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						<path
							d="M12 3 4.5 21h3.6l1.6-4h4.6l1.6 4h3.6L12 3zm-1 11 1-2.6 1 2.6h-2z"
							fill="currentColor"
						/>
					</svg>
				</div>
			);
		}
		if (v === "linux") {
			return (
				<div
					className="h-6 w-6 rounded-md flex items-center justify-center"
					title="Linux"
					style={{
						background: "rgba(34, 197, 94, 0.12)",
						color: "rgb(34, 197, 94)",
					}}
				>
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						<circle cx="12" cy="9" r="4" fill="#111827" />
						<ellipse cx="12" cy="16" rx="5" ry="6" fill="#111827" />
						<ellipse cx="12" cy="17" rx="3.3" ry="4.2" fill="#ffffff" />
						<path d="M12 10l2 1-2 1-2-1 2-1z" fill="#f59e0b" />
					</svg>
				</div>
			);
		}
		return (
			<div
				className="h-6 w-6 rounded-md flex items-center justify-center bg-muted text-[11px] font-bold"
				title="Unknown"
			>
				?
			</div>
		);
	};

	return (
		<Card
			className={`min-w-[180px] border-2 shadow-md ${highlight ? "border-primary ring-2 ring-primary/30" : ""}`}
		>
			<CardHeader className="p-3 pb-2">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<VendorMark vendor={vendor} />
						<div
							className="p-1.5 bg-muted rounded-md"
							title={String((data as any)?.kind ?? "")}
						>
							<Icon className="w-4 h-4" />
						</div>
					</div>
					<Badge variant={statusColor} className="text-[10px] h-5">
						{String(data.status)}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="p-3 pt-0">
				<CardTitle className="text-sm font-bold truncate">
					{String(data.label)}
				</CardTitle>
				<div className="text-xs text-muted-foreground mt-1 truncate font-mono">
					{String(data.ip || "10.0.0.x")}
				</div>
				<Handle
					type="target"
					position={Position.Top}
					className="!bg-muted-foreground"
				/>
				<Handle
					type="source"
					position={Position.Bottom}
					className="!bg-muted-foreground"
				/>
			</CardContent>
		</Card>
	);
}

export const topologyViewerNodeTypes = {
	custom: CustomNode,
};
