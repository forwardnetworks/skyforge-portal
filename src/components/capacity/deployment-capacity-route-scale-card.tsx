import { Button } from "@/components/ui/button";
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
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function DeploymentCapacityRouteScaleCard(props: {
	page: DeploymentCapacityPageState;
}) {
	const { page } = props;

	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<CardTitle className="text-base">Routing Scale</CardTitle>
				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={page.routingDeviceFilter}
						onValueChange={page.setRoutingDeviceFilter}
					>
						<SelectTrigger className="w-[220px]">
							<SelectValue placeholder="Device" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All devices</SelectItem>
							{page.routingOptions.devices.map((device) => (
								<SelectItem key={device} value={device}>
									{device}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={page.routingVrfFilter}
						onValueChange={page.setRoutingVrfFilter}
					>
						<SelectTrigger className="w-[170px]">
							<SelectValue placeholder="VRF" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All VRFs</SelectItem>
							{page.routingOptions.vrfs.map((vrf) => (
								<SelectItem key={vrf} value={vrf}>
									{vrf}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						onClick={() => {
							page.setRoutingDeviceFilter("all");
							page.setRoutingVrfFilter("all");
						}}
						disabled={
							page.routingDeviceFilter === "all" &&
							page.routingVrfFilter === "all"
						}
					>
						Clear
					</Button>
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
										<span className="text-xs">{row.ipv4Routes}</span>
									),
									width: 90,
								},
								{
									id: "v6",
									header: "IPv6",
									align: "right",
									cell: (row) => (
										<span className="text-xs">{row.ipv6Routes}</span>
									),
									width: 90,
								},
							] as Array<DataTableColumn<any>>
						}
						rows={page.filteredRouteScale}
						getRowId={(row) => `${row.deviceName}:${row.vrf}`}
						emptyText="No routing scale cached yet. Click Refresh to enqueue."
					/>
				)}
			</CardContent>
		</Card>
	);
}
