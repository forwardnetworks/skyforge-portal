import { Link } from "@tanstack/react-router";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import type { ForwardAnalyticsPageContentProps } from "./forward-analytics-page-shared";
import { formatForwardAnalyticsPct } from "./forward-analytics-page-shared";

export function ForwardAnalyticsPagePortfolioCard({
	page,
}: ForwardAnalyticsPageContentProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Capacity portfolio</CardTitle>
				<CardDescription>
					Quick cross-network view (util_* max &gt;= 85%).
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{!page.selectedUserScopeId ? (
					<div className="text-sm text-muted-foreground">
						Select a user scope to see portfolio rollups.
					</div>
				) : page.portfolioQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading…</div>
				) : page.portfolioQ.isError ? (
					<div className="text-sm text-muted-foreground">
						Unable to load portfolio.
					</div>
				) : page.portfolioItems.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						No portfolio data yet. Save a network and run a Capacity refresh.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="text-xs text-muted-foreground">
								<tr className="border-b text-left">
									<th className="py-2 pr-3">Network</th>
									<th className="py-2 pr-3">As of</th>
									<th className="py-2 pr-3">Hot ifaces</th>
									<th className="py-2 pr-3">Soonest</th>
									<th className="py-2 pr-3">Max max</th>
									<th className="py-2 pr-3">Max p95</th>
								</tr>
							</thead>
							<tbody>
								{page.portfolioItems.map((item) => {
									const asOf = String(item.asOf ?? "").trim() || "—";
									const soonest = String(item.soonestForecast ?? "").trim() || "—";
									return (
										<tr key={String(item.networkRef)} className="border-b">
											<td className="py-2 pr-3">
												<div className="flex items-center gap-2">
													<Button asChild variant="link" className="h-auto p-0">
														<Link
															to="/dashboard/forward-analytics/$networkRef/capacity"
															params={{ networkRef: String(item.networkRef) }}
															search={{ userId: page.selectedUserScopeId } as never}
														>
															{String(item.name ?? item.networkRef)}
														</Link>
													</Button>
													{item.stale ? (
														<Badge variant="destructive">Stale</Badge>
													) : (
														<Badge variant="secondary">Fresh</Badge>
													)}
												</div>
												<div className="truncate font-mono text-xs text-muted-foreground">
													{String(item.forwardNetworkId ?? "")}
												</div>
											</td>
											<td className="py-2 pr-3 font-mono text-xs">{asOf}</td>
											<td className="py-2 pr-3">{Number(item.hotInterfaces ?? 0)}</td>
											<td className="py-2 pr-3 font-mono text-xs">{soonest}</td>
											<td className="py-2 pr-3">{formatForwardAnalyticsPct(item.maxUtilMax)}</td>
											<td className="py-2 pr-3">{formatForwardAnalyticsPct(item.maxUtilP95)}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
