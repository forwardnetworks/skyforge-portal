import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "../../../components/ui/badge";
import { Button, buttonVariants } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { queryKeys } from "../../../lib/query-keys";
import {
	type ForwardAssuranceSummaryResponse,
	getForwardNetworkAssuranceSummary,
	listForwardNetworkAssuranceHistory,
	refreshForwardNetworkAssurance,
} from "../../../lib/skyforge-api";

const searchSchema = z.object({
	workspace: z.string().optional().catch(""),
});

export const Route = createFileRoute(
	"/dashboard/forward-networks/$networkRef/assurance",
)({
	validateSearch: (search) => searchSchema.parse(search),
	component: ForwardNetworkAssurancePage,
});

function fmtRFC3339(s: string | undefined): string {
	const v = String(s ?? "").trim();
	if (!v) return "—";
	const t = Date.parse(v);
	if (!Number.isFinite(t)) return v;
	return new Date(t).toISOString();
}

function fmtAgeSeconds(ageSeconds: number | undefined): string {
	const s = Number(ageSeconds ?? Number.NaN);
	if (!Number.isFinite(s) || s < 0) return "—";
	const mins = Math.floor(s / 60);
	const hrs = Math.floor(mins / 60);
	if (hrs > 0) return `${hrs}h ${mins % 60}m`;
	if (mins > 0) return `${mins}m`;
	return `${Math.floor(s)}s`;
}

function toPct01(v: number | undefined): string {
	const n = Number(v ?? Number.NaN);
	if (!Number.isFinite(n)) return "—";
	return `${(n * 100).toFixed(1)}%`;
}

function ForwardNetworkAssurancePage() {
	const qc = useQueryClient();
	const { networkRef } = Route.useParams();
	const { workspace } = Route.useSearch();
	const workspaceId = String(workspace ?? "").trim();

	const summaryQ = useQuery({
		queryKey: queryKeys.forwardNetworkAssuranceSummary(workspaceId, networkRef),
		queryFn: () => getForwardNetworkAssuranceSummary(workspaceId, networkRef),
		enabled: Boolean(workspaceId && networkRef),
		staleTime: 5_000,
		retry: false,
	});

	const summary = summaryQ.data as ForwardAssuranceSummaryResponse | undefined;
	const missing = useMemo(() => summary?.missing ?? [], [summary?.missing]);
	const warnings = useMemo(() => summary?.warnings ?? [], [summary?.warnings]);

	const refreshM = useMutation({
		mutationFn: async () =>
			refreshForwardNetworkAssurance(workspaceId, networkRef),
		onSuccess: async (res) => {
			toast.success("Assurance refreshed");
			qc.setQueryData(
				queryKeys.forwardNetworkAssuranceSummary(workspaceId, networkRef),
				res,
			);
			await qc.invalidateQueries({
				queryKey: queryKeys.forwardNetworkAssuranceHistory(
					workspaceId,
					networkRef,
				),
			});
		},
		onError: (e) =>
			toast.error("Refresh failed", { description: (e as Error).message }),
	});

	const historyQ = useQuery({
		queryKey: queryKeys.forwardNetworkAssuranceHistory(workspaceId, networkRef),
		queryFn: () =>
			listForwardNetworkAssuranceHistory(workspaceId, networkRef, "20"),
		enabled: Boolean(workspaceId && networkRef),
		staleTime: 10_000,
		retry: false,
	});
	const historyItems = useMemo(
		() => (historyQ.data?.items ?? []) as any[],
		[historyQ.data?.items],
	);

	return (
		<div className="space-y-6 p-6 pb-20">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3 min-w-0">
					<Link
						to="/dashboard/forward-networks"
						search={{ workspace: workspaceId } as any}
						className={buttonVariants({
							variant: "outline",
							size: "icon",
							className: "h-9 w-9",
						})}
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<div className="min-w-0">
						<h1 className="text-2xl font-bold tracking-tight">Assurance</h1>
						<p className="text-sm text-muted-foreground truncate">
							Network ref: <span className="font-mono">{networkRef}</span>
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						onClick={() => refreshM.mutate()}
						disabled={!workspaceId || refreshM.isPending}
					>
						<RefreshCw className="h-4 w-4 mr-2" />
						{refreshM.isPending ? "Refreshing…" : "Refresh from Forward"}
					</Button>
					<Button asChild variant="outline">
						<Link
							to="/dashboard/forward-networks/$networkRef/assurance-studio"
							params={{ networkRef }}
							search={{ workspace: workspaceId } as any}
						>
							Assurance Studio
						</Link>
					</Button>
					<Button asChild variant="outline">
						<Link
							to="/dashboard/forward-networks/$networkRef/capacity"
							params={{ networkRef }}
							search={{ workspace: workspaceId } as any}
						>
							Capacity
						</Link>
					</Button>
				</div>
			</div>

			{!workspaceId ? (
				<Card>
					<CardContent className="pt-6 text-sm text-muted-foreground">
						Select a workspace first (open this page from the Forward Networks
						list).
					</CardContent>
				</Card>
			) : summaryQ.isLoading ? (
				<Card>
					<CardContent className="pt-6 text-sm text-muted-foreground">
						Loading…
					</CardContent>
				</Card>
			) : summaryQ.isError ? (
				<Card>
					<CardContent className="pt-6 text-sm text-destructive">
						Failed to load assurance summary.
					</CardContent>
				</Card>
			) : null}

			{missing.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>Missing Evidence</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<div className="text-muted-foreground">
							Some Forward evidence has not been collected yet.
						</div>
						<div className="flex flex-wrap gap-2">
							{missing.map((m) => (
								<Badge key={m} variant="secondary">
									{m}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			) : null}

			{warnings.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>Warnings</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1 text-sm">
						{warnings.map((w) => (
							<div key={w} className="text-muted-foreground">
								{w}
							</div>
						))}
					</CardContent>
				</Card>
			) : null}

			{summary ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle>Snapshot Freshness</CardTitle>
						</CardHeader>
						<CardContent className="space-y-1 text-sm">
							<div>
								Snapshot:{" "}
								<span className="font-mono">
									{summary.snapshot.snapshotId || "—"}
								</span>
							</div>
							<div>
								Processed:{" "}
								<span className="font-mono">
									{fmtRFC3339(summary.snapshot.processedAt)}
								</span>
							</div>
							<div>
								Age:{" "}
								<span className="font-mono">
									{fmtAgeSeconds(summary.snapshot.ageSeconds)}
								</span>
							</div>
							<div>
								State:{" "}
								<span className="font-mono">
									{summary.snapshot.state || "—"}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Indexing Health</CardTitle>
						</CardHeader>
						<CardContent className="space-y-1 text-sm">
							<div>
								Overall:{" "}
								<Badge
									variant={
										summary.indexingHealth.overall === "ok"
											? "default"
											: summary.indexingHealth.overall === "warn"
												? "secondary"
												: "outline"
									}
								>
									{summary.indexingHealth.overall}
								</Badge>
							</div>
							<div className="text-xs text-muted-foreground pt-1">
								pathSearch=
								{summary.indexingHealth.pathSearchIndexingStatus || "—"}
							</div>
							<div className="text-xs text-muted-foreground">
								search={summary.indexingHealth.searchIndexingStatus || "—"} l2=
								{summary.indexingHealth.l2IndexingStatus || "—"}
							</div>
							<div className="text-xs text-muted-foreground">
								host={summary.indexingHealth.hostComputationStatus || "—"}{" "}
								ipLoc=
								{summary.indexingHealth.ipLocationIndexingStatus || "—"}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Vulnerabilities</CardTitle>
						</CardHeader>
						<CardContent className="space-y-1 text-sm">
							<div>
								Total:{" "}
								<span className="font-mono">
									{summary.vulnerabilities.total ?? "—"}
								</span>{" "}
								{summary.vulnerabilities.partial ? (
									<Badge variant="secondary" className="ml-2">
										partial
									</Badge>
								) : null}
							</div>
							<div className="text-xs text-muted-foreground">
								Known exploit:{" "}
								<span className="font-mono">
									{summary.vulnerabilities.knownExploitCount ?? "—"}
								</span>
							</div>
							<div className="text-xs text-muted-foreground">
								Index created:{" "}
								<span className="font-mono">
									{fmtRFC3339(summary.vulnerabilities.indexCreatedAt)}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Capacity Cache</CardTitle>
						</CardHeader>
						<CardContent className="space-y-1 text-sm">
							<div>
								As of:{" "}
								<span className="font-mono">
									{fmtRFC3339(summary.capacity.asOf)}
								</span>
							</div>
							<div>
								Hot ifaces ({">="}85% max):{" "}
								<span className="font-mono">
									{summary.capacity.hotInterfaces}
								</span>
							</div>
							<div>
								Max util max:{" "}
								<span className="font-mono">
									{toPct01(summary.capacity.maxUtilMax)}
								</span>
							</div>
							<div>
								Stale:{" "}
								<Badge
									variant={summary.capacity.stale ? "secondary" : "default"}
								>
									{summary.capacity.stale ? "yes" : "no"}
								</Badge>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>
								Live Signals (Last {summary.liveSignals.windowMinutes}m)
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-1 text-sm">
							<div>
								Syslog:{" "}
								<span className="font-mono">
									{summary.liveSignals.syslog.total} (crit{" "}
									{summary.liveSignals.syslog.critical})
								</span>
							</div>
							<div>
								SNMP traps:{" "}
								<span className="font-mono">
									{summary.liveSignals.snmpTraps.total}
								</span>
							</div>
							<div>
								Webhooks:{" "}
								<span className="font-mono">
									{summary.liveSignals.webhooks.total}
								</span>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>History</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							{historyQ.isLoading ? (
								<div className="text-muted-foreground">Loading…</div>
							) : historyQ.isError ? (
								<div className="text-muted-foreground">
									No history (migration not applied yet).
								</div>
							) : historyItems.length === 0 ? (
								<div className="text-muted-foreground">
									No stored summaries yet. Click Refresh.
								</div>
							) : (
								<div className="space-y-1">
									{historyItems.slice(0, 8).map((it: any) => (
										<div
											key={String(it.id)}
											className="flex items-center justify-between gap-3"
										>
											<span className="font-mono text-xs">
												{fmtRFC3339(String(it.generatedAt ?? ""))}
											</span>
											<span className="font-mono text-xs text-muted-foreground">
												{String(it.snapshotId ?? "").trim() || "—"}
											</span>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			) : null}
		</div>
	);
}
