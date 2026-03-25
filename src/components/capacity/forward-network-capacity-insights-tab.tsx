import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityInsightsTab({
	page,
	kind,
}: {
	page: ForwardNetworkCapacityPageState;
	kind: "security" | "cloud";
}) {
	const q = kind === "security" ? page.securityInsights : page.cloudInsights;
	const run = kind === "security" ? page.runSecurityInsights : page.runCloudInsights;
	const title = kind === "security" ? "Security Insights" : "Cloud Insights";
	const summary = q.data?.summary;
	const checks = q.data?.checks ?? [];

	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<CardTitle className="text-base">{title}</CardTitle>
				<Button onClick={() => run.mutate()} disabled={run.isPending}>
					{run.isPending ? "Running..." : `Run ${title}`}
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				{q.isLoading ? (
					<Skeleton className="h-20 w-full" />
				) : q.isError ? (
					<div className="text-destructive text-sm">
						Failed to load {kind} insights: {q.error instanceof Error ? q.error.message : String(q.error)}
					</div>
				) : q.data?.status === "not-run" ? (
					<div className="text-muted-foreground text-sm">
						No {kind} insights run yet for this network.
					</div>
				) : (
					<>
						<div className="flex flex-wrap items-center gap-2 text-xs">
							<Badge variant="outline">Checks: {summary?.checks ?? 0}</Badge>
							<Badge variant="outline">Findings: {summary?.totalFindings ?? 0}</Badge>
							<Badge variant="destructive">High: {summary?.high ?? 0}</Badge>
							<Badge variant="secondary">Medium: {summary?.medium ?? 0}</Badge>
							<Badge variant="outline">Low: {summary?.low ?? 0}</Badge>
							{q.data?.asOf ? (
								<span className="text-muted-foreground ml-auto font-mono">As of {q.data.asOf}</span>
							) : null}
						</div>
						<DataTable
							columns={[
								{
									id: "checkId",
									header: "Check",
									cell: (r) => (
										<div className="text-xs">
											<div className="font-medium">{r.title || r.checkId}</div>
											<div className="text-muted-foreground font-mono">{r.checkId}</div>
										</div>
									),
									width: 420,
								},
								{
									id: "category",
									header: "Category",
									cell: (r) => <span className="text-xs">{r.category || "-"}</span>,
									width: 180,
								},
								{
									id: "severity",
									header: "Severity",
									cell: (r) => <span className="text-xs uppercase">{r.severity || "-"}</span>,
									width: 120,
								},
								{
									id: "findings",
									header: "Findings",
									align: "right",
									cell: (r) => <span className="font-mono text-xs">{r.findings}</span>,
									width: 110,
								},
							]}
							rows={checks as any[]}
							emptyMessage={`No ${kind} findings.`}
						/>
					</>
				)}
			</CardContent>
		</Card>
	);
}
