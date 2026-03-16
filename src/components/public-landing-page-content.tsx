import { Link } from "@tanstack/react-router";
import {
	Activity,
	ArrowRight,
	BookOpen,
	Boxes,
	KeyRound,
	LayoutDashboard,
	Network,
	ServerCog,
	Shield,
	Sparkles,
	TriangleAlert,
} from "lucide-react";
import type { UIConfigResponse } from "../lib/api-client-admin-auth";
import type { PublicStatusSummaryResponse } from "../lib/api-client-public-status";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { StatusCheckGrid } from "./status-check-grid";

type PublicLandingPageContentProps = {
	uiConfig?: UIConfigResponse;
	statusSummary?: PublicStatusSummaryResponse;
	loginHref: string;
	localLoginHref: string;
	breakGlassEnabled: boolean;
	breakGlassLabel: string;
	authModeLabel: string;
};

type WorkflowCard = {
	title: string;
	description: string;
	icon: typeof Sparkles;
	emphasis: string;
};

const workflowCards: WorkflowCard[] = [
	{
		title: "Quick Deploy",
		description:
			"Launch curated GTM labs, training environments, and baseline demos from Netlab-backed templates.",
		icon: Sparkles,
		emphasis: "Curated launch path",
	},
	{
		title: "Forward-connected labs",
		description:
			"Provision tenant-isolated demos, collectors, and integration-ready networks from a single control plane.",
		icon: Network,
		emphasis: "Per-user separation",
	},
	{
		title: "Reservations and capacity",
		description:
			"Schedule platform time, see immediate headroom, and keep customer or training workflows predictable.",
		icon: Boxes,
		emphasis: "Status-first operations",
	},
	{
		title: "Platform operations",
		description:
			"Inspect worker, queue, storage, auth, and observability signals before you enter the workflow surface.",
		icon: Shield,
		emphasis: "Operator control plane",
	},
];

function statusVariant(status?: string): "secondary" | "destructive" | "outline" {
	switch (String(status ?? "").trim().toLowerCase()) {
		case "ok":
		case "up":
			return "secondary";
		case "degraded":
		case "down":
			return "destructive";
		default:
			return "outline";
	}
}

function topSignalLabel(checks: PublicStatusSummaryResponse["checks"] | undefined): string {
	if (!checks || checks.length === 0) return "No status feed yet";
	const degraded = checks.filter((check) => check.status !== "up" && check.status !== "ok");
	if (degraded.length === 0) return "Core services nominal";
	if (degraded.length === 1) return `${degraded[0]?.name ?? "service"} requires attention`;
	return `${degraded.length} services require attention`;
}

function topSignalRows(checks: PublicStatusSummaryResponse["checks"] | undefined) {
	const rows = [...(checks ?? [])].sort((left, right) => {
		const leftHealthy = left.status === "up" || left.status === "ok";
		const rightHealthy = right.status === "up" || right.status === "ok";
		if (leftHealthy === rightHealthy) return left.name.localeCompare(right.name);
		return leftHealthy ? 1 : -1;
	});
	return rows.slice(0, 6);
}

export function PublicLandingPageContent(
	props: PublicLandingPageContentProps,
) {
	const checks = props.statusSummary?.checks ?? [];
	const headlineStatus = props.statusSummary?.status ?? "unknown";
	const signalRows = topSignalRows(checks);
	const degraded = headlineStatus !== "ok";
	const productName = props.uiConfig?.productName || "Skyforge";

	return (
		<div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 lg:px-6 lg:py-8">
			<section className="rounded-2xl border border-border/70 bg-card shadow-sm">
				<div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-8">
					<div className="space-y-6">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline">
								Internal GTM platform
							</Badge>
							<Badge variant={statusVariant(headlineStatus)} className="capitalize">
								{headlineStatus}
							</Badge>
							<Badge variant="outline">
								Auth {props.authModeLabel}
							</Badge>
						</div>
						<div className="space-y-3">
							<div className="font-mono text-[11px] uppercase tracking-[0.34em] text-muted-foreground">
								Operator entry point
							</div>
							<h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
								{productName}
							</h1>
							<p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
								Launch demos, inspect platform readiness, and move into
								Forward-connected workflows from a single internal control surface.
								The entry page now exposes enough live state to tell you whether the
								stack is ready before you sign in.
							</p>
						</div>

						<div className="grid gap-3 sm:grid-cols-3">
							<div className="rounded-[1.1rem] border bg-muted/20 p-4">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
									Healthy
								</div>
								<div className="mt-2 text-3xl font-semibold">
									{props.statusSummary?.up ?? 0}
								</div>
								<div className="mt-1 text-sm text-muted-foreground">Public-safe ready checks</div>
							</div>
							<div className="rounded-[1.1rem] border bg-muted/20 p-4">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
									Active labs
								</div>
								<div className="mt-2 text-3xl font-semibold">
									{props.statusSummary?.deploymentsActive ?? 0}
								</div>
								<div className="mt-1 text-sm text-muted-foreground">Currently running environments</div>
							</div>
							<div className="rounded-[1.1rem] border bg-muted/20 p-4">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
									Tracked scopes
								</div>
								<div className="mt-2 text-3xl font-semibold">
									{props.statusSummary?.userScopesTotal ?? 0}
								</div>
								<div className="mt-1 text-sm text-muted-foreground">
									Tenant-isolated environments
								</div>
							</div>
						</div>

						<div className="flex flex-wrap gap-3">
							<Button
								asChild
								size="lg"
							>
								<a href={props.loginHref}>
									<KeyRound className="h-4 w-4" />
									Sign in
								</a>
							</Button>
							<Button
								asChild
								size="lg"
								variant="outline"
							>
								<Link to="/docs">
									<BookOpen className="h-4 w-4" />
									Docs
								</Link>
							</Button>
							{props.breakGlassEnabled ? (
								<Button
									asChild
									size="lg"
									variant="ghost"
								>
									<a href={props.localLoginHref}>{props.breakGlassLabel}</a>
								</Button>
							) : null}
						</div>
					</div>

					<div className="grid gap-4">
						<Card className="shadow-none">
							<CardHeader className="space-y-3 pb-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<CardTitle className="text-xl">Entry protocol</CardTitle>
										<CardDescription>
											Internal login hub, not a generic landing page.
										</CardDescription>
									</div>
									<ServerCog className="h-5 w-5 text-muted-foreground" />
								</div>
							</CardHeader>
							<CardContent className="space-y-4 text-sm">
								<div className="rounded-2xl border bg-muted/20 p-4">
									<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
										Default path
									</div>
									<div className="mt-2 text-base font-medium">
										Authenticate, then land on the status-first dashboard.
									</div>
									<div className="mt-1 text-muted-foreground">
										Quick Deploy is available from the dashboard, but it is no
										longer the blind default.
									</div>
								</div>
								<div className="rounded-2xl border bg-muted/20 p-4">
									<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
										Primary signal
									</div>
									<div className="mt-2 flex items-start gap-3">
										<TriangleAlert
											className={cn(
												"mt-0.5 h-4 w-4 shrink-0",
												degraded ? "text-amber-300" : "text-emerald-300",
											)}
										/>
										<div>
											<div className="font-medium">
												{topSignalLabel(checks)}
											</div>
											<div className="mt-1 text-muted-foreground">
												{props.statusSummary?.timestamp
													? `Status feed updated ${new Date(props.statusSummary.timestamp).toLocaleString()}.`
													: "Status feed has not reported yet."}
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="shadow-none">
							<CardHeader className="pb-4">
								<CardTitle className="text-lg">Live signal board</CardTitle>
								<CardDescription>
									Most relevant platform checks before sign-in.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								{signalRows.length === 0 ? (
									<div className="rounded-2xl border border-dashed px-4 py-5 text-sm text-muted-foreground">
										Waiting for the first status sample.
									</div>
								) : (
									signalRows.map((check) => {
										const healthy = check.status === "up" || check.status === "ok";
										return (
											<div
												key={`${check.name}:${check.status}`}
												className={cn(
													"rounded-2xl border px-4 py-3",
													healthy
														? "border-emerald-500/20 bg-emerald-500/8"
														: "border-amber-500/30 bg-amber-500/10",
												)}
											>
												<div className="flex items-center justify-between gap-3">
													<div className="font-medium capitalize">
														{check.name.replace(/[-_]/g, " ")}
													</div>
													<Badge variant={statusVariant(check.status)}>
														{check.status}
													</Badge>
												</div>
												<div className="mt-1 text-sm text-muted-foreground">
													{check.detail?.trim() || "No additional detail reported."}
												</div>
											</div>
										);
									})
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
				<Card variant="flat" className="border-border/70">
					<CardHeader>
						<CardTitle className="text-xl">Platform readiness map</CardTitle>
						<CardDescription>
							Core services required for login, queueing, storage, and integrated
							workflows.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<StatusCheckGrid checks={checks} compact />
					</CardContent>
				</Card>

				<div className="grid gap-4">
					{workflowCards.map((card) => {
						const Icon = card.icon;
						return (
							<Card key={card.title} variant="interactive" className="border-border/70">
								<CardContent className="flex items-start gap-4 p-5">
									<div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/25">
										<Icon className="h-5 w-5" />
									</div>
									<div className="space-y-1">
										<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
											{card.emphasis}
										</div>
										<div className="flex items-center gap-2 text-base font-semibold">
											{card.title}
											<ArrowRight className="h-4 w-4 text-muted-foreground" />
										</div>
										<p className="text-sm leading-6 text-muted-foreground">
											{card.description}
										</p>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<Card variant="glass">
					<CardHeader>
						<CardTitle className="text-base">Authentication mode</CardTitle>
						<CardDescription>
							Publicly visible runtime auth context before you attempt login.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
						<KeyRound className="h-4 w-4" />
						<span>
							Current auth mode: <strong>{props.authModeLabel}</strong>
						</span>
					</CardContent>
				</Card>
				<Card variant="glass">
					<CardHeader>
						<CardTitle className="text-base">Operational home</CardTitle>
						<CardDescription>
							Successful login lands on the dashboard so operators see capacity,
							reservations, and system conditions first.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
						<LayoutDashboard className="h-4 w-4" />
						<span>Status-first routing is now the default launch sequence.</span>
					</CardContent>
				</Card>
				<Card variant="glass">
					<CardHeader>
						<CardTitle className="text-base">Operator docs</CardTitle>
						<CardDescription>
							Use docs when auth is degraded or when you need deployment and
							integration guidance before sign-in.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
						<Activity className="h-4 w-4" />
						<span>Docs stay reachable without an authenticated session.</span>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
