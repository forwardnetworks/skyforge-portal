import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { ForwardNetworkInsightsStatusBanner } from "./forward-network-insights-messaging";
import type { ForwardNetworkCapacityPageContentProps } from "./forward-network-capacity-page-shared";
import { formatFreshnessAge } from "./forward-network-capacity-freshness";
import { ForwardNetworkCapacityAsOfBadge } from "./forward-network-capacity-header";

export function ForwardNetworkCapacityOverviewCards({
	page,
}: ForwardNetworkCapacityPageContentProps) {
	return (
		<div className="space-y-4">
			<ForwardNetworkInsightsStatusBanner page={page} />
			{page.summary.data?.stale ? (
				<Card className="border-destructive/40 bg-destructive/5">
					<CardContent className="flex items-center gap-2 pt-6 text-sm text-destructive">
						<AlertTriangle className="h-4 w-4" />
						<span>
							Data is stale (
							{formatFreshnessAge(
								page.summary.data?.asOf ?? page.inventory.data?.asOf,
							)}
							). Use Refresh to enqueue new rollups and insight runs.
						</span>
					</CardContent>
				</Card>
			) : null}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">As Of</CardTitle>
					</CardHeader>
					<CardContent className="text-sm">
						<div className="font-mono text-xs">
							{page.summary.data?.asOf ?? page.inventory.data?.asOf ?? "—"}
						</div>
						<div className="mt-1 text-xs text-muted-foreground">
							Age:{" "}
							{formatFreshnessAge(
								page.summary.data?.asOf ?? page.inventory.data?.asOf,
							)}
						</div>
						<div className="mt-2 flex items-center gap-2">
							<ForwardNetworkCapacityAsOfBadge page={page} />
							<Badge variant="outline" className="font-mono text-xs">
								{page.forwardNetworkId || "no-forward"}
							</Badge>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Hot Interfaces</CardTitle>
					</CardHeader>
					<CardContent className="text-sm">
						<div className="text-2xl font-semibold">{page.overview.above}</div>
						<div className="mt-1 text-xs text-muted-foreground">
							util_* max &gt;= 85%
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Soonest Saturation</CardTitle>
					</CardHeader>
					<CardContent className="text-sm">
						{page.overview.soonest?.forecastCrossingTs ? (
							<div className="space-y-1">
								<div className="font-mono text-xs">
									{page.overview.soonest.forecastCrossingTs}
								</div>
								<div className="text-xs text-muted-foreground">
									{String(page.overview.soonest.details?.["deviceName"] ?? "")}{" "}
									{String(page.overview.soonest.details?.["interfaceName"] ?? "")}{" "}
									{String(page.overview.soonest.details?.["direction"] ?? "")}
								</div>
							</div>
						) : (
							<div className="text-sm text-muted-foreground">—</div>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Data Readiness</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1 text-sm">
						<ForwardNetworkCapacityCoverage page={page} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function ForwardNetworkCapacityCoverage({
	page,
}: ForwardNetworkCapacityPageContentProps) {
	const c = page.coverage.data;
	const pct = (num: number, den: number) =>
		!den ? "—" : `${((num / den) * 100).toFixed(0)}%`;
	const ifacePct = c ? pct(c.ifacesWithSpeed, c.ifacesTotal) : "—";
	const rollupDen = c ? c.rollupsInterfaceTotal + c.rollupsDeviceTotal : 0;
	const rollupPct = c ? pct(c.rollupsWithSamples, rollupDen) : "—";
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3">
				<div className="text-xs text-muted-foreground">Ifaces w/speed</div>
				<div className="font-medium">
					{ifacePct}{" "}
					<span className="text-xs text-muted-foreground">
						({c ? `${c.ifacesWithSpeed}/${c.ifacesTotal}` : "—"})
					</span>
				</div>
			</div>
			<div className="flex items-center justify-between gap-3">
				<div className="text-xs text-muted-foreground">Rollups w/samples</div>
				<div className="font-medium">
					{rollupPct}{" "}
					<span className="text-xs text-muted-foreground">
						({c ? `${c.rollupsWithSamples}/${rollupDen}` : "—"})
					</span>
				</div>
			</div>
			<div className="text-xs text-muted-foreground">
				Inv: <span className="font-mono">{c?.asOfInventory ?? "—"}</span>
				{" · "}Rollups: <span className="font-mono">{c?.asOfRollups ?? "—"}</span>
			</div>
		</div>
	);
}
