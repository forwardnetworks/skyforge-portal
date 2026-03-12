import { Link } from "@tanstack/react-router";
import {
	Activity,
	ArrowLeft,
	KeyRound,
	ServerCog,
	ShieldAlert,
	TriangleAlert,
} from "lucide-react";
import type { UIConfigResponse } from "../lib/api-client-admin-auth";
import type { PublicStatusSummaryResponse } from "../lib/api-client-public-status";
import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { StatusCheckGrid } from "./status-check-grid";

type LoginLocalPageContentProps = {
	uiConfig?: UIConfigResponse;
	statusSummary?: PublicStatusSummaryResponse;
	username: string;
	password: string;
	error: string;
	signingIn: boolean;
	onUsernameChange: (value: string) => void;
	onPasswordChange: (value: string) => void;
	onSubmit: () => void;
};

export function LoginLocalPageContent(props: LoginLocalPageContentProps) {
	const status = props.statusSummary?.status ?? "unknown";
	const degraded = status !== "ok";
	const productName = props.uiConfig?.productName || "Skyforge";
	const checks = props.statusSummary?.checks ?? [];

	return (
		<div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-7xl items-center px-4 py-6 lg:px-6 lg:py-8">
			<div className="grid w-full gap-6 xl:grid-cols-[1.05fr_0.95fr]">
				<section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-[linear-gradient(142deg,rgba(10,14,23,0.98),rgba(24,24,27,0.97)_52%,rgba(245,158,11,0.14))] text-white shadow-[0_28px_100px_rgba(2,6,23,0.42)]">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_25%),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:auto,24px_24px,24px_24px] opacity-70" />
					<div className="relative space-y-5 px-6 py-6 lg:px-8 lg:py-8">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline" className="border-white/15 bg-white/10 text-white">
								Local auth
							</Badge>
							<Badge
								variant={degraded ? "destructive" : "secondary"}
								className="capitalize"
							>
								{status}
							</Badge>
						</div>

						<div className="space-y-3">
							<div className="font-mono text-[11px] uppercase tracking-[0.34em] text-slate-300">
								Explicit operator path
							</div>
							<CardTitle className="font-serif text-4xl text-white">
								{productName} local sign-in
							</CardTitle>
							<CardDescription className="max-w-2xl text-base leading-7 text-slate-300">
								Use this path for local development, stack validation, and
								break-glass access when the environment is configured for local
								password authentication.
							</CardDescription>
						</div>

						<div className="grid gap-3 md:grid-cols-3">
							<div className="rounded-[1.3rem] border border-white/10 bg-white/6 p-4">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300">
									Healthy checks
								</div>
								<div className="mt-2 text-3xl font-semibold text-white">
									{props.statusSummary?.up ?? 0}
								</div>
							</div>
							<div className="rounded-[1.3rem] border border-white/10 bg-white/6 p-4">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300">
									Degraded checks
								</div>
								<div className="mt-2 text-3xl font-semibold text-white">
									{props.statusSummary?.down ?? 0}
								</div>
							</div>
							<div className="rounded-[1.3rem] border border-white/10 bg-white/6 p-4">
								<div className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-300">
									Auth mode
								</div>
								<div className="mt-2 text-lg font-semibold text-white">
									{props.uiConfig?.auth?.primaryProvider === "local"
										? "Local"
										: "Non-local"}
								</div>
							</div>
						</div>

						<div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
							<div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
								<div className="flex items-center gap-2 font-medium text-white">
									<Activity className="h-4 w-4" />
									Authentication contract
								</div>
								<div className="mt-2 space-y-2 text-slate-300">
									<p>
										Local sign-in should only be used when the environment is
										explicitly configured for local passwords.
									</p>
									<p>
										Default local development account is typically{" "}
										<code className="rounded bg-white/10 px-1 py-0.5 text-slate-100">
											skyforge
										</code>
										.
									</p>
								</div>
							</div>

							<div
								className={cn(
									"rounded-2xl border p-4 text-sm",
									degraded
										? "border-amber-500/30 bg-amber-500/10 text-amber-50"
										: "border-emerald-500/20 bg-emerald-500/10 text-emerald-50",
								)}
							>
								<div className="flex items-center gap-2 font-medium">
									{degraded ? (
										<ShieldAlert className="h-4 w-4" />
									) : (
										<ServerCog className="h-4 w-4" />
									)}
									{degraded ? "Backend degraded" : "Backend ready"}
								</div>
								<div className="mt-2 leading-6 text-inherit/90">
									{degraded
										? "One or more backing services are unhealthy. Local login may fail until API, storage, and worker checks recover."
										: "Core login dependencies are reporting healthy state. Continue with local authentication."}
								</div>
							</div>
						</div>

						<StatusCheckGrid checks={checks} compact />
					</div>
				</section>

				<Card className="border-border/70">
					<CardHeader className="space-y-3">
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-2">
								<div className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
									Local operator login
								</div>
								<CardTitle className="text-3xl">Sign in</CardTitle>
								<CardDescription className="max-w-xl">
									Authenticate with the local development account and continue to
									the dashboard.
								</CardDescription>
							</div>
							<Button asChild variant="ghost" size="sm">
								<Link to="/">
									<ArrowLeft className="h-4 w-4" />
									Back
								</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-5">
						<div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
							<div className="flex items-start gap-3">
								<TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
								<div>
									If sign-in returns a server-side failure, use the readiness map on
									the left first. This page is intentionally status-aware so local
									auth problems do not look like bad credentials.
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium">Username</label>
							<Input
								placeholder="skyforge"
								value={props.username}
								onChange={(e) => props.onUsernameChange(e.target.value)}
								disabled={props.signingIn}
								autoComplete="username"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-sm font-medium">Password</label>
							<Input
								type="password"
								placeholder="Local account password"
								value={props.password}
								onChange={(e) => props.onPasswordChange(e.target.value)}
								disabled={props.signingIn}
								autoComplete="current-password"
								onKeyDown={(e) => {
									if (e.key === "Enter") props.onSubmit();
								}}
							/>
						</div>

						{props.error ? (
							<div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
								{props.error}
							</div>
						) : null}

						<Button
							className="w-full"
							size="lg"
							disabled={
								props.signingIn ||
								props.username.trim() === "" ||
								props.password === ""
							}
							onClick={props.onSubmit}
						>
							<KeyRound className="h-4 w-4" />
							{props.signingIn ? "Signing in..." : "Sign in to dashboard"}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
