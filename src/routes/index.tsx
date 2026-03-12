import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { PublicLandingPageContent } from "../components/public-landing-page-content";
import {
	buildLocalLoginUrl,
	buildLoginUrl,
	getPublicStatusSummary,
	getSession,
	getUIConfig,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import type { SkyforgeAuthMode } from "../lib/skyforge-config";
import { useStatusSummaryEvents } from "../lib/status-events";

const landingSearchSchema = z.object({
	next: z.string().optional().catch("/dashboard"),
});

export const Route = createFileRoute("/")({
	validateSearch: (search) => landingSearchSchema.parse(search),
	component: LandingPage,
});

function LandingPage() {
	const navigate = useNavigate();
	const search = Route.useSearch();

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
	const statusSummary = useQuery({
		queryKey: queryKeys.statusSummary(),
		queryFn: getPublicStatusSummary,
		staleTime: 15_000,
		retry: false,
		refetchOnWindowFocus: false,
	});

	useStatusSummaryEvents(!session.data?.authenticated);

	useEffect(() => {
		if (session.isLoading) return;
		if (session.data?.authenticated) {
			void navigate({ to: "/dashboard", replace: true });
		}
	}, [navigate, session.data?.authenticated, session.isLoading]);

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
		() => buildLoginUrl(search.next || "/dashboard", authMode),
		[authMode, search.next],
	);
	const localLoginHref = useMemo(
		() => buildLocalLoginUrl(search.next || "/dashboard"),
		[search.next],
	);
	const breakGlassEnabled =
		uiConfig.data?.auth?.breakGlassEnabled === true && authMode === "oidc";
	const breakGlassLabel = String(
		uiConfig.data?.auth?.breakGlassLabel ?? "Emergency local login",
	).trim();
	const authModeLabel =
		authMode === "local" ? "Local" : authMode === "oidc" ? "OIDC" : "Unknown";

	if (session.isLoading) return null;
	if (session.data?.authenticated) return null;

	return (
		<PublicLandingPageContent
			uiConfig={uiConfig.data}
			statusSummary={statusSummary.data}
			loginHref={loginHref}
			localLoginHref={localLoginHref}
			breakGlassEnabled={breakGlassEnabled}
			breakGlassLabel={breakGlassLabel}
			authModeLabel={authModeLabel}
		/>
	);
}
