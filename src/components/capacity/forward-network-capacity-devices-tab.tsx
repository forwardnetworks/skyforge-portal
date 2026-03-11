import {
	downloadText,
	fmtPct01,
	toCSV,
} from "@/components/capacity/forward-network-capacity-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityDevicesTab({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<CardTitle className="text-base">Device Capacity</CardTitle>
				<div className="flex flex-col gap-2 md:flex-row md:items-center">
					<Input
						placeholder="Filter (device / vendor / os)…"
						value={page.deviceFilter}
						onChange={(e) => page.setDeviceFilter(e.target.value)}
						className="w-[260px]"
					/>
					<Select
						value={page.deviceMetric}
						onValueChange={(v) => page.setDeviceMetric(v as any)}
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
							const rows = page.deviceRows.map((r) => [
								r.device,
								page.windowLabel,
								page.deviceMetric,
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
								`capacity_devices_${page.networkRefId}_${page.windowLabel}_${page.deviceMetric}.csv`,
								"text/csv",
								toCSV(headers, rows),
							);
						}}
						disabled={page.deviceRows.length === 0}
					>
						Export CSV
					</Button>
					<Button
						variant="outline"
						onClick={() => page.setPickDeviceOpen(true)}
						disabled={page.inventory.isLoading || page.inventory.isError}
						title="Pick any device from NQE inventory and load trend from Forward perf history"
					>
						Pick device
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				{page.groupBy !== "none" ? (
					<div className="space-y-2">
						<div className="text-xs text-muted-foreground">
							Group summary ({page.groupBy})
						</div>
						<DataTable
							columns={[
								{
									id: "group",
									header: "Group",
									cell: (r) => (
										<span className="font-mono text-xs">{r.group}</span>
									),
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
							]}
							rows={page.deviceGroupSummary}
							getRowId={(r) => r.group}
							emptyText="No groups."
							maxHeightClassName="max-h-[260px]"
							minWidthClassName="min-w-0"
						/>
					</div>
				) : null}

				{page.summary.isLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-5 w-56" />
						<Skeleton className="h-32 w-full" />
					</div>
				) : page.summary.isError ? (
					<div className="text-destructive text-sm">
						Failed to load summary:{" "}
						{page.summary.error instanceof Error
							? page.summary.error.message
							: String(page.summary.error)}
					</div>
				) : (
					<DataTable
						columns={page.deviceColumns}
						rows={page.deviceRows}
						getRowId={(r) => r.id}
						onRowClick={(r) => page.setSelectedDevice(r)}
						emptyText="No rollups for this window/metric yet. Click Refresh to enqueue."
					/>
				)}
			</CardContent>
		</Card>
	);
}
