import { fmtPct01 } from "@/components/capacity/forward-network-capacity-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityVrfSummaryCard(props: {
	page: ForwardNetworkCapacityPageState;
}) {
	const { page } = props;
	const inventoryError =
		page.inventory.error instanceof Error
			? page.inventory.error.message
			: String(page.inventory.error);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">VRF Summary (Perf + Scale)</CardTitle>
			</CardHeader>
			<CardContent>
				{page.inventory.isLoading ? (
					<Skeleton className="h-28 w-full" />
				) : page.inventory.isError ? (
					<div className="text-destructive text-sm">
						Failed to load inventory: {inventoryError}
					</div>
				) : (
					<DataTable
						columns={[
							{
								id: "device",
								header: "Device",
								cell: (row) => (
									<span className="font-mono text-xs">{row.deviceName}</span>
								),
								width: 240,
							},
							{
								id: "vrf",
								header: "VRF",
								cell: (row) => (
									<span className="font-mono text-xs">{row.vrf}</span>
								),
								width: 180,
							},
							{
								id: "v4",
								header: "IPv4",
								align: "right",
								cell: (row) => (
									<span className="text-xs tabular-nums">{row.ipv4Routes}</span>
								),
								width: 90,
							},
							{
								id: "v6",
								header: "IPv6",
								align: "right",
								cell: (row) => (
									<span className="text-xs tabular-nums">{row.ipv6Routes}</span>
								),
								width: 90,
							},
							{
								id: "bgp",
								header: "BGP",
								align: "right",
								cell: (row) => (
									<span className="text-xs tabular-nums">
										{row.bgpNeighbors} ({row.bgpEstablished})
									</span>
								),
								width: 110,
							},
							{
								id: "max",
								header: "Max util",
								align: "right",
								cell: (row) => fmtPct01(row.maxIfaceMax),
								width: 100,
							},
							{
								id: "forecast",
								header: "Soonest",
								cell: (row) => (
									<span className="font-mono text-xs">
										{row.soonestForecast
											? row.soonestForecast.slice(0, 10)
											: "—"}
									</span>
								),
								width: 120,
							},
						]}
						rows={page.vrfSummaryRows}
						getRowId={(row) => row.id}
						onRowClick={(row) => {
							page.setRoutingDeviceFilter(row.deviceName);
							page.setRoutingVrfFilter(row.vrf);
							page.setVrfFilter(row.vrf);
						}}
						emptyText="No VRF summary available yet. Click Refresh to enqueue."
						maxHeightClassName="max-h-[360px]"
						minWidthClassName="min-w-0"
					/>
				)}
			</CardContent>
		</Card>
	);
}
