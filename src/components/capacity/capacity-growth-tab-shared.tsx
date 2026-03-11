import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

export type CapacityIfaceGrowthMetric = "util_ingress" | "util_egress";
export type CapacityDeviceGrowthMetric = "device_cpu" | "device_memory";

type GrowthQueryLike = {
	isLoading: boolean;
	isError: boolean;
	error: unknown;
	data?: {
		asOf?: string;
		compareAsOf?: string;
	};
};

export type InterfaceGrowthRowLike = {
	id: string;
	device: string;
	iface: string;
	dir: string;
	speedMbps?: number | null;
	nowP95?: number;
	prevP95?: number | null;
	deltaP95?: number | null;
	deltaP95Gbps?: number | null;
	nowForecast?: string;
};

export type DeviceGrowthRowLike = {
	id: string;
	device: string;
	vendor?: string;
	os?: string;
	model?: string;
	nowP95?: number;
	prevP95?: number | null;
	deltaP95?: number | null;
	nowForecast?: string;
};

type CapacityGrowthTabSharedProps = {
	containerClassName?: string;
	compareHours: number;
	onCompareHoursChange: (hours: number) => void;
	ifaceGrowthMetric: CapacityIfaceGrowthMetric;
	onIfaceGrowthMetricChange: (metric: CapacityIfaceGrowthMetric) => void;
	deviceGrowthMetric: CapacityDeviceGrowthMetric;
	onDeviceGrowthMetricChange: (metric: CapacityDeviceGrowthMetric) => void;
	ifaceGrowth: GrowthQueryLike;
	deviceGrowth: GrowthQueryLike;
	ifaceGrowthRows: InterfaceGrowthRowLike[];
	deviceGrowthRows: DeviceGrowthRowLike[];
	summaryAsOf?: string;
	onIfaceRowClick: (row: InterfaceGrowthRowLike) => void;
	onDeviceRowClick: (row: DeviceGrowthRowLike) => void;
	formatPercent01: (value: number | undefined) => string;
	formatSpeedMbps: (value: number | null) => string;
};

function formatGrowthError(error: unknown) {
	if (error instanceof Error) return error.message;
	return String(error);
}

function renderDeltaPercent(
	delta: number | null | undefined,
	formatPercent01: (value: number | undefined) => string,
) {
	if (delta === null || delta === undefined) {
		return <span className="text-muted-foreground text-xs">—</span>;
	}
	return (
		<span
			className={
				delta > 0 ? "text-foreground font-medium" : "text-muted-foreground"
			}
		>
			{delta >= 0 ? "+" : ""}
			{formatPercent01(delta)}
		</span>
	);
}

function buildInterfaceGrowthColumns(params: {
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
			cell: (row) => renderDeltaPercent(row.deltaP95, formatPercent01),
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

function buildDeviceGrowthColumns(params: {
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
			cell: (row) => renderDeltaPercent(row.deltaP95, formatPercent01),
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

function renderGrowthCards(props: CapacityGrowthTabSharedProps): ReactNode {
	const {
		compareHours,
		onCompareHoursChange,
		ifaceGrowthMetric,
		onIfaceGrowthMetricChange,
		deviceGrowthMetric,
		onDeviceGrowthMetricChange,
		ifaceGrowth,
		deviceGrowth,
		ifaceGrowthRows,
		deviceGrowthRows,
		summaryAsOf,
		onIfaceRowClick,
		onDeviceRowClick,
		formatPercent01,
		formatSpeedMbps,
	} = props;

	return (
		<>
			<Card>
				<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<CardTitle className="text-base">Growth (Delta vs Prior)</CardTitle>
					<div className="flex flex-wrap items-center gap-2">
						<Select
							value={String(compareHours)}
							onValueChange={(value) => onCompareHoursChange(Number(value))}
						>
							<SelectTrigger className="w-[150px]">
								<SelectValue placeholder="Compare" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="24">24h</SelectItem>
								<SelectItem value={String(24 * 7)}>7d</SelectItem>
								<SelectItem value={String(24 * 30)}>30d</SelectItem>
								<SelectItem value={String(24 * 90)}>90d</SelectItem>
							</SelectContent>
						</Select>
						<div className="text-xs text-muted-foreground">
							As of{" "}
							<span className="font-mono">
								{ifaceGrowth.data?.asOf ??
									deviceGrowth.data?.asOf ??
									summaryAsOf ??
									"—"}
							</span>
							{" • "}Compared to{" "}
							<span className="font-mono">
								{ifaceGrowth.data?.compareAsOf ??
									deviceGrowth.data?.compareAsOf ??
									"—"}
							</span>
						</div>
					</div>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					Top growers computed from Skyforge rollups (no Forward time-series
					pull). Use Refresh to enqueue rollup recomputation.
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<CardTitle className="text-base">Interfaces</CardTitle>
					<Select
						value={ifaceGrowthMetric}
						onValueChange={(value) =>
							onIfaceGrowthMetricChange(value as CapacityIfaceGrowthMetric)
						}
					>
						<SelectTrigger className="w-[240px]">
							<SelectValue placeholder="Metric" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="util_ingress">
								Utilization (ingress)
							</SelectItem>
							<SelectItem value="util_egress">Utilization (egress)</SelectItem>
						</SelectContent>
					</Select>
				</CardHeader>
				<CardContent>
					{ifaceGrowth.isLoading ? (
						<Skeleton className="h-32 w-full" />
					) : ifaceGrowth.isError ? (
						<div className="text-destructive text-sm">
							Failed to load growth: {formatGrowthError(ifaceGrowth.error)}
						</div>
					) : (
						<DataTable
							columns={buildInterfaceGrowthColumns({
								formatPercent01,
								formatSpeedMbps,
							})}
							rows={ifaceGrowthRows}
							getRowId={(row) => row.id}
							onRowClick={onIfaceRowClick}
							emptyText="No growth rows yet. Click Refresh to enqueue."
						/>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
					<CardTitle className="text-base">Devices</CardTitle>
					<Select
						value={deviceGrowthMetric}
						onValueChange={(value) =>
							onDeviceGrowthMetricChange(value as CapacityDeviceGrowthMetric)
						}
					>
						<SelectTrigger className="w-[220px]">
							<SelectValue placeholder="Metric" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="device_cpu">CPU</SelectItem>
							<SelectItem value="device_memory">Memory</SelectItem>
						</SelectContent>
					</Select>
				</CardHeader>
				<CardContent>
					{deviceGrowth.isLoading ? (
						<Skeleton className="h-32 w-full" />
					) : deviceGrowth.isError ? (
						<div className="text-destructive text-sm">
							Failed to load growth: {formatGrowthError(deviceGrowth.error)}
						</div>
					) : (
						<DataTable
							columns={buildDeviceGrowthColumns({ formatPercent01 })}
							rows={deviceGrowthRows}
							getRowId={(row) => row.id}
							onRowClick={onDeviceRowClick}
							emptyText="No growth rows yet. Click Refresh to enqueue."
						/>
					)}
				</CardContent>
			</Card>
		</>
	);
}

export function CapacityGrowthTabShared(props: CapacityGrowthTabSharedProps) {
	const cards = renderGrowthCards(props);
	if (!props.containerClassName) return cards;
	return <div className={props.containerClassName}>{cards}</div>;
}
