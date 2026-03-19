import type { QueryClient } from "@tanstack/react-query";
import { notFound, redirect } from "@tanstack/react-router";
import { getToolCatalog } from "./api-client-tool-catalog";
import {
	catalogRouteAllowsAccess,
	indexCatalogRouteAccess,
	lookupCatalogRouteAccess,
} from "./catalog-route-access";
import { queryKeys } from "./query-keys";
import { indexToolLaunches } from "./tool-launches";

type RouteContext = { queryClient: QueryClient };

export async function requireCatalogRouteAccess(
	context: RouteContext,
	routePath: string,
) {
	const catalog = await context.queryClient.ensureQueryData({
		queryKey: queryKeys.toolCatalog(),
		queryFn: getToolCatalog,
		staleTime: 5 * 60_000,
		retry: false,
	});
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
	if (!catalogRouteAllowsAccess(rule)) {
		throw redirect({ to: "/dashboard" });
	}
	return null;
}

export async function requireToolRouteAccess(
	context: RouteContext,
	toolID: string,
) {
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
	if (typeof tool.allowed !== "boolean") {
		throw new Error(`tool ${tool.id} is missing an allowed contract`);
	}
	if (!tool.allowed) {
		throw redirect({ to: "/dashboard" });
	}
	return null;
}
