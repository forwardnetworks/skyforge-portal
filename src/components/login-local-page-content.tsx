import { Link } from "@tanstack/react-router";
import { Activity, ArrowLeft, KeyRound, ShieldAlert } from "lucide-react";
import type { UIConfigResponse } from "../lib/api-client-admin-auth";
import type { PublicStatusSummaryResponse } from "../lib/api-client-public-status";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
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

	return (
		<div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center px-4 py-8">
			<div className="grid w-full gap-6 lg:grid-cols-[0.95fr_1.05fr]">
				<Card className="overflow-hidden border-border/70 bg-[linear-gradient(150deg,rgba(15,23,42,0.98),rgba(24,24,27,0.96)_55%,rgba(16,185,129,0.12))] text-white shadow-2xl shadow-black/20">
					<CardHeader className="space-y-4">
						<div className="flex items-center gap-2">
							<Badge variant="outline" className="border-white/20 bg-white/10 text-white">
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
							<CardTitle className="font-serif text-3xl text-white">
								Local sign-in
							</CardTitle>
							<CardDescription className="max-w-xl text-slate-300">
								Use the local Skyforge account for development and offline stack
								validation. This path should stay explicit and operator-friendly.
							</CardDescription>
						</div>
						<div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
							<div className="flex items-center gap-2 font-medium">
								<Activity className="h-4 w-4" />
								Auth mode
							</div>
							<div className="mt-1 text-slate-300">
								{props.uiConfig?.auth?.primaryProvider === "local"
									? "Local password authentication"
									: "Current runtime auth is not local; this page is for explicit local login only."}
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{degraded ? (
							<div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
								<div className="flex items-center gap-2 font-medium">
									<ShieldAlert className="h-4 w-4" />
									Backend degraded
								</div>
								<div className="mt-1 text-amber-50/85">
									The login API is available, but one or more backing services are
									unhealthy. Sign-in may fail until the core checks recover.
								</div>
							</div>
						) : null}
						<StatusCheckGrid checks={props.statusSummary?.checks ?? []} compact />
					</CardContent>
				</Card>

				<Card className="border-border/70">
					<CardHeader className="space-y-3">
						<div className="flex items-center justify-between gap-3">
							<div>
								<CardTitle className="text-2xl">Sign in</CardTitle>
								<CardDescription>
									Authenticate with your local development account.
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
					<CardContent className="space-y-4">
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
							<div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
								{props.error}
							</div>
						) : (
							<div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
								Default local development account is typically <code>skyforge</code>.
								If this page returns a server-side failure, check the platform
								health panel on the left before retrying.
							</div>
						)}
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
							{props.signingIn ? "Signing in..." : "Sign in"}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
