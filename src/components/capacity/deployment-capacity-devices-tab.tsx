import type { GroupSummaryRow } from "@/components/capacity/deployment-capacity-types";
import {
	downloadText,
	fmtPct01,
	toCSV,
} from "@/components/capacity/deployment-capacity-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function DeploymentCapacityDevicesTab(props: {
	deploymentId: string;
	page: DeploymentCapacityPageState;
}) {
	const { deploymentId, page } = props;
	const {
		windowLabel,
		deviceMetric,
		setDeviceMetric,
		deviceFilter,
		setDeviceFilter,
		groupBy,
		deviceRows,
		deviceGroupSummary,
		summary,
		inventory,
		setPickDeviceOpen,
		setSelectedDevice,
	} = page;

	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<CardTitle className="text-base">Device Capacity</CardTitle>
				<div className="flex flex-col gap-2 md:flex-row md:items-center">
					<Input
						placeholder="Filter (device / vendor / os)…"
						value={deviceFilter}
						onChange={(e) => setDeviceFilter(e.target.value)}
						className="w-[260px]"
					/>
					<Select
						value={deviceMetric}
						onValueChange={(v) => setDeviceMetric(v as typeof deviceMetric)}
					>
						<SelectTrigger className="w-[220px]">
							<SelectValue placeholder="Metric" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="device_cpu">CPU</SelectItem>
							<SelectItem value="device_memory">Memory</SelectItem>
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						onClick={() => {
							const headers = [
								"device",
								"window",
								"metric",
								"vendor",
								"os",
								"model",
								"p95",
								"p99",
								"max",
								"slopePerDay",
								"forecastCrossingTs",
								"samples",
							];
							const rows = deviceRows.map((r) => [
								r.device,
								windowLabel,
								deviceMetric,
								r.vendor ?? "",
								r.os ?? "",
								r.model ?? "",
								r.p95 ?? "",
								r.p99 ?? "",
								r.max ?? "",
								r.slopePerDay ?? "",
								r.forecastCrossingTs ?? "",
								r.samples ?? 0,
							]);
							downloadText(
								`capacity_devices_${deploymentId}_${windowLabel}_${deviceMetric}.csv`,
								"text/csv",
								toCSV(headers, rows),
							);
						}}
						disabled={deviceRows.length === 0}
					>
						Export CSV
					</Button>
					<Button
						variant="outline"
						onClick={() => setPickDeviceOpen(true)}
						disabled={inventory.isLoading || inventory.isError}
						title="Pick any device from NQE inventory and load trend from Forward perf history"
					>
						Pick device
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				{groupBy !== "none" ? (
					<div className="space-y-2">
						<div className="text-xs text-muted-foreground">
							Group summary ({groupBy})
						</div>
						<DataTable
							columns={deviceGroupColumns}
							rows={deviceGroupSummary}
							getRowId={(r) => r.group}
							emptyText="No groups."
							maxHeightClassName="max-h-[260px]"
							minWidthClassName="min-w-0"
						/>
					</div>
				) : null}
				{summary.isLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-5 w-56" />
						<Skeleton className="h-32 w-full" />
					</div>
				) : summary.isError ? (
					<div className="text-destructive text-sm">
						Failed to load summary:{" "}
						{summary.error instanceof Error
							? summary.error.message
							: String(summary.error)}
					</div>
				) : (
					<DataTable
						columns={page.deviceColumns}
						rows={deviceRows}
						getRowId={(r) => r.id}
						onRowClick={(r) => setSelectedDevice(r)}
						emptyText="No rollups for this window/metric yet. Click Refresh to enqueue."
					/>
				)}
			</CardContent>
		</Card>
	);
}

const deviceGroupColumns: Array<DataTableColumn<GroupSummaryRow>> = [
	{
		id: "group",
		header: "Group",
		cell: (r) => <span className="font-mono text-xs">{r.group}</span>,
		width: 260,
	},
	{
		id: "count",
		header: "Count",
		align: "right",
		cell: (r) => <span className="text-xs">{r.count}</span>,
		width: 90,
	},
	{
		id: "hot",
		header: "Hot",
		align: "right",
		cell: (r) => <span className="text-xs">{r.hotCount}</span>,
		width: 90,
	},
	{
		id: "p95",
		header: "Max p95",
		align: "right",
		cell: (r) => fmtPct01(r.maxP95),
		width: 100,
	},
];
