import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityChangesTab({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Snapshot Delta</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{page.snapshotDelta.isLoading ? (
					<Skeleton className="h-24 w-full" />
				) : page.snapshotDelta.isError ? (
					<div className="text-destructive text-sm">
						Failed to load snapshot delta:{" "}
						{page.snapshotDelta.error instanceof Error
							? page.snapshotDelta.error.message
							: String(page.snapshotDelta.error)}
					</div>
				) : (
					<div className="space-y-3">
						<div className="text-sm text-muted-foreground">
							Latest:{" "}
							<span className="font-mono text-xs">
								{page.snapshotDelta.data?.latestSnapshotId ?? "—"}
							</span>
							{" · "}Prev:{" "}
							<span className="font-mono text-xs">
								{page.snapshotDelta.data?.prevSnapshotId ?? "—"}
							</span>
						</div>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm">Route Scale Changes</CardTitle>
								</CardHeader>
								<CardContent>
									<DataTable
										columns={[
											{
												id: "device",
												header: "Device",
												cell: (r) => (
													<span className="font-mono text-xs">
														{r.deviceName}
													</span>
												),
												width: 220,
											},
											{
												id: "vrf",
												header: "VRF",
												cell: (r) => (
													<span className="font-mono text-xs">{r.vrf}</span>
												),
												width: 160,
											},
											{
												id: "v4",
												header: "IPv4 Δ",
												align: "right",
												cell: (r) => {
													const n = Number(r.ipv4Delta ?? 0);
													return (
														<span className="text-xs tabular-nums">
															{n > 0 ? `+${n}` : String(n)}
														</span>
													);
												},
												width: 90,
											},
											{
												id: "v6",
												header: "IPv6 Δ",
												align: "right",
												cell: (r) => {
													const n = Number(r.ipv6Delta ?? 0);
													return (
														<span className="text-xs tabular-nums">
															{n > 0 ? `+${n}` : String(n)}
														</span>
													);
												},
												width: 90,
											},
										]}
										rows={page.snapshotDelta.data?.routeDelta ?? []}
										getRowId={(r) => `${r.deviceName}:${r.vrf}`}
										emptyText="No route scale deltas between last two snapshots."
										maxHeightClassName="max-h-[320px]"
										minWidthClassName="min-w-0"
									/>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="pb-2">
									<CardTitle className="text-sm">
										BGP Neighbor Changes
									</CardTitle>
								</CardHeader>
								<CardContent>
									<DataTable
										columns={[
											{
												id: "device",
												header: "Device",
												cell: (r) => (
													<span className="font-mono text-xs">
														{r.deviceName}
													</span>
												),
												width: 220,
											},
											{
												id: "vrf",
												header: "VRF",
												cell: (r) => (
													<span className="font-mono text-xs">{r.vrf}</span>
												),
												width: 160,
											},
											{
												id: "nbr",
												header: "Nbrs Δ",
												align: "right",
												cell: (r) => {
													const n = Number(r.neighborsDelta ?? 0);
													return (
														<span className="text-xs tabular-nums">
															{n > 0 ? `+${n}` : String(n)}
														</span>
													);
												},
												width: 80,
											},
											{
												id: "est",
												header: "Est Δ",
												align: "right",
												cell: (r) => {
													const n = Number(r.establishedDelta ?? 0);
													return (
														<span className="text-xs tabular-nums">
															{n > 0 ? `+${n}` : String(n)}
														</span>
													);
												},
												width: 80,
											},
										]}
										rows={page.snapshotDelta.data?.bgpDelta ?? []}
										getRowId={(r) => `${r.deviceName}:${r.vrf}`}
										emptyText="No BGP scale deltas between last two snapshots."
										maxHeightClassName="max-h-[320px]"
										minWidthClassName="min-w-0"
									/>
								</CardContent>
							</Card>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
