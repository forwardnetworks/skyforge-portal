import { fmtPct01 } from "@/components/capacity/deployment-capacity-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function DeploymentCapacityTcamCard(props: {
	page: DeploymentCapacityPageState;
}) {
	const { page } = props;

	return (
		<Card>
			<CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<CardTitle className="text-base">Hardware Capacity (TCAM)</CardTitle>
				<div className="text-xs text-muted-foreground">
					Derived from Forward CUSTOM command outputs. Configure a TCAM command
					collection to populate.
				</div>
			</CardHeader>
			<CardContent>
				{page.inventory.isLoading ? (
					<Skeleton className="h-28 w-full" />
				) : page.inventory.isError ? (
					<div className="text-destructive text-sm">
						Failed to load inventory:{" "}
						{page.inventory.error instanceof Error
							? page.inventory.error.message
							: String(page.inventory.error)}
					</div>
				) : (
					<DataTable
						columns={
							[
								{
									id: "device",
									header: "Device",
									cell: (row) => (
										<span className="font-mono text-xs">{row.deviceName}</span>
									),
									width: 240,
								},
								{
									id: "meta",
									header: "Meta",
									cell: (row) => (
										<div className="text-xs text-muted-foreground">
											<div>
												{[row.vendor ?? "", row.os ?? ""]
													.filter(Boolean)
													.join(" • ") || "—"}
											</div>
											<div className="font-mono">{String(row.model ?? "")}</div>
										</div>
									),
									width: 240,
								},
								{
									id: "used",
									header: "Used",
									align: "right",
									cell: (row) => (
										<span className="text-xs tabular-nums">
											{Number(row.tcamUsed ?? 0)}
										</span>
									),
									width: 90,
								},
								{
									id: "total",
									header: "Total",
									align: "right",
									cell: (row) => (
										<span className="text-xs tabular-nums">
											{Number(row.tcamTotal ?? 0)}
										</span>
									),
									width: 90,
								},
								{
									id: "util",
									header: "Util",
									align: "right",
									cell: (row) => {
										const used = Number(row.tcamUsed ?? 0);
										const total = Number(row.tcamTotal ?? 0);
										if (!total) {
											return (
												<span className="text-muted-foreground text-xs">—</span>
											);
										}
										return (
											<span className="text-xs">{fmtPct01(used / total)}</span>
										);
									},
									width: 90,
								},
								{
									id: "cmd",
									header: "Command",
									cell: (row) => (
										<span className="font-mono text-xs">
											{String(row.commandText ?? "").slice(0, 48) || "—"}
										</span>
									),
									width: 260,
								},
								{
									id: "evidence",
									header: "Evidence",
									cell: (row) => (
										<span className="font-mono text-xs text-muted-foreground">
											{String(row.evidence ?? "").slice(0, 60) || "—"}
										</span>
									),
									width: 320,
								},
							] as Array<DataTableColumn<any>>
						}
						rows={page.filteredHardwareTcam}
						getRowId={(row) => row.deviceName}
						onRowClick={(row) => {
							page.setRoutingDeviceFilter(row.deviceName);
							const text = [
								`device: ${String(row.deviceName ?? "")}`,
								`command: ${String(row.commandText ?? "")}`,
								`used/total: ${Number(row.tcamUsed ?? 0)}/${Number(row.tcamTotal ?? 0)}`,
								"",
								String(row.evidence ?? ""),
							].join("\n");
							page.setTcamDialogText(text);
							page.setTcamDialogOpen(true);
						}}
						emptyText="No TCAM rows cached yet. Click Refresh after enabling custom commands."
						maxHeightClassName="max-h-[320px]"
						minWidthClassName="min-w-0"
					/>
				)}
			</CardContent>
		</Card>
	);
}
