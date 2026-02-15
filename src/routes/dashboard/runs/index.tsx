import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "../../../components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { useDashboardEvents } from "../../../lib/dashboard-events";
import { queryKeys } from "../../../lib/query-keys";
import type { JSONMap } from "../../../lib/skyforge-api";
import {
	type DashboardSnapshot,
	getDashboardSnapshot,
} from "../../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/runs/")({
	component: RunsIndexPage,
});

function RunsIndexPage() {
	useDashboardEvents(true);
	const queryClient = useQueryClient();

	const snap = useQuery<DashboardSnapshot | null>({
		queryKey: queryKeys.dashboardSnapshot(),
		queryFn: getDashboardSnapshot,
		initialData: () =>
			(queryClient.getQueryData(queryKeys.dashboardSnapshot()) as
				| DashboardSnapshot
				| undefined) ?? null,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const runs = (snap.data?.runs ?? []) as JSONMap[];
	const [filter, setFilter] = useState("");
	const filtered = useMemo(() => {
		const needle = filter.trim().toLowerCase();
		if (!needle) return runs;
		return runs.filter((r) => JSON.stringify(r).toLowerCase().includes(needle));
	}, [filter, runs]);

	return (
		<div className="space-y-6 p-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">Runs</h1>
				<p className="text-sm text-muted-foreground">
					Recent task runs across all deployments.
				</p>
			</div>

			<div className="flex items-center gap-3">
				<Input
					placeholder="Filter runs…"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				/>
				<div className="text-sm text-muted-foreground">
					{filtered.length} shown
				</div>
			</div>

			{!snap.data ? (
				<Card className="border-dashed">
					<CardContent className="pt-6 text-sm text-muted-foreground">
						Loading dashboard…
					</CardContent>
				</Card>
			) : filtered.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="pt-6 text-sm text-muted-foreground">
						No runs match your filter.
					</CardContent>
				</Card>
			) : (
				<div className="space-y-3">
					{filtered.map((r) => {
						const id = String(r.id ?? "");
						const status = String(r.status ?? "");
						const type = String(r.tpl_alias ?? r.type ?? "");
						const created = String(r.created ?? "");
						const started = String(r.start ?? "");
						const finished = String(r.end ?? "");

						return (
							<Card key={id} variant="glass">
								<CardHeader>
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
										<div className="min-w-0">
											<CardTitle className="truncate">
												<Link
													className="underline"
													to="/dashboard/runs/$runId"
													params={{ runId: id }}
												>
													Run {id}
												</Link>
											</CardTitle>
											<CardDescription className="truncate">
												{type || "run"}
											</CardDescription>
										</div>
										<Badge variant={badgeVariantForStatus(status)}>
											{status || "unknown"}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
									<div className="truncate">Created: {created || "—"}</div>
									<div className="truncate">Started: {started || "—"}</div>
									<div className="truncate">Finished: {finished || "—"}</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}

function badgeVariantForStatus(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	const s = status.toLowerCase();
	if (s === "success" || s === "succeeded" || s === "complete")
		return "default";
	if (s === "failed" || s === "error") return "destructive";
	if (s === "running") return "default";
	if (s === "queued" || s === "pending") return "secondary";
	return "secondary";
}
