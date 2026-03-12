import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import type {
	CapacityDeviceGrowthMetric,
	CapacityIfaceGrowthMetric,
	DeviceGrowthRowLike,
	GrowthQueryLike,
	InterfaceGrowthRowLike,
} from "./capacity-growth-shared-types";
import { formatGrowthError } from "./capacity-growth-formatting";
import { buildDeviceGrowthColumns, buildInterfaceGrowthColumns } from "./capacity-growth-columns";

type GrowthHeaderProps = {
	compareHours: number;
	onCompareHoursChange: (hours: number) => void;
	ifaceGrowth: GrowthQueryLike;
	deviceGrowth: GrowthQueryLike;
	summaryAsOf?: string;
};

export function CapacityGrowthHeaderCard({
	compareHours,
	onCompareHoursChange,
	ifaceGrowth,
	deviceGrowth,
	summaryAsOf,
}: GrowthHeaderProps) {
	return (
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
							{ifaceGrowth.data?.asOf ?? deviceGrowth.data?.asOf ?? summaryAsOf ?? "—"}
						</span>
						{" • "}Compared to{" "}
						<span className="font-mono">
							{ifaceGrowth.data?.compareAsOf ?? deviceGrowth.data?.compareAsOf ?? "—"}
						</span>
					</div>
				</div>
			</CardHeader>
			<CardContent className="text-sm text-muted-foreground">
				Top growers computed from Skyforge rollups (no Forward time-series
				pull). Use Refresh to enqueue rollup recomputation.
			</CardContent>
		</Card>
	);
}

type CapacityGrowthInterfaceTableProps = {
	ifaceGrowthMetric: CapacityIfaceGrowthMetric;
	onIfaceGrowthMetricChange: (metric: CapacityIfaceGrowthMetric) => void;
	formatPercent01: (value: number | undefined) => string;
	formatSpeedMbps: (value: number | null) => string;
	ifaceGrowth: GrowthQueryLike;
	ifaceGrowthRows: InterfaceGrowthRowLike[];
	onIfaceRowClick: (row: InterfaceGrowthRowLike) => void;
};

export function CapacityGrowthInterfaceTableCard(
	props: CapacityGrowthInterfaceTableProps,
) {
	const {
		ifaceGrowthMetric,
		onIfaceGrowthMetricChange,
		formatPercent01,
		formatSpeedMbps,
		ifaceGrowth,
		ifaceGrowthRows,
		onIfaceRowClick,
	} = props;
	return (
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
	);
}

type CapacityGrowthDeviceTableProps = {
	deviceGrowthMetric: CapacityDeviceGrowthMetric;
	onDeviceGrowthMetricChange: (metric: CapacityDeviceGrowthMetric) => void;
	formatPercent01: (value: number | undefined) => string;
	deviceGrowth: GrowthQueryLike;
	deviceGrowthRows: DeviceGrowthRowLike[];
	onDeviceRowClick: (row: DeviceGrowthRowLike) => void;
};

export function CapacityGrowthDeviceTableCard(props: CapacityGrowthDeviceTableProps) {
	const {
		deviceGrowthMetric,
		onDeviceGrowthMetricChange,
		formatPercent01,
		deviceGrowth,
		deviceGrowthRows,
		onDeviceRowClick,
	} = props;
	return (
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
	);
}
