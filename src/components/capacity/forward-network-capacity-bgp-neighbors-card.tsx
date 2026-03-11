import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityBgpNeighborsCard(props: {
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
				<CardTitle className="text-base">BGP Neighbors</CardTitle>
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
								width: 220,
							},
							{
								id: "vrf",
								header: "VRF",
								cell: (row) => (
									<span className="font-mono text-xs">{row.vrf}</span>
								),
								width: 160,
							},
							{
								id: "nbr",
								header: "Neighbor",
								cell: (row) => (
									<span className="font-mono text-xs">
										{row.neighborAddress}
									</span>
								),
								width: 220,
							},
							{
								id: "state",
								header: "State",
								cell: (row) => (
									<span className="text-xs">{row.sessionState ?? "—"}</span>
								),
								width: 120,
							},
							{
								id: "rx",
								header: "Rx",
								align: "right",
								cell: (row) => (
									<span className="text-xs">{row.receivedPrefixes ?? "—"}</span>
								),
								width: 90,
							},
							{
								id: "tx",
								header: "Tx",
								align: "right",
								cell: (row) => (
									<span className="text-xs">
										{row.advertisedPrefixes ?? "—"}
									</span>
								),
								width: 90,
							},
						]}
						rows={page.filteredBgpNeighbors}
						getRowId={(row) =>
							`${row.deviceName}:${row.vrf}:${row.neighborAddress}`
						}
						emptyText="No BGP cache yet. Click Refresh to enqueue."
					/>
				)}
			</CardContent>
		</Card>
	);
}
