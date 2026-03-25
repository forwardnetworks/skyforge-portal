import {
	fmtPct01,
	fmtSpeedMbps,
} from "@/components/capacity/forward-network-capacity-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";
import type { ForwardNetworkCapacityUpgradeCandidate } from "@/lib/api-client";
import { forwardNetworkInsightsEmptyText } from "./forward-network-insights-messaging";

export function ForwardNetworkCapacityScorecardTab({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	const ifaces = page.inventory.data?.interfaces ?? [];
	const aggregates = ifaces.filter(
		(r) => String(r.interfaceType ?? "") === "IF_AGGREGATE",
	);
	const members = ifaces.filter((r) => String(r.aggregateId ?? "").trim());
	const items = (page.upgradeCandidates.data?.items ??
		[]) as ForwardNetworkCapacityUpgradeCandidate[];
	const top = items.slice(0, 10);
	const soonest = (() => {
		let best: string | null = null;
		for (const it of items) {
			const s = String(it.forecastCrossingTs ?? "").trim();
			if (!s) continue;
			if (!best || Date.parse(s) < Date.parse(best)) best = s;
		}
		return best;
	})();

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Collection</CardTitle>
					</CardHeader>
					<CardContent className="text-sm space-y-1">
						<div className="flex items-center justify-between">
							<div className="text-xs text-muted-foreground">As of</div>
							<div className="font-mono text-xs">
								{page.summary.data?.asOf ?? page.inventory.data?.asOf ?? "—"}
							</div>
						</div>
						<div className="flex items-center justify-between">
							<div className="text-xs text-muted-foreground">Status</div>
							<div>
								{page.summary.data?.stale ? (
									<Badge variant="destructive">Stale</Badge>
								) : (
									<Badge variant="secondary">Fresh</Badge>
								)}
							</div>
						</div>
						<div className="flex items-center justify-between">
							<div className="text-xs text-muted-foreground">
								Ifaces w/speed
							</div>
							<div className="font-medium text-xs">
								{page.coverage.data
									? `${page.coverage.data.ifacesWithSpeed}/${page.coverage.data.ifacesTotal}`
									: "—"}
							</div>
						</div>
						<div className="flex items-center justify-between">
							<div className="text-xs text-muted-foreground">
								Rollups w/samples
							</div>
							<div className="font-medium text-xs">
								{page.coverage.data
									? `${page.coverage.data.rollupsWithSamples}/${page.coverage.data.rollupsInterfaceTotal + page.coverage.data.rollupsDeviceTotal}`
									: "—"}
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">LAGs</CardTitle>
					</CardHeader>
					<CardContent className="text-sm space-y-1">
						<div className="flex items-center justify-between">
							<div className="text-xs text-muted-foreground">
								Aggregate ifaces
							</div>
							<div className="text-2xl font-semibold">{aggregates.length}</div>
						</div>
						<div className="flex items-center justify-between">
							<div className="text-xs text-muted-foreground">Member ifaces</div>
							<div className="text-2xl font-semibold">{members.length}</div>
						</div>
						<div className="text-xs text-muted-foreground">
							LAG membership from NQE (ethernet.aggregateId +
							aggregation.memberNames).
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Upgrade Risk</CardTitle>
					</CardHeader>
					<CardContent className="text-sm space-y-1">
						<div className="flex items-center justify-between">
							<div className="text-xs text-muted-foreground">Candidates</div>
							<div className="text-2xl font-semibold">{items.length}</div>
						</div>
						<div className="flex items-center justify-between">
							<div className="text-xs text-muted-foreground">
								Soonest forecast
							</div>
							<div className="font-mono text-xs">
								{soonest ? soonest.slice(0, 10) : "—"}
							</div>
						</div>
						<div className="text-xs text-muted-foreground">
							Based on util_* rollups (window {page.windowLabel}).
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Top Upgrade Candidates</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={
							[
								{
									id: "device",
									header: "Device",
									cell: (r) => (
										<span className="font-mono text-xs">{r.device}</span>
									),
									width: 220,
								},
								{
									id: "name",
									header: "Link",
									cell: (r) => (
										<div className="text-xs">
											<div className="flex items-center gap-2">
												<span className="font-mono">{r.name}</span>
												{r.scopeType === "lag" ? (
													<Badge variant="secondary">LAG</Badge>
												) : null}
											</div>
											{r.recommendedSpeedMbps ? (
												<div className="text-muted-foreground">
													Rec: {fmtSpeedMbps(r.recommendedSpeedMbps)}
												</div>
											) : null}
										</div>
									),
									width: 260,
								},
								{
									id: "max",
									header: "Max",
									align: "right",
									cell: (r) => fmtPct01(r.maxUtil),
									width: 90,
								},
								{
									id: "forecast",
									header: "Forecast",
									cell: (r) => (
										<span className="font-mono text-xs">
											{r.forecastCrossingTs
												? String(r.forecastCrossingTs).slice(0, 10)
												: "—"}
										</span>
									),
									width: 120,
								},
								{
									id: "reason",
									header: "Reason",
									cell: (r) => (
										<span className="text-xs text-muted-foreground">
											{r.reason || "—"}
										</span>
									),
									width: 140,
								},
							] as Array<
								DataTableColumn<ForwardNetworkCapacityUpgradeCandidate>
							>
						}
						rows={top}
						getRowId={(r) => `${r.scopeType}:${r.device}:${r.name}`}
						emptyText={forwardNetworkInsightsEmptyText(page)}
						maxHeightClassName="max-h-[320px]"
						minWidthClassName="min-w-0"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
