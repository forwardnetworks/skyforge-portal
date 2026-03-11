import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
	buildLocalLoginUrl,
	buildLoginUrl,
	getSession,
	getUIConfig,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import type { SkyforgeAuthMode } from "../lib/skyforge-config";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const navigate = useNavigate();

	const session = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		retry: false,
		staleTime: 30_000,
	});
	const uiConfig = useQuery({
		queryKey: queryKeys.uiConfig(),
		queryFn: getUIConfig,
		staleTime: 5 * 60_000,
	});

	useEffect(() => {
		if (session.isLoading) return;

		if (session.data?.authenticated) {
			void navigate({ to: "/dashboard/deployments/quick", replace: true });
		}
	}, [session.data?.authenticated, session.isLoading, navigate]);

	const authMode: SkyforgeAuthMode | null =
		uiConfig.data?.auth?.primaryProvider === "local"
			? "local"
			: uiConfig.data?.auth?.primaryProvider === "okta"
				? "oidc"
				: uiConfig.data?.authMode === "local"
					? "local"
					: uiConfig.data?.authMode === "oidc"
						? "oidc"
						: null;
	const loginHref = useMemo(
		() => buildLoginUrl("/dashboard/deployments/quick", authMode),
		[authMode],
	);
	const localLoginHref = useMemo(
		() => buildLocalLoginUrl("/dashboard/deployments/quick"),
		[],
	);
	const breakGlassEnabled = uiConfig.data?.auth?.breakGlassEnabled === true;
	const breakGlassLabel = String(
		uiConfig.data?.auth?.breakGlassLabel ?? "Emergency local login",
	).trim();

	if (session.isLoading) return null;
	if (session.data?.authenticated) return null;

	return (
		<div className="mx-auto w-full max-w-5xl space-y-6">
			<div className="space-y-2">
				<h1 className="text-3xl font-semibold tracking-tight">Skyforge</h1>
				<p className="text-sm text-muted-foreground">
					Kubernetes-native lab automation for Deployments, Quick Deploy, and
					Forward-integrated workflows.
				</p>
			</div>
			<div className="flex flex-wrap gap-3">
				<Button asChild>
					<a href={loginHref}>Login</a>
				</Button>
				{breakGlassEnabled && authMode === "oidc" ? (
					<Button asChild variant="outline">
						<a href={localLoginHref}>{breakGlassLabel}</a>
					</Button>
				) : null}
				<Button asChild variant="ghost">
					<Link to="/docs">Docs</Link>
				</Button>
			</div>
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Quick Deploy</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Curated Netlab templates with one-click deployment and forwarding
						workflows.
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Integrations</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						Forward, NetBox, Nautobot, Jira, Infoblox, and other platform
						integrations in one control plane.
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Operations</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground">
						User-scoped access, RBAC controls, and in-cluster services for lab
						and demo operations.
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
