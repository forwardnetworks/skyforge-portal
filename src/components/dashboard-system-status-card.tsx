import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { runManagedIntegrationAction } from "../lib/api-client-managed-integrations";
import { queryKeys } from "../lib/query-keys";
import { formatCount } from "./dashboard-shared";
import { StatusCheckGrid } from "./status-check-grid";
import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

function healthVariant(
	status?: string,
): "secondary" | "destructive" | "outline" {
	switch (
		String(status ?? "")
			.trim()
			.toLowerCase()
	) {
		case "ok":
		case "up":
		case "healthy":
			return "secondary";
		case "degraded":
		case "down":
			return "destructive";
		default:
			return "outline";
	}
}

export function DashboardSystemStatusCard(props: { page: DashboardPageState }) {
	const { page } = props;
	const queryClient = useQueryClient();
	const statusSummary = page.statusSummary;
	const managedIntegrations = page.managedIntegrations?.integrations ?? [];
	const observability = page.observabilitySummary;
	const wakeMutation = useMutation({
		mutationFn: runManagedIntegrationAction,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: queryKeys.managedIntegrationsStatus(),
				}),
				queryClient.invalidateQueries({
					queryKey: queryKeys.statusSummary(),
				}),
			]);
		},
		onError: (error) => {
			toast.error("Failed to wake integration", {
				description: (error as Error).message,
			});
		},
	});

	return (
		<Card className="border-border/70">
			<CardHeader>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<CardTitle>System status</CardTitle>
						<CardDescription>
							Backend, worker, queue, and Forward observability signals from the
							live cluster.
						</CardDescription>
					</div>
					<Badge variant={healthVariant(statusSummary?.status)}>
						{statusSummary?.status ?? "unknown"}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="grid gap-3 sm:grid-cols-4">
					<div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
						<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
							Healthy checks
						</div>
						<div className="mt-2 text-3xl font-semibold">
							{formatCount(statusSummary?.up)}
						</div>
					</div>
					<div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
						<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
							Degraded checks
						</div>
						<div className="mt-2 text-3xl font-semibold">
							{formatCount(statusSummary?.down)}
						</div>
					</div>
					<div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
						<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
							Queue queued
						</div>
						<div className="mt-2 text-3xl font-semibold">
							{formatCount(observability?.skyforge.queueQueued)}
						</div>
					</div>
					<div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
						<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
							Worker heartbeat
						</div>
						<div className="mt-2 text-3xl font-semibold">
							{observability?.skyforge.workerHeartbeatSec != null
								? `${Math.round(observability.skyforge.workerHeartbeatSec)}s`
								: "—"}
						</div>
					</div>
				</div>

				<StatusCheckGrid checks={statusSummary?.checks ?? []} compact />

				{managedIntegrations.length > 0 ? (
					<div className="space-y-3">
						<div className="flex items-center justify-between gap-3">
							<div>
								<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
									Managed integrations
								</div>
								<div className="text-sm text-muted-foreground">
									Subordinate tools that can scale to zero or remain stopped
									until requested.
								</div>
							</div>
						</div>
						<StatusCheckGrid
							checks={managedIntegrations.map((integration) => {
								const wakeAction =
									integration.status === "standby"
										? (integration.wakeAction ?? null)
										: null;
								return {
									id: integration.id,
									name: integration.label || integration.id,
									status: integration.status,
									actionLabel: wakeAction?.label ?? undefined,
									onAction: wakeAction
										? () => wakeMutation.mutate(wakeAction)
										: undefined,
									actionDisabled:
										wakeMutation.isPending || wakeAction?.allowed === false,
									detail:
										wakeAction?.allowed === false && wakeAction.disabledReason
											? `${integration.detail ?? ""} ${wakeAction.disabledReason}`.trim()
											: integration.detail,
								};
							})}
							compact
							categoryLabel="Managed integration"
						/>
					</div>
				) : null}

				{observability ? (
					<div className="grid gap-3 lg:grid-cols-2">
						<div className="rounded-2xl border border-border/60 bg-background/60 p-4">
							<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
								Skyforge observability
							</div>
							<div className="mt-3 grid gap-2 text-sm">
								<div className="flex items-center justify-between gap-3">
									<span>Queue running</span>
									<span className="font-medium">
										{formatCount(observability.skyforge.queueRunning)}
									</span>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span>Oldest queued age</span>
									<span className="font-medium">
										{Math.round(observability.skyforge.queueOldestSec ?? 0)}s
									</span>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span>CPU p95</span>
									<span className="font-medium">
										{Math.round(observability.skyforge.nodeCpuActiveP95 ?? 0)}%
									</span>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span>Memory p95</span>
									<span className="font-medium">
										{Math.round(observability.skyforge.nodeMemUsedP95 ?? 0)}%
									</span>
								</div>
							</div>
						</div>

						<div className="rounded-2xl border border-border/60 bg-background/60 p-4">
							<div className="flex items-center justify-between gap-3">
								<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
									Forward observability
								</div>
								<Badge
									variant={healthVariant(observability.forward.sourceStatus)}
								>
									{observability.forward.sourceStatus}
								</Badge>
							</div>
							<div className="mt-3 grid gap-2 text-sm">
								<div className="flex items-center justify-between gap-3">
									<span>Prometheus service</span>
									<span className="font-medium">
										{observability.forward.prometheusService
											? "present"
											: "missing"}
									</span>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span>Grafana service</span>
									<span className="font-medium">
										{observability.forward.grafanaService
											? "present"
											: "missing"}
									</span>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span>Prometheus reachable</span>
									<span className="font-medium">
										{observability.forward.prometheusReachable ? "yes" : "no"}
									</span>
								</div>
								<div className="flex items-center justify-between gap-3">
									<span>Targets</span>
									<span className="font-medium">
										{formatCount(observability.forward.prometheusTargetCount)}
									</span>
								</div>
							</div>
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
