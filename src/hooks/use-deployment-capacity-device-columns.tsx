import type {
	DeviceRow,
} from "@/components/capacity/deployment-capacity-types";
import { fmtPct01 } from "@/components/capacity/deployment-capacity-utils";
import type { DataTableColumn } from "@/components/ui/data-table";
import { useMemo } from "react";

import { renderForecastCrossingCell } from "@/hooks/use-deployment-capacity-column-helpers";

export function useDeploymentCapacityDeviceColumns() {
	return useMemo(
		() =>
			[
				{
					id: "device",
					header: "Device",
					cell: (row) => (
						<span className="font-mono text-xs">{row.device}</span>
					),
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
			] satisfies Array<DataTableColumn<DeviceRow>>,
		[],
	);
}
