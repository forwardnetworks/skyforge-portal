import type {
	DeviceRow,
	InterfaceRow,
} from "@/components/capacity/deployment-capacity-types";
import {
	fmtNum,
	fmtPct01,
	fmtSpeedMbps,
	parseRFC3339,
} from "@/components/capacity/deployment-capacity-utils";
import { Badge } from "@/components/ui/badge";
import type { DataTableColumn } from "@/components/ui/data-table";
import { useMemo } from "react";

import type { DeploymentCapacityDerivedInput } from "@/hooks/use-deployment-capacity-shared";

export function useDeploymentCapacityColumns(
	input: Pick<DeploymentCapacityDerivedInput, "ifaceMetric">,
) {
	const { ifaceMetric } = input;

	const ifaceColumns: Array<DataTableColumn<InterfaceRow>> = useMemo(
		() => [
			{
				id: "device",
				header: "Device",
				cell: (row) => <span className="font-mono text-xs">{row.device}</span>,
				width: 200,
			},
			{
				id: "iface",
				header: "Interface",
				cell: (row) => <span className="font-mono text-xs">{row.iface}</span>,
				width: 220,
			},
			{
				id: "dir",
				header: "Dir",
				cell: (row) => <span className="text-xs">{row.dir || "—"}</span>,
				width: 90,
			},
			{
				id: "vrf",
				header: "VRF",
				cell: (row) => {
					const vrf = row.vrf ?? row.vrfNames?.[0] ?? "";
					if (!vrf) {
						return <span className="text-muted-foreground text-xs">—</span>;
					}
					const vrfCount = (row.vrfNames ?? []).length;
					return (
						<div className="text-xs">
							<div className="font-mono">{vrf}</div>
							{vrfCount > 1 ? (
								<div className="text-muted-foreground">{vrfCount} vrfs</div>
							) : null}
						</div>
					);
				},
				width: 160,
			},
			{
				id: "speed",
				header: "Speed",
				cell: (row) => (
					<span className="text-xs">{fmtSpeedMbps(row.speedMbps ?? null)}</span>
				),
				width: 90,
				align: "right",
			},
			{
				id: "state",
				header: "State",
				cell: (row) => (
					<span className="text-xs text-muted-foreground">
						{[row.admin, row.oper].filter(Boolean).join(" / ") || "—"}
					</span>
				),
				width: 140,
			},
			{
				id: "p95",
				header: "p95",
				align: "right",
				cell: (row) =>
					ifaceMetric.startsWith("util_") ? fmtPct01(row.p95) : fmtNum(row.p95),
				width: 90,
			},
			...(ifaceMetric.startsWith("util_")
				? ([
						{
							id: "p95Gbps",
							header: "p95 (Gbps)",
							align: "right",
							cell: (row: InterfaceRow) => {
								const speed = Number(row.speedMbps ?? 0);
								const p95 = Number(row.p95 ?? Number.NaN);
								if (!speed || !Number.isFinite(p95)) {
									return (
										<span className="text-muted-foreground text-xs">—</span>
									);
								}
								const gbps = (p95 * speed) / 1000;
								return <span className="text-xs">{gbps.toFixed(2)}</span>;
							},
							width: 110,
						},
					] as Array<DataTableColumn<InterfaceRow>>)
				: []),
			{
				id: "max",
				header: "Max",
				align: "right",
				cell: (row) => {
					const value = ifaceMetric.startsWith("util_")
						? fmtPct01(row.max)
						: fmtNum(row.max);
					const threshold =
						row.threshold ??
						(ifaceMetric.startsWith("util_") ? 0.85 : undefined);
					const hot = threshold !== undefined && (row.max ?? 0) >= threshold;
					return (
						<span className={hot ? "text-destructive font-medium" : ""}>
							{value}
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
							cell: (row: InterfaceRow) => {
								const speed = Number(row.speedMbps ?? 0);
								const maxValue = Number(row.max ?? Number.NaN);
								if (!speed || !Number.isFinite(maxValue)) {
									return (
										<span className="text-muted-foreground text-xs">—</span>
									);
								}
								const gbps = (maxValue * speed) / 1000;
								return <span className="text-xs">{gbps.toFixed(2)}</span>;
							},
							width: 110,
						},
						{
							id: "headroom85",
							header: "Headroom@85 (Gbps)",
							align: "right",
							cell: (row: InterfaceRow) => {
								const speed = Number(row.speedMbps ?? 0);
								const p95 = Number(row.p95 ?? Number.NaN);
								const threshold = Number(row.threshold ?? 0.85);
								if (
									!speed ||
									!Number.isFinite(p95) ||
									!Number.isFinite(threshold)
								) {
									return (
										<span className="text-muted-foreground text-xs">—</span>
									);
								}
								const headroom = Math.max(0, (threshold - p95) * speed) / 1000;
								return <span className="text-xs">{headroom.toFixed(2)}</span>;
							},
							width: 150,
						},
						{
							id: "days85",
							header: "Days@85",
							align: "right",
							cell: (row: InterfaceRow) => {
								if (!row.forecastCrossingTs) {
									return (
										<span className="text-muted-foreground text-xs">—</span>
									);
								}
								const date = parseRFC3339(row.forecastCrossingTs);
								if (!date) {
									return (
										<span className="text-muted-foreground text-xs">—</span>
									);
								}
								const days = Math.round(
									(date.getTime() - Date.now()) / (24 * 3600 * 1000),
								);
								return <span className="text-xs">{days}</span>;
							},
							width: 90,
						},
					] as Array<DataTableColumn<InterfaceRow>>)
				: []),
			{
				id: "slope",
				header: "Slope/d",
				align: "right",
				cell: (row) =>
					ifaceMetric.startsWith("util_")
						? fmtPct01(row.slopePerDay)
						: fmtNum(row.slopePerDay),
				width: 100,
			},
			{
				id: "forecast",
				header: "Forecast",
				cell: (row) => {
					if (!row.forecastCrossingTs) {
						return <span className="text-muted-foreground text-xs">—</span>;
					}
					const date = parseRFC3339(row.forecastCrossingTs);
					const days = date
						? Math.round((date.getTime() - Date.now()) / (24 * 3600 * 1000))
						: null;
					return (
						<div className="text-xs">
							<div className="font-mono">
								{row.forecastCrossingTs.slice(0, 10)}
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
				cell: (row) => <span className="text-xs">{row.samples || 0}</span>,
				width: 70,
			},
		],
		[ifaceMetric],
	);

	const deviceColumns: Array<DataTableColumn<DeviceRow>> = useMemo(
		() => [
			{
				id: "device",
				header: "Device",
				cell: (row) => <span className="font-mono text-xs">{row.device}</span>,
				width: 240,
			},
			{
				id: "meta",
				header: "Meta",
				cell: (row) => (
					<div className="text-xs text-muted-foreground">
						<div>{[row.vendor, row.os].filter(Boolean).join(" • ") || "—"}</div>
						<div className="font-mono">{row.model || ""}</div>
					</div>
				),
				width: 240,
			},
			{
				id: "p95",
				header: "p95",
				align: "right",
				cell: (row) => fmtPct01(row.p95),
				width: 90,
			},
			{
				id: "max",
				header: "Max",
				align: "right",
				cell: (row) => {
					const threshold = row.threshold ?? 0.85;
					const hot = (row.max ?? 0) >= threshold;
					return (
						<span className={hot ? "text-destructive font-medium" : ""}>
							{fmtPct01(row.max)}
						</span>
					);
				},
				width: 90,
			},
			{
				id: "slope",
				header: "Slope/d",
				align: "right",
				cell: (row) => fmtPct01(row.slopePerDay),
				width: 100,
			},
			{
				id: "forecast",
				header: "Forecast",
				cell: (row) => {
					if (!row.forecastCrossingTs) {
						return <span className="text-muted-foreground text-xs">—</span>;
					}
					const date = parseRFC3339(row.forecastCrossingTs);
					const days = date
						? Math.round((date.getTime() - Date.now()) / (24 * 3600 * 1000))
						: null;
					return (
						<div className="text-xs">
							<div className="font-mono">
								{row.forecastCrossingTs.slice(0, 10)}
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
				cell: (row) => <span className="text-xs">{row.samples || 0}</span>,
				width: 70,
			},
		],
		[],
	);

	return { ifaceColumns, deviceColumns };
}
