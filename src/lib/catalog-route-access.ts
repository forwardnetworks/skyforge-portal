import type { ToolRouteAccessEntry } from "./tool-launches";
import {
	type ToolRouteAccessMap,
	indexToolRouteAccessEntries,
} from "./tool-launches";

export function indexCatalogRouteAccess(
	routes?: ToolRouteAccessEntry[] | null,
): ToolRouteAccessMap {
	return indexToolRouteAccessEntries(routes);
}

export function lookupCatalogRouteAccess(
	routes: ToolRouteAccessMap,
	routePath: string,
): ToolRouteAccessEntry | null {
	const normalizedRoutePath = String(routePath ?? "").trim();
	if (!normalizedRoutePath) {
		return null;
	}
	return routes[normalizedRoutePath] ?? null;
}

export function catalogRouteAllowsAccess(
	route: ToolRouteAccessEntry | null | undefined,
): boolean {
	if (!route) {
		return false;
	}
	if (typeof route.allowed !== "boolean") {
		throw new Error(`route ${route.path} is missing an allowed contract`);
	}
	return route.allowed;
}
