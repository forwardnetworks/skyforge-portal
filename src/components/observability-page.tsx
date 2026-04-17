import {
	type ObservabilitySeriesPoint,
	type ObservabilitySlowRequest,
	type ObservabilitySummaryResponse,
	getObservabilitySlowRequests,
	getUserObservabilitySeries,
	getUserObservabilitySummary,
} from "@/lib/api-client-forward-observability";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
	activeAdvisories,
	advisoryVariant,
	formatPercent,
	formatSecondsAge,
	healthVariant,
	summarizeForwardTargets,
} from "./observability-shared";
import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import { TableWrapper } from "./ui/table-wrapper";

const windowOptions = [
	{ value: "2h", label: "2 hours" },
	{ value: "24h", label: "24 hours" },
	{ value: "7d", label: "7 days" },
	{ value: "30d", label: "30 days" },
];

const seriesCards = [
	{
		metric: "deployments_list_p95_ms",
		label: "Deployments list p95",
		description:
			"User-visible deployment list latency from native request rollups.",
		unit: "ms",
	},
	{
		metric: "dashboard_snapshot_p95_ms",
		label: "Dashboard snapshot p95",
		description: "Dashboard snapshot latency from native request rollups.",
		unit: "ms",
	},
	{
		metric: "node_cpu_p95",
		label: "Node CPU p95",
		description:
			"95th percentile active CPU across cluster nodes from Prometheus.",
		unit: "%",
	},
	{
		metric: "node_mem_p95",
		label: "Node memory p95",
		description: "95th percentile node memory usage from Prometheus.",
		unit: "%",
	},
];

function formatMetricValue(value: number | null | undefined, unit: string) {
	if (value == null || Number.isNaN(value)) {
		return "—";
	}
	if (unit === "%") {
		return `${Math.round(value)}%`;
	}
	if (unit === "ms") {
		return `${Math.round(value)} ms`;
	}
	return `${Math.round(value)}`;
}

function summarizeSeries(points: ObservabilitySeriesPoint[]) {
	if (points.length === 0) {
		return {
			latest: null,
			min: null,
			max: null,
		};
	}
	const values = points.map((point) => point.value);
	return {
		latest: values[values.length - 1] ?? null,
		min: Math.min(...values),
		max: Math.max(...values),
	};
}

function Sparkline(props: { points: ObservabilitySeriesPoint[] }) {
	const { points } = props;
	if (points.length < 2) {
		return (
			<div className="mt-3 rounded-lg border border-dashed border-border/70 px-3 py-4 text-xs text-muted-foreground">
				No trend yet
			</div>
		);
	}
	const values = points.map((point) => point.value);
	const min = Math.min(...values);
	const max = Math.max(...values);
	const width = 320;
	const height = 88;
	const path = points
		.map((point, index) => {
			const x = (index / (points.length - 1)) * width;
			const normalized =
				max === min ? 0.5 : (point.value - min) / Math.max(max - min, 0.0001);
			const y = height - normalized * height;
			return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
		})
		.join(" ");
	return (
		<svg
			aria-hidden="true"
			className="mt-3 h-24 w-full overflow-visible"
			viewBox={`0 0 ${width} ${height}`}
		>
			<path
				d={path}
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
			/>
		</svg>
	);
}

function EndpointLatencyTable(props: {
	endpoints: ObservabilitySummaryResponse["endpoints"];
}) {
	const endpoints = useMemo(
		() =>
			[...(props.endpoints ?? [])].sort((left, right) => {
				if (right.p95Ms !== left.p95Ms) {
					return right.p95Ms - left.p95Ms;
				}
				return right.count - left.count;
			}),
		[props.endpoints],
	);
	if (endpoints.length === 0) {
		return (
			<div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
				No sampled endpoint data has been recorded in the selected retention
				window yet.
			</div>
		);
	}
	return (
		<TableWrapper>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Endpoint</TableHead>
						<TableHead>Count</TableHead>
						<TableHead>Errors</TableHead>
						<TableHead>P50</TableHead>
						<TableHead>P95</TableHead>
						<TableHead>P99</TableHead>
						<TableHead>Top cause</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{endpoints.map((endpoint) => (
						<TableRow key={endpoint.endpointKey}>
							<TableCell className="font-mono text-xs">
								{endpoint.endpointKey}
							</TableCell>
							<TableCell>{endpoint.count.toLocaleString()}</TableCell>
							<TableCell>{endpoint.errorCount.toLocaleString()}</TableCell>
							<TableCell>{endpoint.p50Ms} ms</TableCell>
							<TableCell>{endpoint.p95Ms} ms</TableCell>
							<TableCell>{endpoint.p99Ms} ms</TableCell>
							<TableCell>{endpoint.topCause || "—"}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableWrapper>
	);
}

function SlowRequestsTable(props: { requests: ObservabilitySlowRequest[] }) {
	if (props.requests.length === 0) {
		return (
			<div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
				No sampled slow requests matched the current window.
			</div>
		);
	}
	return (
		<TableWrapper>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Collected</TableHead>
						<TableHead>Endpoint</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Total</TableHead>
						<TableHead>DB</TableHead>
						<TableHead>Enrich</TableHead>
						<TableHead>Queue age</TableHead>
						<TableHead>Cause</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{props.requests.map((request) => (
						<TableRow
							key={`${request.collectedAt}-${request.endpointKey}-${request.totalMs}`}
						>
							<TableCell>
								{new Date(request.collectedAt).toLocaleString()}
							</TableCell>
							<TableCell className="font-mono text-xs">
								{request.endpointKey}
							</TableCell>
							<TableCell>{request.statusCode}</TableCell>
							<TableCell>{request.totalMs} ms</TableCell>
							<TableCell>{request.phaseDbMs} ms</TableCell>
							<TableCell>{request.phaseEnrichMs} ms</TableCell>
							<TableCell>{formatSecondsAge(request.queueOldestSec)}</TableCell>
							<TableCell>{request.causeCode || "—"}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableWrapper>
	);
}

function SeriesSummaryCard(props: {
	label: string;
	description: string;
	unit: string;
	isLoading: boolean;
	error?: Error | null;
	points: ObservabilitySeriesPoint[];
}) {
	if (props.isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">{props.label}</CardTitle>
					<CardDescription>{props.description}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<Skeleton className="h-8 w-28" />
					<Skeleton className="h-24 w-full" />
				</CardContent>
			</Card>
		);
	}
	if (props.error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">{props.label}</CardTitle>
					<CardDescription>{props.description}</CardDescription>
				</CardHeader>
				<CardContent className="text-sm text-destructive">
					Failed to load series: {props.error.message}
				</CardContent>
			</Card>
		);
	}

	const stats = summarizeSeries(props.points);
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{props.label}</CardTitle>
				<CardDescription>{props.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid gap-3 sm:grid-cols-3">
					<div>
						<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
							Latest
						</div>
						<div className="mt-2 text-2xl font-semibold">
							{formatMetricValue(stats.latest, props.unit)}
						</div>
					</div>
					<div>
						<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
							Min
						</div>
						<div className="mt-2 text-lg font-medium">
							{formatMetricValue(stats.min, props.unit)}
						</div>
					</div>
					<div>
						<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
							Max
						</div>
						<div className="mt-2 text-lg font-medium">
							{formatMetricValue(stats.max, props.unit)}
						</div>
					</div>
				</div>
				<Sparkline points={props.points} />
			</CardContent>
		</Card>
	);
}

export function ObservabilityPage() {
	const [window, setWindow] = useState("24h");

	const summary = useQuery({
		queryKey: queryKeys.userObservabilitySummary(),
		queryFn: getUserObservabilitySummary,
		staleTime: 30_000,
		retry: false,
	});

	const deploymentsSeries = useQuery({
		queryKey: queryKeys.userObservabilitySeries(
			"deployments_list_p95_ms",
			window,
		),
		queryFn: () =>
			getUserObservabilitySeries({
				metric: "deployments_list_p95_ms",
				window,
			}),
		staleTime: 30_000,
		retry: false,
	});

	const dashboardSeries = useQuery({
		queryKey: queryKeys.userObservabilitySeries(
			"dashboard_snapshot_p95_ms",
			window,
		),
		queryFn: () =>
			getUserObservabilitySeries({
				metric: "dashboard_snapshot_p95_ms",
				window,
			}),
		staleTime: 30_000,
		retry: false,
	});

	const nodeCpuSeries = useQuery({
		queryKey: queryKeys.userObservabilitySeries("node_cpu_p95", window),
		queryFn: () =>
			getUserObservabilitySeries({
				metric: "node_cpu_p95",
				window,
			}),
		staleTime: 30_000,
		retry: false,
	});

	const nodeMemSeries = useQuery({
		queryKey: queryKeys.userObservabilitySeries("node_mem_p95", window),
		queryFn: () =>
			getUserObservabilitySeries({
				metric: "node_mem_p95",
				window,
			}),
		staleTime: 30_000,
		retry: false,
	});

	const slowRequests = useQuery({
		queryKey: queryKeys.observabilitySlowRequests(window, "", "10"),
		queryFn: () => getObservabilitySlowRequests({ window, limit: 10 }),
		staleTime: 30_000,
		retry: false,
		enabled: summary.data?.scope === "admin",
	});

	const skyforge = summary.data?.skyforge;
	const forward = summary.data?.forward;
	const advisories = activeAdvisories(skyforge?.advisories);
	const forwardTargets = summarizeForwardTargets(forward);
	const targetJobs = useMemo(
		() =>
			[...(forward?.targetJobs ?? [])].sort((left, right) =>
				left.job.localeCompare(right.job),
			),
		[forward?.targetJobs],
	);

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<CardTitle>Observability</CardTitle>
							<CardDescription>
								Skyforge-native operator signals first, with Prometheus and
								Grafana as drill-down tools.
							</CardDescription>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline">{summary.data?.scope ?? "user"}</Badge>
							<Badge variant={healthVariant(forward?.sourceStatus)}>
								Forward {forward?.sourceStatus ?? "unknown"}
							</Badge>
						</div>
					</div>
				</CardHeader>
			</Card>

			<div className="grid gap-4 lg:grid-cols-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Queue backlog</CardTitle>
						<CardDescription>
							Current queued and running task load.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{summary.isLoading ? (
							<Skeleton className="h-8 w-28" />
						) : (
							<>
								<div className="text-3xl font-semibold tracking-tight">
									{skyforge
										? `${skyforge.queueQueued} / ${skyforge.queueRunning}`
										: "—"}
								</div>
								<div className="mt-2 text-sm text-muted-foreground">
									Queued / running, oldest queued age{" "}
									{formatSecondsAge(skyforge?.queueOldestSec)}
								</div>
							</>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Worker freshness</CardTitle>
						<CardDescription>
							Most recent task worker heartbeat age.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{summary.isLoading ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<>
								<div className="text-3xl font-semibold tracking-tight">
									{formatSecondsAge(skyforge?.workerHeartbeatSec)}
								</div>
								<div className="mt-2 text-sm text-muted-foreground">
									Lower is better for immediate queue pickup.
								</div>
							</>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Node pressure</CardTitle>
						<CardDescription>
							Prometheus-derived p95 CPU and memory usage.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{summary.isLoading ? (
							<Skeleton className="h-8 w-28" />
						) : (
							<>
								<div className="text-3xl font-semibold tracking-tight">
									{`${formatPercent(skyforge?.nodeCpuActiveP95)} / ${formatPercent(skyforge?.nodeMemUsedP95)}`}
								</div>
								<div className="mt-2 text-sm text-muted-foreground">
									CPU p95 / memory p95
								</div>
							</>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Forward scrape health</CardTitle>
						<CardDescription>
							Grouped Prometheus target health from the live Forward stack.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{summary.isLoading ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<>
								<div className="text-3xl font-semibold tracking-tight">
									{forwardTargets.totalTargets > 0
										? `${forwardTargets.upTargets}/${forwardTargets.totalTargets}`
										: "—"}
								</div>
								<div className="mt-2 text-sm text-muted-foreground">
									Up / total targets
									{forwardTargets.downTargets > 0
										? `, ${forwardTargets.downTargets} down`
										: ""}
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
				<Card>
					<CardHeader>
						<CardTitle>Active advisories</CardTitle>
						<CardDescription>
							The highest-signal native warnings derived from queue, worker,
							latency, and node pressure data.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{summary.isLoading ? (
							<>
								<Skeleton className="h-16 w-full" />
								<Skeleton className="h-16 w-full" />
							</>
						) : advisories.length === 0 ? (
							<div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
								No active native observability advisories right now.
							</div>
						) : (
							advisories.map((advisory) => (
								<div
									className="rounded-xl border border-border/70 bg-muted/20 p-4"
									key={`${advisory.metric}-${advisory.level}`}
								>
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant={advisoryVariant(advisory.level)}>
											{advisory.level}
										</Badge>
										<span className="font-medium">{advisory.message}</span>
									</div>
									<div className="mt-2 text-sm text-muted-foreground">
										Metric <span className="font-mono">{advisory.metric}</span>{" "}
										is at {advisory.value} with a threshold of{" "}
										{advisory.threshold}.
									</div>
								</div>
							))
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Forward target health</CardTitle>
						<CardDescription>
							Grouped scrape health by Prometheus job. This stays read-only and
							comes directly from Prometheus.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{summary.isLoading ? (
							<>
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</>
						) : targetJobs.length === 0 ? (
							<div className="rounded-lg border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
								No grouped target health is available yet.
								{forward?.error ? ` ${forward.error}` : ""}
							</div>
						) : (
							targetJobs.map((job) => (
								<div
									className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
									key={job.job}
								>
									<div>
										<div className="font-medium">{job.job}</div>
										<div className="text-sm text-muted-foreground">
											{job.upTargets} up / {job.totalTargets} total
										</div>
									</div>
									<Badge
										variant={job.downTargets > 0 ? "destructive" : "secondary"}
									>
										{job.downTargets > 0
											? `${job.downTargets} down`
											: "healthy"}
									</Badge>
								</div>
							))
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Endpoint latency</CardTitle>
					<CardDescription>
						Native sampled endpoint summaries from Postgres rollups. This is the
						operator-facing latency table, not a Prometheus copy.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{summary.isLoading ? (
						<Skeleton className="h-64 w-full" />
					) : summary.error ? (
						<div className="text-sm text-destructive">
							Failed to load observability summary:{" "}
							{(summary.error as Error).message}
						</div>
					) : (
						<EndpointLatencyTable endpoints={skyforge?.endpoints ?? []} />
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<CardTitle>Time series</CardTitle>
							<CardDescription>
								Curated trends for the native metrics already exposed by the
								current series APIs.
							</CardDescription>
						</div>
						<Select value={window} onValueChange={setWindow}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Window" />
							</SelectTrigger>
							<SelectContent>
								{windowOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent className="grid gap-4 xl:grid-cols-2">
					<SeriesSummaryCard
						label={seriesCards[0].label}
						description={seriesCards[0].description}
						unit={seriesCards[0].unit}
						isLoading={deploymentsSeries.isLoading}
						error={deploymentsSeries.error as Error | null}
						points={deploymentsSeries.data?.points ?? []}
					/>
					<SeriesSummaryCard
						label={seriesCards[1].label}
						description={seriesCards[1].description}
						unit={seriesCards[1].unit}
						isLoading={dashboardSeries.isLoading}
						error={dashboardSeries.error as Error | null}
						points={dashboardSeries.data?.points ?? []}
					/>
					<SeriesSummaryCard
						label={seriesCards[2].label}
						description={seriesCards[2].description}
						unit={seriesCards[2].unit}
						isLoading={nodeCpuSeries.isLoading}
						error={nodeCpuSeries.error as Error | null}
						points={nodeCpuSeries.data?.points ?? []}
					/>
					<SeriesSummaryCard
						label={seriesCards[3].label}
						description={seriesCards[3].description}
						unit={seriesCards[3].unit}
						isLoading={nodeMemSeries.isLoading}
						error={nodeMemSeries.error as Error | null}
						points={nodeMemSeries.data?.points ?? []}
					/>
				</CardContent>
			</Card>

			{summary.data?.scope === "admin" ? (
				<Card>
					<CardHeader>
						<CardTitle>Slow requests</CardTitle>
						<CardDescription>
							Admin-only sampled slow requests for quick triage when users
							report sluggish platform behavior.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{slowRequests.isLoading ? (
							<Skeleton className="h-64 w-full" />
						) : slowRequests.error ? (
							<div className="text-sm text-destructive">
								Failed to load slow requests:{" "}
								{(slowRequests.error as Error).message}
							</div>
						) : (
							<SlowRequestsTable requests={slowRequests.data?.requests ?? []} />
						)}
					</CardContent>
				</Card>
			) : null}

			<Card>
				<CardHeader>
					<CardTitle>Deep links</CardTitle>
					<CardDescription>
						Skyforge stays the first-line operator surface. Use these when you
						need raw Prometheus or richer Grafana drill-down.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-2">
					<a
						className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
						href="/grafana/d/skyforge-operations/skyforge-operations"
					>
						<div className="font-medium">Open Grafana operations dashboard</div>
						<div className="mt-1 text-muted-foreground">
							Curated queue, worker, and lifecycle dashboard from the managed
							stack.
						</div>
					</a>
					<a
						className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
						href="/prometheus/graph"
					>
						<div className="font-medium">Open Prometheus graph</div>
						<div className="mt-1 text-muted-foreground">
							Inspect raw metrics and scrape state directly from the source of
							truth.
						</div>
					</a>
				</CardContent>
			</Card>
		</div>
	);
}
