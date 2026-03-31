import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Cloud, Laptop, Network, Server } from "lucide-react";

function semanticBadgeLabel(value: string) {
	const normalized = value.trim().toLowerCase();
	switch (normalized) {
		case "internet-gateway":
			return "internet";
		case "nat-gateway":
			return "nat";
		case "transit-gateway":
			return "transit";
		case "vpn-gateway":
			return "vpn";
		case "virtual-appliance":
			return "appliance";
		case "internal-load-balancer":
			return "internal lb";
		case "vpc-peering":
			return "peering";
		case "network-interface":
			return "eni";
		case "default-route":
			return "default route";
		case "internet-facing":
			return "public lb";
		default:
			return normalized.replaceAll("-", " ");
	}
}

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
	const resourceClass = String((data as any)?.class ?? "").trim();
	const region = String((data as any)?.region ?? "").trim();
	const zone = String((data as any)?.zone ?? "").trim();
	const subnetRole = String((data as any)?.subnetRole ?? "").trim();
	const gatewayKind = String((data as any)?.gatewayKind ?? "").trim();
	const routeTargetKind = String((data as any)?.routeTargetKind ?? "").trim();
	const isDefaultRoute = String((data as any)?.isDefaultRoute ?? "").trim();
	const scheme = String((data as any)?.scheme ?? "").trim();
	const networkId = String((data as any)?.networkId ?? "").trim();
	const peerNetworkId = String((data as any)?.peerNetworkId ?? "").trim();
	const metadataLine = [resourceClass, zone || region]
		.map((value) => value.trim())
		.filter(Boolean)
		.join(" • ");
	const provider = vendor.trim().toLowerCase();
	const semanticBadges = (() => {
		const values =
			provider === "azure"
				? [subnetRole, gatewayKind, routeTargetKind, scheme, isDefaultRoute]
				: provider === "gcp"
					? [subnetRole, gatewayKind, routeTargetKind, scheme, isDefaultRoute]
					: [subnetRole, gatewayKind, routeTargetKind, isDefaultRoute, scheme];
		if (resourceClass === "network" && peerNetworkId) {
			values.unshift("peering");
		}
		if ((resourceClass === "subnet" || resourceClass === "compute") && networkId) {
			values.push("network attached");
		}
		return values
			.map((value) => semanticBadgeLabel(String(value)))
			.filter(Boolean)
			.slice(0, 3);
	})();

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
		if (v === "aws") {
			return (
				<div
					className="h-6 min-w-6 rounded-md flex items-center justify-center px-1 text-[10px] font-bold"
					title="AWS"
					style={{
						background: "rgba(255, 153, 0, 0.14)",
						color: "rgb(255, 153, 0)",
					}}
				>
					AWS
				</div>
			);
		}
		if (v === "azure") {
			return (
				<div
					className="h-6 min-w-6 rounded-md flex items-center justify-center px-1 text-[10px] font-bold"
					title="Azure"
					style={{
						background: "rgba(0, 120, 212, 0.14)",
						color: "rgb(0, 120, 212)",
					}}
				>
					AZ
				</div>
			);
		}
		if (v === "gcp") {
			return (
				<div
					className="h-6 min-w-6 rounded-md flex items-center justify-center px-1 text-[10px] font-bold"
					title="GCP"
					style={{
						background: "rgba(66, 133, 244, 0.14)",
						color: "rgb(66, 133, 244)",
					}}
				>
					GCP
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
				<div className="text-[11px] text-muted-foreground mt-1 truncate">
					{String((data as any)?.kind ?? "")}
				</div>
				{metadataLine ? (
					<div className="text-[11px] text-muted-foreground truncate">
						{metadataLine}
					</div>
				) : null}
				{semanticBadges.length > 0 ? (
					<div className="mt-2 flex flex-wrap gap-1">
						{semanticBadges.map((value) => (
							<Badge
								key={value}
								variant="outline"
								className="h-5 text-[10px]"
							>
								{value}
							</Badge>
						))}
					</div>
				) : null}
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

function LaneBandNode({ data }: NodeProps) {
	return (
		<div
			className="h-full w-full rounded-[28px] border border-dashed shadow-sm"
			style={{
				background: String((data as any)?.background ?? "rgba(148, 163, 184, 0.08)"),
				borderColor: String((data as any)?.borderColor ?? "rgba(148, 163, 184, 0.22)"),
			}}
		>
			<div className="px-4 py-3">
				<div className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
					{String((data as any)?.label ?? "")}
				</div>
			</div>
		</div>
	);
}

export const topologyViewerNodeTypes = {
	custom: CustomNode,
	"lane-band": LaneBandNode,
};
