import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { getUserSettings } from "./api-client";
import { getToolCatalog } from "./api-client-tool-catalog";
import { queryKeys } from "./query-keys";
import { indexToolLaunches } from "./tool-launches";
import {
	isSimpleUIExperienceMode,
	normalizeUIExperienceMode,
} from "./ui-experience";

type RouteContext = { queryClient: QueryClient };

export async function requireAdvancedRouteAccess(context: RouteContext) {
	const settings = await context.queryClient.ensureQueryData({
		queryKey: queryKeys.userSettings(),
		queryFn: getUserSettings,
		staleTime: 30_000,
		retry: false,
	});
	if (isSimpleUIExperienceMode(settings.uiExperienceMode)) {
		throw redirect({ to: "/dashboard" });
	}
	return settings;
}

export async function requireToolRouteAccess(
	context: RouteContext,
	toolID: string,
) {
	const settings = await context.queryClient.ensureQueryData({
		queryKey: queryKeys.userSettings(),
		queryFn: getUserSettings,
		staleTime: 30_000,
		retry: false,
	});
	const catalog = await context.queryClient.ensureQueryData({
		queryKey: queryKeys.toolCatalog(),
		queryFn: getToolCatalog,
		staleTime: 5 * 60_000,
		retry: false,
	});
	const tool = indexToolLaunches(catalog.tools)[String(toolID ?? "").trim()];
	const mode = normalizeUIExperienceMode(settings.uiExperienceMode);
	const experience = String(tool?.experience ?? "advanced")
		.trim()
		.toLowerCase();
	if (experience === "advanced" && mode !== "advanced") {
		throw redirect({ to: "/dashboard" });
	}
	return settings;
}
