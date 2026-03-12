import type {
	InterfaceRow,
} from "@/components/capacity/deployment-capacity-types";
import {
	fmtNum,
	fmtPct01,
	fmtSpeedMbps,
} from "@/components/capacity/deployment-capacity-utils";
import type { DataTableColumn } from "@/components/ui/data-table";
import { useMemo } from "react";
import { isUtilCapacityMetric } from "@/hooks/use-deployment-capacity-column-helpers";

import type { DeploymentCapacityDerivedInput } from "@/hooks/use-deployment-capacity-shared";
import {
	renderForecastCrossingCell,
	renderForecastDaysCell,
	missingCapacityCell,
} from "@/hooks/use-deployment-capacity-column-helpers";

export function useDeploymentCapacityInterfaceColumns({
	ifaceMetric,
}: Pick<DeploymentCapacityDerivedInput, "ifaceMetric">) {
	const isUtilMetric = isUtilCapacityMetric(ifaceMetric);

	return useMemo(
		() =>
			[
				{
					id: "device",
					header: "Device",
					cell: (row) => (
						<span className="font-mono text-xs">{row.device}</span>
					),
					width: 200,
				},
				{
					id: "iface",
					header: "Interface",
					cell: (row) => (
						<span className="font-mono text-xs">{row.iface}</span>
					),
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
							return (
								<span className="text-muted-foreground text-xs">—</span>
							);
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
						isUtilMetric ? fmtPct01(row.p95) : fmtNum(row.p95),
					width: 90,
				},
				...(isUtilMetric
					? ([
							{
								id: "p95Gbps",
								header: "p95 (Gbps)",
								align: "right",
								cell: (row: InterfaceRow) => {
									const speed = Number(row.speedMbps ?? 0);
									const p95 = Number(row.p95 ?? Number.NaN);
									if (!speed || !Number.isFinite(p95)) {
										return missingCapacityCell;
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
						const value = isUtilMetric ? fmtPct01(row.max) : fmtNum(row.max);
						const threshold = row.threshold ?? (isUtilMetric ? 0.85 : undefined);
						const hot = threshold !== undefined && (row.max ?? 0) >= threshold;
						return (
							<span className={hot ? "text-destructive font-medium" : ""}>
								{value}
							</span>
						);
					},
					width: 90,
				},
				...(isUtilMetric
					? ([
							{
								id: "maxGbps",
								header: "Max (Gbps)",
								align: "right",
								cell: (row: InterfaceRow) => {
									const speed = Number(row.speedMbps ?? 0);
									const maxValue = Number(row.max ?? Number.NaN);
									if (!speed || !Number.isFinite(maxValue)) {
										return missingCapacityCell;
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
										return missingCapacityCell;
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
								cell: (row: InterfaceRow) =>
									renderForecastDaysCell(row.forecastCrossingTs),
								width: 90,
							},
						] as Array<DataTableColumn<InterfaceRow>>)
					: []),
				{
					id: "slope",
					header: "Slope/d",
					align: "right",
					cell: (row) =>
						isUtilMetric ? fmtPct01(row.slopePerDay) : fmtNum(row.slopePerDay),
					width: 100,
				},
				{
					id: "forecast",
					header: "Forecast",
					cell: (row) => renderForecastCrossingCell(row.forecastCrossingTs),
					width: 120,
				},
				{
					id: "samples",
					header: "N",
					align: "right",
					cell: (row) => <span className="text-xs">{row.samples || 0}</span>,
					width: 70,
				},
			] satisfies Array<DataTableColumn<InterfaceRow>>,
		[isUtilMetric],
	);
}
