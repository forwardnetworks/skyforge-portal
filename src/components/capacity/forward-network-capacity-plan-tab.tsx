import {
	downloadText,
	fmtPct01,
	fmtSpeedMbps,
	toCSV,
} from "@/components/capacity/forward-network-capacity-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";
import type { ForwardNetworkCapacityUpgradeCandidate } from "@/lib/api-client";

export function ForwardNetworkCapacityPlanTab({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<CardTitle className="text-base">Upgrade Candidates</CardTitle>
				<div className="flex flex-col gap-2 md:flex-row md:items-center">
					<Input
						placeholder="Filter (device / link)…"
						value={page.planFilter}
						onChange={(e) => page.setPlanFilter(e.target.value)}
						className="w-[260px]"
					/>
					<Button
						variant="outline"
						onClick={() => {
							const items = (page.upgradeCandidates.data?.items ??
								[]) as ForwardNetworkCapacityUpgradeCandidate[];
							const q = page.planFilter.trim().toLowerCase();
							const filtered = q
								? items.filter((it) =>
										`${it.device} ${it.name} ${(it.members ?? []).join(" ")}`
											.toLowerCase()
											.includes(q),
									)
								: items;
							const headers = [
								"scopeType",
								"device",
								"name",
								"members",
								"speedMbps",
								"worstDirection",
								"p95Util",
								"maxUtil",
								"p95Gbps",
								"maxGbps",
								"forecastCrossingTs",
								"requiredSpeedMbps",
								"recommendedSpeedMbps",
								"reason",
								"worstMemberMaxUtil",
							];
							const rows = filtered.map((it) => [
								it.scopeType ?? "",
								it.device ?? "",
								it.name ?? "",
								(it.members ?? []).join(" "),
								it.speedMbps ?? "",
								it.worstDirection ?? "",
								it.p95Util ?? "",
								it.maxUtil ?? "",
								it.p95Gbps ?? "",
								it.maxGbps ?? "",
								it.forecastCrossingTs ?? "",
								it.requiredSpeedMbps ?? "",
								it.recommendedSpeedMbps ?? "",
								it.reason ?? "",
								it.worstMemberMaxUtil ?? "",
							]);
							downloadText(
								`upgrade-candidates-${page.networkRefId}-${page.windowLabel}.csv`,
								"text/csv",
								toCSV(headers, rows),
							);
						}}
						disabled={page.upgradeCandidates.isLoading}
					>
						Export CSV
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{page.upgradeCandidates.isLoading ? (
					<Skeleton className="h-24 w-full" />
				) : page.upgradeCandidates.isError ? (
					<div className="text-destructive text-sm">
						Failed to load upgrade candidates:{" "}
						{page.upgradeCandidates.error instanceof Error
							? page.upgradeCandidates.error.message
							: String(page.upgradeCandidates.error)}
					</div>
				) : (
					(() => {
						const items = (page.upgradeCandidates.data?.items ??
							[]) as ForwardNetworkCapacityUpgradeCandidate[];
						const q = page.planFilter.trim().toLowerCase();
						const filtered = q
							? items.filter((it) =>
									`${it.device} ${it.name} ${(it.members ?? []).join(" ")}`
										.toLowerCase()
										.includes(q),
								)
							: items;
						return (
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
											id: "link",
											header: "Link",
											cell: (r) => (
												<div className="text-xs">
													<div className="flex items-center gap-2">
														<span className="font-mono">{r.name}</span>
														{r.scopeType === "lag" ? (
															<Badge variant="secondary">LAG</Badge>
														) : null}
														{r.recommendedSpeedMbps ? (
															<Badge variant="destructive">upgrade</Badge>
														) : null}
													</div>
													{(r.members ?? []).length ? (
														<div className="text-muted-foreground">
															{(r.members ?? []).length} members
														</div>
													) : null}
												</div>
											),
											width: 240,
										},
										{
											id: "speed",
											header: "Speed",
											align: "right",
											cell: (r) => (
												<span className="text-xs">
													{fmtSpeedMbps(r.speedMbps)}
												</span>
											),
											width: 90,
										},
										{
											id: "dir",
											header: "Worst",
											cell: (r) => (
												<span className="text-xs">
													{r.worstDirection || "—"}
												</span>
											),
											width: 90,
										},
										{
											id: "max",
											header: "Max",
											align: "right",
											cell: (r) => (
												<span
													className={
														r.maxUtil >= 0.85
															? "text-destructive font-medium"
															: ""
													}
												>
													{fmtPct01(r.maxUtil)}
												</span>
											),
											width: 90,
										},
										{
											id: "p95",
											header: "p95",
											align: "right",
											cell: (r) => fmtPct01(r.p95Util),
											width: 90,
										},
										{
											id: "maxGbps",
											header: "Max (Gbps)",
											align: "right",
											cell: (r) => (
												<span className="text-xs tabular-nums">
													{Number(r.maxGbps ?? 0).toFixed(2)}
												</span>
											),
											width: 110,
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
											id: "req",
											header: "Req",
											align: "right",
											cell: (r) =>
												r.requiredSpeedMbps ? (
													<span className="text-xs">
														{fmtSpeedMbps(r.requiredSpeedMbps)}
													</span>
												) : (
													<span className="text-muted-foreground text-xs">
														—
													</span>
												),
											width: 90,
										},
										{
											id: "rec",
											header: "Rec",
											align: "right",
											cell: (r) =>
												r.recommendedSpeedMbps ? (
													<span className="text-xs font-medium text-destructive">
														{fmtSpeedMbps(r.recommendedSpeedMbps)}
													</span>
												) : (
													<span className="text-muted-foreground text-xs">
														—
													</span>
												),
											width: 90,
										},
										{
											id: "imb",
											header: "Worst member",
											align: "right",
											cell: (r) =>
												r.worstMemberMaxUtil ? (
													<span className="text-xs">
														{fmtPct01(r.worstMemberMaxUtil)}
													</span>
												) : (
													<span className="text-muted-foreground text-xs">
														—
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
								rows={filtered}
								getRowId={(r) => `${r.scopeType}:${r.device}:${r.name}`}
								emptyText="No upgrade candidates for this window (no hot links / no near-term forecasts)."
								maxHeightClassName="max-h-[520px]"
								minWidthClassName="min-w-0"
							/>
						);
					})()
				)}
			</CardContent>
		</Card>
	);
}
