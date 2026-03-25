import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

function rollupTotal(page: ForwardNetworkCapacityPageState): number {
	const c = page.coverage.data;
	return Number(c?.rollupsInterfaceTotal ?? 0) + Number(c?.rollupsDeviceTotal ?? 0);
}

export function forwardNetworkInsightsEmptyText(
	page: ForwardNetworkCapacityPageState,
): string {
	const inventoryLoaded = Boolean(
		page.inventory.data &&
			((page.inventory.data.interfaces?.length ?? 0) > 0 ||
				(page.inventory.data.devices?.length ?? 0) > 0),
	);
	const total = rollupTotal(page);
	const sampled = Number(page.coverage.data?.rollupsWithSamples ?? 0);
	if (inventoryLoaded && total === 0) {
		return "Inventory is loaded, but Forward has not returned any performance rollups for this network yet.";
	}
	if (inventoryLoaded && total > 0 && sampled === 0) {
		return "Performance rollups exist for this network, but none of them include samples yet.";
	}
	return "No rollups for this window/metric yet. Click Refresh to enqueue.";
}

export function ForwardNetworkInsightsStatusBanner({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	const inventoryLoaded = Boolean(
		page.inventory.data &&
			((page.inventory.data.interfaces?.length ?? 0) > 0 ||
				(page.inventory.data.devices?.length ?? 0) > 0),
	);
	const total = rollupTotal(page);
	const sampled = Number(page.coverage.data?.rollupsWithSamples ?? 0);

	let title = "";
	let body = "";
	let badgeVariant: "secondary" | "outline" | "destructive" = "secondary";

	if (inventoryLoaded && total === 0) {
		title = "Inventory is ready; performance data is not.";
		body =
			"Devices, interfaces, routing, and raw inventory can be explored now. Scorecard, interface/device rollups, growth, and planning remain empty until Forward returns performance history for this network.";
		badgeVariant = "outline";
	} else if (inventoryLoaded && total > 0 && sampled === 0) {
		title = "Performance rollups exist, but they do not contain samples yet.";
		body =
			"This usually means Forward returned the metric objects but no usable history points. Inventory and routing views should still be valid.";
		badgeVariant = "outline";
	} else if (!inventoryLoaded && !page.inventory.isLoading && !page.inventory.isError) {
		title = "No inventory has been cached for this network yet.";
		body =
			"Run Refresh and verify the selected collector can query the target Forward network.";
		badgeVariant = "destructive";
	} else {
		return null;
	}

	return (
		<Card className="border-amber-500/30 bg-amber-500/5">
			<CardContent className="flex flex-col gap-2 pt-6 md:flex-row md:items-start md:justify-between">
				<div className="space-y-1">
					<div className="text-sm font-medium">{title}</div>
					<div className="text-sm text-muted-foreground">{body}</div>
				</div>
				<Badge variant={badgeVariant}>Data readiness</Badge>
			</CardContent>
		</Card>
	);
}
