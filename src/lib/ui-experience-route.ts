import type { QueryClient } from "@tanstack/react-query";
import { notFound, redirect } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "./admin-route";
import { getUserSettings } from "./api-client";
import { getToolCatalog } from "./api-client-tool-catalog";
import {
	catalogRouteAllowsAccess,
	indexCatalogRouteAccess,
	lookupCatalogRouteAccess,
} from "./catalog-route-access";
import { queryKeys } from "./query-keys";
import { indexToolLaunches } from "./tool-launches";
import { normalizeUIExperienceMode } from "./ui-experience";

type RouteContext = { queryClient: QueryClient };

export async function requireCatalogRouteAccess(
	context: RouteContext,
	routePath: string,
) {
	const [settings, catalog] = await Promise.all([
		context.queryClient.ensureQueryData({
			queryKey: queryKeys.userSettings(),
			queryFn: getUserSettings,
			staleTime: 30_000,
			retry: false,
		}),
		context.queryClient.ensureQueryData({
			queryKey: queryKeys.toolCatalog(),
			queryFn: getToolCatalog,
			staleTime: 5 * 60_000,
			retry: false,
		}),
	]);
	const normalizedRoutePath = String(routePath ?? "").trim();
	const rule = lookupCatalogRouteAccess(
		indexCatalogRouteAccess(catalog.routes),
		normalizedRoutePath,
	);
	if (!rule) {
		throw new Error(
			`route ${normalizedRoutePath} is missing a catalog route contract`,
		);
	}
	if (
		!catalogRouteAllowsAccess(rule, {
			mode: normalizeUIExperienceMode(settings.uiExperienceMode),
		})
	) {
		throw redirect({ to: "/dashboard" });
	}
	if (rule.adminOnly) {
		await requireAdminRouteAccess(context);
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
	if (!tool) {
		throw notFound();
	}
	const mode = normalizeUIExperienceMode(settings.uiExperienceMode);
	const experience = String(tool.experience ?? "")
		.trim()
		.toLowerCase();
	if (
		experience !== "both" &&
		experience !== "simple" &&
		experience !== "advanced"
	) {
		throw new Error(`tool ${tool.id} is missing a valid experience contract`);
	}
	if (
		(experience === "advanced" && mode !== "advanced") ||
		(experience === "simple" && mode !== "simple")
	) {
		throw redirect({ to: "/dashboard" });
	}
	return settings;
}
