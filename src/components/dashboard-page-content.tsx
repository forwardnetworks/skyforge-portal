import { Link } from "@tanstack/react-router";
import { ArrowRight, Shield, TimerReset, Zap } from "lucide-react";
import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { DashboardAdminSummaryCard } from "./dashboard-admin-summary-card";
import { DashboardAvailabilityCard } from "./dashboard-availability-card";
import { DashboardGuidanceCard } from "./dashboard-guidance-card";
import { DashboardLaunchpadCard } from "./dashboard-launchpad-card";
import { DashboardNextStepsCard } from "./dashboard-next-steps-card";
import { DashboardPolicySummaryCard } from "./dashboard-policy-summary-card";
import { DashboardReservationsCard } from "./dashboard-reservations-card";
import { DashboardSystemStatusCard } from "./dashboard-system-status-card";
import {
	describeOperatingMode,
	formatCount,
	formatMode,
	MetricCard,
} from "./dashboard-shared";
import { PlatformWarningsCard } from "./platform-warnings-card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

type DashboardPageContentProps = {
	page: DashboardPageState;
};

export function DashboardPageContent({ page }: DashboardPageContentProps) {
	const availability = page.platformAvailability;
	const policy = availability?.policy;
	const usage = availability?.usage;
	const primaryMode = policy?.primaryOperatingMode;
	const availabilityWarnings = availability?.warnings ?? [];
	const overviewWarnings = page.adminOverview?.warnings ?? [];
	const warnings = page.isAdmin
		? [...availabilityWarnings, ...overviewWarnings]
		: availabilityWarnings;
	const status = page.statusSummary?.status ?? "unknown";
	const simpleMode = page.uiExperienceMode === "simple";
	const statusVariant =
		status === "ok"
			? "secondary"
			: status === "degraded"
				? "destructive"
				: "outline";

	if (simpleMode) {
		return (
			<div className="space-y-6 p-6">
				<section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(142deg,rgba(10,14,23,0.98),rgba(17,24,39,0.98)_56%,rgba(13,148,136,0.12))] text-white shadow-[0_28px_90px_rgba(2,6,23,0.35)]">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.12),transparent_28%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,auto,24px_24px,24px_24px] opacity-80" />
					<div className="relative grid gap-6 px-6 py-6 xl:grid-cols-[1.1fr_0.9fr] xl:px-8 xl:py-8">
						<div className="space-y-6">
							<div className="flex flex-wrap items-center gap-2">
								<Badge
									variant="outline"
									className="border-white/15 bg-white/10 text-white"
								>
									Simple mode
								</Badge>
								<Badge variant={statusVariant} className="capitalize">
									{status}
								</Badge>
								{primaryMode ? (
									<Badge
										variant="outline"
										className="border-white/15 bg-white/10 text-white"
									>
										Mode {formatMode(primaryMode)}
									</Badge>
								) : null}
							</div>

							<div className="space-y-3">
								<div className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-300">
									Start here
								</div>
								<h1 className="font-serif text-4xl tracking-tight text-white sm:text-5xl">
									Launch faster
								</h1>
								<p className="max-w-3xl text-base leading-7 text-slate-200">
									Use Quick Deploy for the fastest path, check your current
									deployments, and reserve time when you need a future slot. The
									header switch opens the full operator surface when you need
									it.
								</p>
							</div>

							<div className="flex flex-wrap gap-3">
								<Button
									asChild
									className="bg-white text-slate-950 hover:bg-slate-100"
								>
									<Link to="/dashboard/deployments/quick">
										Launch quick deploy
									</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="border-white/20 bg-white/5 text-white hover:bg-white/10"
								>
									<Link to="/dashboard/deployments">View deployments</Link>
								</Button>
								<Button
									asChild
									variant="ghost"
									className="text-white hover:bg-white/10 hover:text-white"
								>
									<Link to="/dashboard/reservations">Reservations</Link>
								</Button>
								<Button
									asChild
									variant="ghost"
									className="text-white hover:bg-white/10 hover:text-white"
								>
									<a
										href="/api/forward/session"
										target="_blank"
										rel="noreferrer noopener"
									>
										Open Forward
									</a>
								</Button>
							</div>
						</div>

						<div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
							<div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300">
									Active deployments
								</div>
								<div className="mt-2 text-3xl font-semibold text-white">
									{formatCount(usage?.activeDeployments)}
								</div>
								<div className="mt-1 text-sm text-slate-300">
									Running labs in your current quota window
								</div>
							</div>
							<div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300">
									Open reservations
								</div>
								<div className="mt-2 text-3xl font-semibold text-white">
									{formatCount(
										(page.reservationTotals ?? []).reduce(
											(total, entry) => total + entry.count,
											0,
										),
									)}
								</div>
								<div className="mt-1 text-sm text-slate-300">
									Requested and approved reservation activity
								</div>
							</div>
							<div className="rounded-[1.35rem] border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
								<div className="flex items-center gap-2 font-medium text-white">
									<Zap className="h-4 w-4 text-teal-300" />
									Need more tools?
								</div>
								<div className="mt-2 text-sm leading-6 text-slate-300">
									Switch to advanced mode in the header for Designer,
									observability, embedded integrations, and platform operator
									views.
								</div>
							</div>
						</div>
					</div>
				</section>

				<PlatformWarningsCard
					title="Platform conditions"
					description="Only the warnings that affect launch and reservation decisions."
					warnings={warnings}
				/>

				<div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
					<DashboardLaunchpadCard page={page} />
					<DashboardReservationsCard page={page} />
				</div>

				<div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
					<DashboardNextStepsCard />
					<Card>
						<CardHeader>
							<CardTitle>Current posture</CardTitle>
							<CardDescription>
								The smallest useful amount of platform state for new users.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-xl border border-border/70 bg-background/70 p-4">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
									Concurrent headroom
								</div>
								<div className="mt-2 text-2xl font-semibold">
									{formatCount(usage?.remainingConcurrentLabs)}
								</div>
								<div className="mt-1 text-sm text-muted-foreground">
									Available slots before you need to reserve.
								</div>
							</div>
							<div className="rounded-xl border border-border/70 bg-background/70 p-4">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
									Degraded checks
								</div>
								<div className="mt-2 text-2xl font-semibold">
									{formatCount(page.statusSummary?.down)}
								</div>
								<div className="mt-1 text-sm text-muted-foreground">
									Health checks currently reporting degraded state.
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(142deg,rgba(10,14,23,0.98),rgba(17,24,39,0.98)_56%,rgba(13,148,136,0.12))] text-white shadow-[0_28px_90px_rgba(2,6,23,0.35)]">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.12),transparent_28%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,auto,24px_24px,24px_24px] opacity-80" />
				<div className="relative grid gap-6 px-6 py-6 xl:grid-cols-[1.15fr_0.85fr] xl:px-8 xl:py-8">
					<div className="space-y-6">
						<div className="flex flex-wrap items-center gap-2">
							<Badge
								variant="outline"
								className="border-white/15 bg-white/10 text-white"
							>
								Status-first dashboard
							</Badge>
							<Badge variant={statusVariant} className="capitalize">
								{status}
							</Badge>
							{primaryMode ? (
								<Badge
									variant="outline"
									className="border-white/15 bg-white/10 text-white"
								>
									Mode {formatMode(primaryMode)}
								</Badge>
							) : null}
						</div>

						<div className="space-y-3">
							<div className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-300">
								Operational home
							</div>
							<h1 className="font-serif text-4xl tracking-tight text-white sm:text-5xl">
								Control plane
							</h1>
							<p className="max-w-3xl text-base leading-7 text-slate-200">
								Launch labs, inspect readiness, and understand current platform
								limits before you enter a workflow. This page is the default
								home so operators see health, reservations, and headroom first.
							</p>
						</div>

						<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
							<div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300">
									Concurrent headroom
								</div>
								<div className="mt-2 text-3xl font-semibold text-white">
									{usage ? formatCount(usage.remainingConcurrentLabs) : "—"}
								</div>
								<div className="mt-1 text-sm text-slate-300">
									{policy
										? `${formatCount(usage?.activeDeployments)} active of ${formatCount(policy.quota.maxConcurrentLabs)}`
										: "Quota data loading"}
								</div>
							</div>
							<div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300">
									Persistent headroom
								</div>
								<div className="mt-2 text-3xl font-semibold text-white">
									{usage ? formatCount(usage.remainingPersistentLabs) : "—"}
								</div>
								<div className="mt-1 text-sm text-slate-300">
									{policy
										? `${formatCount(usage?.persistentLabs)} active of ${formatCount(policy.quota.maxPersistentLabs)}`
										: "Persistence policy loading"}
								</div>
							</div>
							<div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300">
									Requested reservations
								</div>
								<div className="mt-2 text-3xl font-semibold text-white">
									{usage ? formatCount(usage.requestedReservations) : "—"}
								</div>
								<div className="mt-1 text-sm text-slate-300">
									Awaiting approval or scheduling
								</div>
							</div>
							<div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300">
									Approved reservations
								</div>
								<div className="mt-2 text-3xl font-semibold text-white">
									{usage ? formatCount(usage.approvedReservations) : "—"}
								</div>
								<div className="mt-1 text-sm text-slate-300">
									Reserved platform time
								</div>
							</div>
						</div>
					</div>

					<div className="grid gap-4">
						<Card className="border-white/10 bg-black/25 text-white shadow-none backdrop-blur-sm">
							<CardHeader className="pb-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<CardTitle className="text-xl text-white">
											Current operating posture
										</CardTitle>
										<CardDescription className="text-slate-300">
											Resolved account mode and immediate operator guidance.
										</CardDescription>
									</div>
									<Shield className="h-5 w-5 text-slate-300" />
								</div>
							</CardHeader>
							<CardContent className="space-y-4 text-sm text-slate-200">
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300">
										Primary mode
									</div>
									<div className="mt-2 text-lg font-semibold text-white">
										{primaryMode ? formatMode(primaryMode) : "Unreported"}
									</div>
									<div className="mt-1 leading-6 text-slate-300">
										{describeOperatingMode(primaryMode)}
									</div>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
										<div className="flex items-center gap-2 font-medium text-white">
											<Zap className="h-4 w-4 text-teal-300" />
											Status signal
										</div>
										<div className="mt-2 text-slate-300">
											{status === "ok"
												? "Core services are reporting healthy state."
												: "One or more platform checks are degraded. Review warnings before launching."}
										</div>
									</div>
									<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
										<div className="flex items-center gap-2 font-medium text-white">
											<TimerReset className="h-4 w-4 text-amber-300" />
											Reset + reservation
										</div>
										<div className="mt-2 text-slate-300">
											Forward org reset, reservation, and capacity controls are
											available from the platform and Forward workflows.
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<div className="grid gap-3 sm:grid-cols-2">
							<MetricCard
								title="Degraded checks"
								value={formatCount(page.statusSummary?.down)}
								description="Public-safe service checks reporting degraded state"
							/>
							<MetricCard
								title="Tracked reservations"
								value={formatCount(page.reservations.length)}
								description="Most recent reservation records visible to this account"
							/>
						</div>
					</div>
				</div>
			</section>

			<PlatformWarningsCard
				title="Platform conditions"
				description="Live hybrid-placement, capacity, and degraded-mode warnings affecting launch decisions."
				warnings={warnings}
			/>

			<div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
				<DashboardLaunchpadCard page={page} />
				<DashboardSystemStatusCard page={page} />
			</div>

			<div className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
				<DashboardAvailabilityCard page={page} />
				<DashboardPolicySummaryCard page={page} />
			</div>

			<div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
				<DashboardReservationsCard page={page} />
				<div className="grid gap-6">
					<DashboardGuidanceCard page={page} />
					{page.isAdmin ? (
						<DashboardAdminSummaryCard page={page} />
					) : (
						<DashboardNextStepsCard />
					)}
				</div>
			</div>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<div className="rounded-[1.35rem] border border-border/70 bg-background p-5">
					<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
						Launch rule
					</div>
					<div className="mt-2 text-base font-semibold">
						Dashboard before workflow
					</div>
					<div className="mt-1 text-sm leading-6 text-muted-foreground">
						Operators land here first so status, reservations, and capacity are
						visible before Quick Deploy or Designer.
					</div>
				</div>
				<div className="rounded-[1.35rem] border border-border/70 bg-background p-5">
					<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
						Forward contract
					</div>
					<div className="mt-2 text-base font-semibold">
						Tenant-aware by default
					</div>
					<div className="mt-1 text-sm leading-6 text-muted-foreground">
						Forward credentials, collectors, resets, and analytics remain in the
						Forward workflow, not hidden behind generic settings.
					</div>
				</div>
				<div className="rounded-[1.35rem] border border-border/70 bg-background p-5">
					<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
						Status discipline
					</div>
					<div className="mt-2 text-base font-semibold">
						Live contracts only
					</div>
					<div className="mt-1 text-sm leading-6 text-muted-foreground">
						This page is assembled from existing platform, observability, and
						public-status APIs. No dashboard mega-endpoint was added.
					</div>
				</div>
				<div className="rounded-[1.35rem] border border-border/70 bg-background p-5">
					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
								Primary launch
							</div>
							<div className="mt-2 text-base font-semibold">Quick Deploy</div>
						</div>
						<ArrowRight className="h-4 w-4 text-muted-foreground" />
					</div>
					<div className="mt-1 text-sm leading-6 text-muted-foreground">
						Curated demos remain the fastest path, but the dashboard now gives
						the operator enough state to decide whether to launch.
					</div>
				</div>
			</section>
		</div>
	);
}
