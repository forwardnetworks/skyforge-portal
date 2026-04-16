import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	getUserObservabilitySeries,
	getUserObservabilitySummary,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createLazyFileRoute("/dashboard/observability")({
	component: ObservabilityPage,
});

const metricOptions = [
	{ value: "deployments_list_p95_ms", label: "Deployments p95 (ms)" },
	{ value: "dashboard_snapshot_p95_ms", label: "Dashboard p95 (ms)" },
	{ value: "node_cpu_p95", label: "Node CPU p95 (%)" },
	{ value: "node_mem_p95", label: "Node Memory p95 (%)" },
];

const windowOptions = [
	{ value: "2h", label: "2 hours" },
	{ value: "24h", label: "24 hours" },
	{ value: "7d", label: "7 days" },
	{ value: "30d", label: "30 days" },
];

function ObservabilityPage() {
	const [metric, setMetric] = useState("deployments_list_p95_ms");
	const [window, setWindow] = useState("24h");

	const summary = useQuery({
		queryKey: queryKeys.userObservabilitySummary(),
		queryFn: getUserObservabilitySummary,
		staleTime: 30_000,
		retry: false,
	});

	const series = useQuery({
		queryKey: queryKeys.userObservabilitySeries(metric, window),
		queryFn: () => getUserObservabilitySeries({ metric, window }),
		staleTime: 30_000,
		retry: false,
	});

	const latestValue = useMemo(() => {
		const points = series.data?.points ?? [];
		if (points.length === 0) return null;
		return points[points.length - 1]?.value ?? null;
	}, [series.data?.points]);

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle>Observability</CardTitle>
					<CardDescription>
						Role-scoped operational signals from Skyforge and Forward.
					</CardDescription>
				</CardHeader>
			</Card>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Scope</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						{summary.isLoading ? (
							<Skeleton className="h-5 w-20" />
						) : (
							<span className="font-medium">
								{summary.data?.scope ?? "user"}
							</span>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Forward Source</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground space-y-1">
						{summary.isLoading ? (
							<Skeleton className="h-5 w-28" />
						) : (
							<>
								<div className="font-medium">
									{summary.data?.forward.sourceStatus ?? "missing"}
								</div>
								<div>
									Namespace: {summary.data?.forward.namespace ?? "forward"}
								</div>
								{summary.data?.forward.error ? (
									<div className="text-xs text-amber-600">
										{summary.data.forward.error}
									</div>
								) : null}
							</>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Series Latest</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						{series.isLoading ? (
							<Skeleton className="h-5 w-20" />
						) : latestValue === null ? (
							"—"
						) : (
							<span className="font-medium">{latestValue.toFixed(2)}</span>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Series Explorer</CardTitle>
					<CardDescription>
						Pick a metric and window to inspect historical rollups.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 md:grid-cols-2">
						<Select value={metric} onValueChange={setMetric}>
							<SelectTrigger>
								<SelectValue placeholder="Metric" />
							</SelectTrigger>
							<SelectContent>
								{metricOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select value={window} onValueChange={setWindow}>
							<SelectTrigger>
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

					{series.isLoading ? (
						<Skeleton className="h-24 w-full" />
					) : series.error ? (
						<div className="text-sm text-destructive">
							Failed to load series: {(series.error as Error).message}
						</div>
					) : (
						<div className="rounded border bg-muted/20 p-3">
							<pre className="max-h-72 overflow-auto text-xs">
								{JSON.stringify(series.data?.points ?? [], null, 2)}
							</pre>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
