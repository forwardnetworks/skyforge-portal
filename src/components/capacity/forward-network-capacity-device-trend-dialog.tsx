import { fmtPct01 } from "@/components/capacity/forward-network-capacity-utils";
import { SimpleLineChart } from "@/components/capacity/simple-line-chart";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityDeviceTrendDialog({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	return (
		<Dialog
			open={Boolean(page.selectedDevice)}
			onOpenChange={(v) => !v && page.setSelectedDevice(null)}
		>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle className="text-base">Device Trend</DialogTitle>
				</DialogHeader>
				{page.selectedDevice ? (
					<div className="space-y-3">
						<div className="text-sm">
							<span className="font-mono text-xs">
								{page.selectedDevice.device}
							</span>{" "}
							<Badge variant="outline" className="ml-2">
								{page.windowLabel}
							</Badge>
							<Badge variant="secondary" className="ml-2">
								{page.deviceMetric}
							</Badge>
						</div>
						{page.deviceHistory.isLoading ? (
							<Skeleton className="h-24 w-full" />
						) : page.deviceHistory.isError ? (
							<div className="text-sm text-destructive">
								Failed to load history
							</div>
						) : (
							<SimpleLineChart points={page.devicePoints} />
						)}
						<div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
							<div>
								p95:{" "}
								{fmtPct01(
									page.selectedDevice.p95 ??
										page.deviceComputed.p95 ??
										undefined,
								)}
							</div>
							<div className="text-right">
								max:{" "}
								{fmtPct01(
									page.selectedDevice.max ??
										page.deviceComputed.max ??
										undefined,
								)}
							</div>
							<div>slope/day: {fmtPct01(page.selectedDevice.slopePerDay)}</div>
							<div className="text-right">
								forecast:{" "}
								<span className="font-mono">
									{page.selectedDevice.forecastCrossingTs ?? "—"}
								</span>
							</div>
						</div>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
