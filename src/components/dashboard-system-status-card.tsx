import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { runManagedIntegrationAction } from "../lib/api-client-managed-integrations";
import { queryKeys } from "../lib/query-keys";
import { formatCount } from "./dashboard-shared";
import {
	activeAdvisories,
	advisoryVariant,
	formatSecondsAge,
	healthVariant,
	summarizeForwardTargets,
} from "./observability-shared";
import { StatusCheckGrid } from "./status-check-grid";
import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function DashboardSystemStatusCard(props: { page: DashboardPageState }) {
	const { page } = props;
	const queryClient = useQueryClient();
	const statusSummary = page.statusSummary;
	const managedIntegrations = page.managedIntegrations?.integrations ?? [];
	const observability = page.observabilitySummary;
	const advisories = activeAdvisories(observability?.skyforge.advisories);
	const forwardTargets = summarizeForwardTargets(observability?.forward);
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
							Backend, queue, worker freshness, and Forward scrape health from
							the live cluster.
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
							Active advisories
						</div>
						<div className="mt-2 text-3xl font-semibold">
							{formatCount(advisories.length)}
						</div>
						<div className="mt-2 text-sm text-muted-foreground">
							Native queue, latency, and node-pressure warnings.
						</div>
					</div>
					<div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
						<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
							Oldest queued age
						</div>
						<div className="mt-2 text-3xl font-semibold">
							{formatSecondsAge(observability?.skyforge.queueOldestSec)}
						</div>
						<div className="mt-2 text-sm text-muted-foreground">
							{formatCount(observability?.skyforge.queueQueued)} queued /{" "}
							{formatCount(observability?.skyforge.queueRunning)} running
						</div>
					</div>
					<div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
						<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
							Worker heartbeat
						</div>
						<div className="mt-2 text-3xl font-semibold">
							{formatSecondsAge(observability?.skyforge.workerHeartbeatSec)}
						</div>
						<div className="mt-2 text-sm text-muted-foreground">
							Lower is better for immediate task pickup.
						</div>
					</div>
					<div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
						<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
							Forward targets
						</div>
						<div className="mt-2 text-3xl font-semibold">
							{forwardTargets.totalTargets > 0
								? `${forwardTargets.upTargets}/${forwardTargets.totalTargets}`
								: "—"}
						</div>
						<div className="mt-2 text-sm text-muted-foreground">
							{forwardTargets.downTargets > 0
								? `${forwardTargets.downTargets} scrape targets down`
								: "Prometheus target health is clean"}
						</div>
					</div>
				</div>

				{advisories.length > 0 ? (
					<div className="space-y-3">
						<div>
							<div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
								Attention now
							</div>
							<div className="text-sm text-muted-foreground">
								The highest-signal native advisories affecting immediate
								operator response.
							</div>
						</div>
						<div className="grid gap-3 lg:grid-cols-2">
							{advisories.slice(0, 4).map((advisory) => (
								<div
									className="rounded-xl border border-border/70 bg-background/60 p-4"
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
										at {advisory.value} with threshold {advisory.threshold}.
									</div>
								</div>
							))}
						</div>
					</div>
				) : null}

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
			</CardContent>
		</Card>
	);
}
