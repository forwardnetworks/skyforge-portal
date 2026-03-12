import type { DataTableColumn } from "@/components/ui/data-table";
import type {
	DeviceGrowthRowLike,
	InterfaceGrowthRowLike,
} from "./capacity-growth-shared-types";
import { renderGrowthDeltaPercent } from "./capacity-growth-formatting";

export function buildInterfaceGrowthColumns(params: {
	formatPercent01: (value: number | undefined) => string;
	formatSpeedMbps: (value: number | null) => string;
}): Array<DataTableColumn<InterfaceGrowthRowLike>> {
	const { formatPercent01, formatSpeedMbps } = params;
	return [
		{
			id: "device",
			header: "Device",
			cell: (row) => <span className="font-mono text-xs">{row.device}</span>,
			width: 220,
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
			cell: (row) => <span className="text-xs">{row.dir}</span>,
			width: 90,
		},
		{
			id: "speed",
			header: "Speed",
			align: "right",
			cell: (row) => (
				<span className="text-xs">
					{formatSpeedMbps(row.speedMbps ?? null)}
				</span>
			),
			width: 90,
		},
		{
			id: "nowP95",
			header: "Now p95",
			align: "right",
			cell: (row) => formatPercent01(row.nowP95),
			width: 100,
		},
		{
			id: "prevP95",
			header: "Prev p95",
			align: "right",
			cell: (row) => formatPercent01(row.prevP95 ?? undefined),
			width: 100,
		},
		{
			id: "deltaP95",
			header: "Δ p95",
			align: "right",
			cell: (row) => renderGrowthDeltaPercent(row.deltaP95, formatPercent01),
			width: 90,
		},
		{
			id: "deltaGbps",
			header: "Δ p95 (Gbps)",
			align: "right",
			cell: (row) =>
				row.deltaP95Gbps !== null && row.deltaP95Gbps !== undefined ? (
					<span className="text-xs">
						{row.deltaP95Gbps >= 0 ? "+" : ""}
						{row.deltaP95Gbps.toFixed(2)}
					</span>
				) : (
					<span className="text-muted-foreground text-xs">—</span>
				),
			width: 120,
		},
		{
			id: "forecast",
			header: "Forecast",
			cell: (row) => (
				<span className="font-mono text-xs">
					{row.nowForecast ? row.nowForecast.slice(0, 10) : "—"}
				</span>
			),
			width: 120,
		},
	];
}

export function buildDeviceGrowthColumns(params: {
	formatPercent01: (value: number | undefined) => string;
}): Array<DataTableColumn<DeviceGrowthRowLike>> {
	const { formatPercent01 } = params;
	return [
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
			id: "nowP95",
			header: "Now p95",
			align: "right",
			cell: (row) => formatPercent01(row.nowP95),
			width: 100,
		},
		{
			id: "prevP95",
			header: "Prev p95",
			align: "right",
			cell: (row) => formatPercent01(row.prevP95 ?? undefined),
			width: 100,
		},
		{
			id: "deltaP95",
			header: "Δ p95",
			align: "right",
			cell: (row) => renderGrowthDeltaPercent(row.deltaP95, formatPercent01),
			width: 90,
		},
		{
			id: "forecast",
			header: "Forecast",
			cell: (row) => (
				<span className="font-mono text-xs">
					{row.nowForecast ? row.nowForecast.slice(0, 10) : "—"}
				</span>
			),
			width: 120,
		},
	];
}
