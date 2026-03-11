import type { InterfaceRow } from "@/components/capacity/forward-network-capacity-types";
import {
	fmtNum,
	fmtPct01,
	fmtSpeedMbps,
	parseRFC3339,
} from "@/components/capacity/forward-network-capacity-utils";
import { Badge } from "@/components/ui/badge";
import type { DataTableColumn } from "@/components/ui/data-table";
import { useMemo } from "react";

export function useForwardNetworkCapacityInterfaceColumns({
	ifaceMetric,
}: {
	ifaceMetric:
		| "util_ingress"
		| "util_egress"
		| "if_error_ingress"
		| "if_error_egress"
		| "if_packet_loss_ingress"
		| "if_packet_loss_egress";
}) {
	return useMemo(
		() =>
			[
				{
					id: "device",
					header: "Device",
					cell: (r) => <span className="font-mono text-xs">{r.device}</span>,
					width: 200,
				},
				{
					id: "iface",
					header: "Interface",
					cell: (r) => <span className="font-mono text-xs">{r.iface}</span>,
					width: 220,
				},
				{
					id: "lag",
					header: "LAG",
					cell: (r) =>
						r.isAggregate ? (
							<Badge variant="secondary">aggregate</Badge>
						) : r.aggregateId ? (
							<span className="font-mono text-xs text-muted-foreground">
								{r.aggregateId}
							</span>
						) : (
							<span className="text-muted-foreground text-xs">—</span>
						),
					width: 170,
				},
				{
					id: "dir",
					header: "Dir",
					cell: (r) => <span className="text-xs">{r.dir || "—"}</span>,
					width: 90,
				},
				{
					id: "vrf",
					header: "VRF",
					cell: (r) => {
						const v = r.vrf ?? r.vrfNames?.[0] ?? "";
						if (!v)
							return <span className="text-muted-foreground text-xs">—</span>;
						const n = (r.vrfNames ?? []).length;
						return (
							<div className="text-xs">
								<div className="font-mono">{v}</div>
								{n > 1 ? (
									<div className="text-muted-foreground">{n} vrfs</div>
								) : null}
							</div>
						);
					},
					width: 160,
				},
				{
					id: "speed",
					header: "Speed",
					cell: (r) => (
						<span className="text-xs">{fmtSpeedMbps(r.speedMbps ?? null)}</span>
					),
					width: 90,
					align: "right",
				},
				{
					id: "state",
					header: "State",
					cell: (r) => (
						<span className="text-xs text-muted-foreground">
							{[r.admin, r.oper].filter(Boolean).join(" / ") || "—"}
						</span>
					),
					width: 140,
				},
				{
					id: "p95",
					header: "p95",
					align: "right",
					cell: (r) =>
						ifaceMetric.startsWith("util_") ? fmtPct01(r.p95) : fmtNum(r.p95),
					width: 90,
				},
				...(ifaceMetric.startsWith("util_")
					? ([
							{
								id: "p95Gbps",
								header: "p95 (Gbps)",
								align: "right",
								cell: (r: InterfaceRow) => {
									const speed = Number(r.speedMbps ?? 0);
									const p95 = Number(r.p95 ?? Number.NaN);
									if (!speed || !Number.isFinite(p95))
										return (
											<span className="text-muted-foreground text-xs">—</span>
										);
									return (
										<span className="text-xs">
											{((p95 * speed) / 1000).toFixed(2)}
										</span>
									);
								},
								width: 110,
							},
						] as Array<DataTableColumn<InterfaceRow>>)
					: []),
				{
					id: "max",
					header: "Max",
					align: "right",
					cell: (r) => {
						const v = ifaceMetric.startsWith("util_")
							? fmtPct01(r.max)
							: fmtNum(r.max);
						const thr =
							r.threshold ??
							(ifaceMetric.startsWith("util_") ? 0.85 : undefined);
						const hot = thr !== undefined && (r.max ?? 0) >= thr;
						return (
							<span className={hot ? "text-destructive font-medium" : ""}>
								{v}
							</span>
						);
					},
					width: 90,
				},
				...(ifaceMetric.startsWith("util_")
					? ([
							{
								id: "maxGbps",
								header: "Max (Gbps)",
								align: "right",
								cell: (r: InterfaceRow) => {
									const speed = Number(r.speedMbps ?? 0);
									const maxV = Number(r.max ?? Number.NaN);
									if (!speed || !Number.isFinite(maxV))
										return (
											<span className="text-muted-foreground text-xs">—</span>
										);
									return (
										<span className="text-xs">
											{((maxV * speed) / 1000).toFixed(2)}
										</span>
									);
								},
								width: 110,
							},
							{
								id: "headroom85",
								header: "Headroom@85 (Gbps)",
								align: "right",
								cell: (r: InterfaceRow) => {
									const speed = Number(r.speedMbps ?? 0);
									const p95 = Number(r.p95 ?? Number.NaN);
									const thr = Number(r.threshold ?? 0.85);
									if (!speed || !Number.isFinite(p95) || !Number.isFinite(thr))
										return (
											<span className="text-muted-foreground text-xs">—</span>
										);
									return (
										<span className="text-xs">
											{(Math.max(0, (thr - p95) * speed) / 1000).toFixed(2)}
										</span>
									);
								},
								width: 150,
							},
							{
								id: "days85",
								header: "Days@85",
								align: "right",
								cell: (r: InterfaceRow) => {
									if (!r.forecastCrossingTs)
										return (
											<span className="text-muted-foreground text-xs">—</span>
										);
									const dt = parseRFC3339(r.forecastCrossingTs);
									if (!dt)
										return (
											<span className="text-muted-foreground text-xs">—</span>
										);
									return (
										<span className="text-xs">
											{Math.round(
												(dt.getTime() - Date.now()) / (24 * 3600 * 1000),
											)}
										</span>
									);
								},
								width: 90,
							},
						] as Array<DataTableColumn<InterfaceRow>>)
					: []),
				{
					id: "slope",
					header: "Slope/d",
					align: "right",
					cell: (r) =>
						ifaceMetric.startsWith("util_")
							? fmtPct01(r.slopePerDay)
							: fmtNum(r.slopePerDay),
					width: 100,
				},
				{
					id: "forecast",
					header: "Forecast",
					cell: (r) => {
						if (!r.forecastCrossingTs)
							return <span className="text-muted-foreground text-xs">—</span>;
						const dt = parseRFC3339(r.forecastCrossingTs);
						const days = dt
							? Math.round((dt.getTime() - Date.now()) / (24 * 3600 * 1000))
							: null;
						return (
							<div className="text-xs">
								<div className="font-mono">
									{r.forecastCrossingTs.slice(0, 10)}
								</div>
								{days !== null ? (
									<div className="text-muted-foreground">{days}d</div>
								) : null}
							</div>
						);
					},
					width: 120,
				},
				{
					id: "samples",
					header: "N",
					align: "right",
					cell: (r) => <span className="text-xs">{r.samples || 0}</span>,
					width: 70,
				},
			] satisfies Array<DataTableColumn<InterfaceRow>>,
		[ifaceMetric],
	);
}
