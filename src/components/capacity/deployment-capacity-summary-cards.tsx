import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function DeploymentCapacitySummaryCards(props: {
	page: DeploymentCapacityPageState;
}) {
	const { page } = props;
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">As Of</CardTitle>
				</CardHeader>
				<CardContent className="text-sm">
					<div className="font-mono text-xs">
						{page.summary.data?.asOf ?? page.inventory.data?.asOf ?? "—"}
					</div>
					<div className="mt-2 flex items-center gap-2">
						{page.summary.data?.stale ? (
							<Badge variant="destructive">Stale</Badge>
						) : (
							<Badge variant="secondary">Fresh</Badge>
						)}
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
								{String(page.overview.soonest.details?.deviceName ?? "")}{" "}
								{String(page.overview.soonest.details?.interfaceName ?? "")}{" "}
								{String(page.overview.soonest.details?.direction ?? "")}
							</div>
						</div>
					) : (
						<div className="text-sm text-muted-foreground">—</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
