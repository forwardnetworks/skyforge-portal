import { Link } from "@tanstack/react-router";
import {
	ArrowRight,
	BookOpen,
	Boxes,
	KeyRound,
	LayoutDashboard,
	Network,
	Shield,
	Sparkles,
} from "lucide-react";
import type { UIConfigResponse } from "../lib/api-client-admin-auth";
import type { PublicStatusSummaryResponse } from "../lib/api-client-public-status";
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

function statusVariant(status?: string): "secondary" | "destructive" | "outline" {
	switch (String(status ?? "").trim().toLowerCase()) {
		case "ok":
			return "secondary";
		case "degraded":
			return "destructive";
		default:
			return "outline";
	}
}

const workflowCards = [
	{
		title: "Quick deploy",
		description:
			"Launch repeatable GTM and training labs from curated Netlab-backed templates.",
		icon: Sparkles,
	},
	{
		title: "Forward-connected labs",
		description:
			"Provision isolated tenants, collectors, and synchronized demo environments from one control plane.",
		icon: Network,
	},
	{
		title: "Platform operations",
		description:
			"Track reservations, capacity, health, and embedded integrations from the same portal surface.",
		icon: Shield,
	},
];

export function PublicLandingPageContent(
	props: PublicLandingPageContentProps,
) {
	const checks = props.statusSummary?.checks ?? [];
	const headlineStatus = props.statusSummary?.status ?? "unknown";

	return (
		<div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 lg:px-6">
			<section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(24,24,27,0.95)_45%,rgba(56,189,248,0.14))] text-white shadow-2xl shadow-black/20">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.15),transparent_35%),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:auto,28px_28px,28px_28px] opacity-60" />
				<div className="relative grid gap-8 px-6 py-8 lg:grid-cols-[1.35fr_0.85fr] lg:px-10 lg:py-10">
					<div className="space-y-6">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline" className="border-white/20 bg-white/10 text-white">
								Automation platform
							</Badge>
							<Badge variant={statusVariant(headlineStatus)} className="capitalize">
								Platform {headlineStatus}
							</Badge>
							<Badge variant="outline" className="border-white/20 bg-white/10 text-white">
								Auth {props.authModeLabel}
							</Badge>
						</div>
						<div className="space-y-4">
							<div className="text-[11px] uppercase tracking-[0.32em] text-slate-300">
								Internal launch and operations hub
							</div>
							<h1 className="max-w-3xl font-serif text-4xl tracking-tight text-white sm:text-5xl">
								{props.uiConfig?.productName || "Skyforge"}
							</h1>
							<p className="max-w-3xl text-base leading-7 text-slate-200 sm:text-lg">
								Restoreable demos, tenant-isolated labs, and live platform state in
								one operator-facing surface. Sign in to launch demos, inspect
								capacity, and drive Forward-connected workflows.
							</p>
						</div>
						<div className="flex flex-wrap gap-3">
							<Button
								asChild
								size="lg"
								className="bg-white text-slate-950 hover:bg-slate-100"
							>
								<a href={props.loginHref}>
									<KeyRound className="h-4 w-4" />
									Sign in
								</a>
							</Button>
							{props.breakGlassEnabled ? (
								<Button
									asChild
									size="lg"
									variant="outline"
									className="border-white/20 bg-white/5 text-white hover:bg-white/10"
								>
									<a href={props.localLoginHref}>{props.breakGlassLabel}</a>
								</Button>
							) : null}
							<Button
								asChild
								size="lg"
								variant="ghost"
								className="text-white hover:bg-white/10 hover:text-white"
							>
								<Link to="/docs">
									<BookOpen className="h-4 w-4" />
									Docs
								</Link>
							</Button>
						</div>
					</div>

					<Card className="border-white/10 bg-white/5 text-white shadow-none backdrop-blur-sm">
						<CardHeader>
							<CardTitle className="text-lg text-white">
								Current platform snapshot
							</CardTitle>
							<CardDescription className="text-slate-300">
								Public-safe health from the running local stack.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="grid gap-3 sm:grid-cols-3">
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
										Healthy checks
									</div>
									<div className="mt-2 text-3xl font-semibold">
										{props.statusSummary?.up ?? 0}
									</div>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
										Degraded checks
									</div>
									<div className="mt-2 text-3xl font-semibold">
										{props.statusSummary?.down ?? 0}
									</div>
								</div>
								<div className="rounded-2xl border border-white/10 bg-white/5 p-4">
									<div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
										Active labs
									</div>
									<div className="mt-2 text-3xl font-semibold">
										{props.statusSummary?.deploymentsActive ?? 0}
									</div>
								</div>
							</div>
							<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<div className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
											Status feed
										</div>
										<div className="mt-1 text-sm text-slate-200">
											{props.statusSummary?.timestamp
												? `Updated ${new Date(props.statusSummary.timestamp).toLocaleString()}`
												: "Waiting for the first status sample."}
										</div>
									</div>
									<Button
										asChild
										variant="outline"
										size="sm"
										className="border-white/20 bg-white/5 text-white hover:bg-white/10"
									>
										<a href="#system-status">
											<LayoutDashboard className="h-4 w-4" />
											Status
										</a>
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</section>

			<section
				id="system-status"
				className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
			>
				<Card variant="flat" className="border-border/70">
					<CardHeader>
						<CardTitle className="text-xl">Core system status</CardTitle>
						<CardDescription>
							Core readiness before sign-in: API, storage, queueing, and worker
							health.
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
									<div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/30">
										<Icon className="h-5 w-5" />
									</div>
									<div className="space-y-1">
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

			<section className="grid gap-4 lg:grid-cols-3">
				<Card variant="glass">
					<CardHeader>
						<CardTitle className="text-base">Default sign-in target</CardTitle>
						<CardDescription>
							Successful login lands on the status-first dashboard, not directly in
							Quick Deploy.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Use the dashboard to launch labs, inspect reservations, and review
						platform conditions before starting a workflow.
					</CardContent>
				</Card>
				<Card variant="glass">
					<CardHeader>
						<CardTitle className="text-base">Documentation</CardTitle>
						<CardDescription>
							Operator docs, workflow references, and embedded API docs remain
							available before sign-in.
						</CardDescription>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Use the Docs entry when auth is down or when you need deployment and
						integration guidance before logging in.
					</CardContent>
				</Card>
				<Card variant="glass">
					<CardHeader>
						<CardTitle className="text-base">Mode awareness</CardTitle>
						<CardDescription>
							Auth mode and health state are visible before you attempt a login.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
						<Boxes className="h-4 w-4" />
						<span>
							Current auth mode: <strong>{props.authModeLabel}</strong>
						</span>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
