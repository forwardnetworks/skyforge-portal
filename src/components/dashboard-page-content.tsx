import { Link } from "@tanstack/react-router";
import { ArrowRight, Shield, TimerReset, Zap } from "lucide-react";
import type { DashboardPageState } from "../hooks/use-dashboard-page";
import type { ToolCatalogContentEntry } from "../lib/tool-launches";
import { DashboardAdminSummaryCard } from "./dashboard-admin-summary-card";
import { DashboardAvailabilityCard } from "./dashboard-availability-card";
import { DashboardGuidanceCard } from "./dashboard-guidance-card";
import { DashboardLaunchpadCard } from "./dashboard-launchpad-card";
import { DashboardNextStepsCard } from "./dashboard-next-steps-card";
import { DashboardPolicySummaryCard } from "./dashboard-policy-summary-card";
import { DashboardReservationsCard } from "./dashboard-reservations-card";
import {
	MetricCard,
	describeOperatingMode,
	formatCount,
	formatMode,
} from "./dashboard-shared";
import { DashboardSystemStatusCard } from "./dashboard-system-status-card";
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

function heroButtonClass(variant: string | undefined): string {
	switch (
		String(variant ?? "")
			.trim()
			.toLowerCase()
	) {
		case "outline":
			return "border-white/20 bg-white/5 text-white hover:bg-white/10";
		case "ghost":
			return "text-white hover:bg-white/10 hover:text-white";
		default:
			return "bg-white text-slate-950 hover:bg-slate-100";
	}
}

function dashboardContentEntries(
	entries: ToolCatalogContentEntry[],
	surface: string,
	mode: string,
): ToolCatalogContentEntry[] {
	return entries.filter(
		(entry) => entry.surface === surface && entry.mode === mode,
	);
}

function firstDashboardContentEntry(
	entries: ToolCatalogContentEntry[],
	surface: string,
	mode: string,
): ToolCatalogContentEntry | null {
	return dashboardContentEntries(entries, surface, mode)[0] ?? null;
}

function dashboardContentIcon(icon: string | undefined, muted = false) {
	switch (String(icon ?? "").trim()) {
		case "arrow-right":
			return (
				<ArrowRight
					className={`h-4 w-4 ${muted ? "text-muted-foreground" : "text-slate-300"}`}
				/>
			);
		case "shield":
			return (
				<Shield
					className={`h-5 w-5 ${muted ? "text-muted-foreground" : "text-slate-300"}`}
				/>
			);
		case "timer-reset":
			return <TimerReset className="h-4 w-4 text-amber-300" />;
		case "zap":
			return <Zap className="h-4 w-4 text-teal-300" />;
		default:
			return null;
	}
}

export function DashboardPageContent({ page }: DashboardPageContentProps) {
	const availability = page.platformAvailability;
	const policy = availability?.policy;
	const usage = availability?.usage;
	const primaryMode = policy?.primaryOperatingMode;
	const availabilityWarnings = availability?.warnings ?? [];
	const overviewWarnings = page.adminOverview?.warnings ?? [];
	const warnings = page.canAccessPlatformView
		? [...availabilityWarnings, ...overviewWarnings]
		: availabilityWarnings;
	const status = page.statusSummary?.status ?? "unknown";
	const simpleMode = page.uiExperienceMode === "simple";
	const dashboardHeroActions = page.dashboardHeroActions;
	const dashboardContent = page.dashboardContent;
	const forwardClusterLaunchHref = page.forwardClusterLaunchHref;
	const statusVariant =
		status === "ok"
			? "secondary"
			: status === "degraded"
				? "destructive"
				: "outline";
	const simpleHero = firstDashboardContentEntry(
		dashboardContent,
		"hero",
		"simple",
	);
	const simpleCallout = firstDashboardContentEntry(
		dashboardContent,
		"callout",
		"simple",
	);
	const advancedHero = firstDashboardContentEntry(
		dashboardContent,
		"hero",
		"advanced",
	);
	const advancedPostureHeader = firstDashboardContentEntry(
		dashboardContent,
		"posture-header",
		"advanced",
	);
	const advancedPostureEntries = dashboardContentEntries(
		dashboardContent,
		"posture",
		"advanced",
	);
	const advancedPrinciples = dashboardContentEntries(
		dashboardContent,
		"principle",
		"advanced",
	);

	if (simpleMode) {
		return (
			<div className="space-y-6 p-6">
				<section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(142deg,rgba(10,14,23,0.98),rgba(17,24,39,0.98)_56%,rgba(13,148,136,0.12))] text-white shadow-[0_28px_90px_rgba(2,6,23,0.35)]">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(45,212,191,0.12),transparent_28%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,auto,24px_24px,24px_24px] opacity-80" />
					<div className="relative grid gap-6 px-6 py-6 xl:grid-cols-[1.1fr_0.9fr] xl:px-8 xl:py-8">
						<div className="space-y-6">
							<div className="flex flex-wrap items-center gap-2">
								{simpleHero?.badge ? (
									<Badge
										variant="outline"
										className="border-white/15 bg-white/10 text-white"
									>
										{simpleHero.badge}
									</Badge>
								) : null}
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
								{simpleHero?.eyebrow ? (
									<div className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-300">
										{simpleHero.eyebrow}
									</div>
								) : null}
								<h1 className="font-serif text-4xl tracking-tight text-white sm:text-5xl">
									{simpleHero?.title ?? "Dashboard"}
								</h1>
								{simpleHero?.description ? (
									<p className="max-w-3xl text-base leading-7 text-slate-200">
										{simpleHero.description}
									</p>
								) : null}
							</div>

							<div className="flex flex-wrap gap-3">
								{dashboardHeroActions.map((action) => {
									const className = heroButtonClass(action.variant);
									const isForwardAction =
										action.id === "dashboard-hero-forward";
									if (isForwardAction && !forwardClusterLaunchHref) {
										return (
											<Button
												key={action.id}
												variant="ghost"
												className="text-white hover:bg-white/10 hover:text-white"
												disabled
											>
												{action.label}
											</Button>
										);
									}
									if (isForwardAction) {
										return (
											<Button key={action.id} asChild className={className}>
												<a
													href={forwardClusterLaunchHref}
													target="_blank"
													rel="noreferrer noopener"
												>
													{action.label}
												</a>
											</Button>
										);
									}
									return (
										<Button key={action.id} asChild className={className}>
											<Link to={action.href}>{action.label}</Link>
										</Button>
									);
								})}
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
								{simpleCallout ? (
									<>
										<div className="flex items-center gap-2 font-medium text-white">
											{dashboardContentIcon(simpleCallout.icon)}
											{simpleCallout.title}
										</div>
										<div className="mt-2 text-sm leading-6 text-slate-300">
											{simpleCallout.description}
										</div>
									</>
								) : null}
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
					<DashboardNextStepsCard page={page} />
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
							{advancedHero?.badge ? (
								<Badge
									variant="outline"
									className="border-white/15 bg-white/10 text-white"
								>
									{advancedHero.badge}
								</Badge>
							) : null}
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
							{advancedHero?.eyebrow ? (
								<div className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-300">
									{advancedHero.eyebrow}
								</div>
							) : null}
							<h1 className="font-serif text-4xl tracking-tight text-white sm:text-5xl">
								{advancedHero?.title ?? "Dashboard"}
							</h1>
							{advancedHero?.description ? (
								<p className="max-w-3xl text-base leading-7 text-slate-200">
									{advancedHero.description}
								</p>
							) : null}
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
											{advancedPostureHeader?.title ?? "Current posture"}
										</CardTitle>
										<CardDescription className="text-slate-300">
											{advancedPostureHeader?.description ?? ""}
										</CardDescription>
									</div>
									{dashboardContentIcon(advancedPostureHeader?.icon)}
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
									{advancedPostureEntries.map((entry) => (
										<div
											key={entry.id}
											className="rounded-2xl border border-white/10 bg-white/5 p-4"
										>
											<div className="flex items-center gap-2 font-medium text-white">
												{dashboardContentIcon(entry.icon)}
												{entry.title}
											</div>
											<div className="mt-2 text-slate-300">
												{entry.description}
											</div>
										</div>
									))}
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
					{page.canAccessPlatformView ? (
						<DashboardAdminSummaryCard page={page} />
					) : (
						<DashboardNextStepsCard page={page} />
					)}
				</div>
			</div>

			<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{advancedPrinciples.map((entry) => (
					<div
						key={entry.id}
						className="rounded-[1.35rem] border border-border/70 bg-background p-5"
					>
						<div className="flex items-center justify-between gap-3">
							<div>
								{entry.eyebrow ? (
									<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
										{entry.eyebrow}
									</div>
								) : null}
								<div className="mt-2 text-base font-semibold">
									{entry.title}
								</div>
							</div>
							{dashboardContentIcon(entry.icon, true)}
						</div>
						<div className="mt-1 text-sm leading-6 text-muted-foreground">
							{entry.description}
						</div>
					</div>
				))}
			</section>
		</div>
	);
}
