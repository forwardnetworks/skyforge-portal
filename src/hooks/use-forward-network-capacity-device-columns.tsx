import type { DeviceRow } from "@/components/capacity/forward-network-capacity-types";
import {
	fmtPct01,
	parseRFC3339,
} from "@/components/capacity/forward-network-capacity-utils";
import type { DataTableColumn } from "@/components/ui/data-table";
import { useMemo } from "react";

export function useForwardNetworkCapacityDeviceColumns() {
	return useMemo(
		() =>
			[
				{
					id: "device",
					header: "Device",
					cell: (r) => <span className="font-mono text-xs">{r.device}</span>,
					width: 240,
				},
				{
					id: "meta",
					header: "Meta",
					cell: (r) => (
						<div className="text-xs text-muted-foreground">
							<div>{[r.vendor, r.os].filter(Boolean).join(" • ") || "—"}</div>
							<div className="font-mono">{r.model || ""}</div>
						</div>
					),
					width: 240,
				},
				{
					id: "p95",
					header: "p95",
					align: "right",
					cell: (r) => fmtPct01(r.p95),
					width: 90,
				},
				{
					id: "max",
					header: "Max",
					align: "right",
					cell: (r) => {
						const thr = r.threshold ?? 0.85;
						const hot = (r.max ?? 0) >= thr;
						return (
							<span className={hot ? "text-destructive font-medium" : ""}>
								{fmtPct01(r.max)}
							</span>
						);
					},
					width: 90,
				},
				{
					id: "slope",
					header: "Slope/d",
					align: "right",
					cell: (r) => fmtPct01(r.slopePerDay),
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
			] satisfies Array<DataTableColumn<DeviceRow>>,
		[],
	);
}
