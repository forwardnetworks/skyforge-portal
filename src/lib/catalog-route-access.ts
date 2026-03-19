import { sessionHasRole } from "./rbac";
import type { ToolRouteAccessEntry } from "./tool-launches";
import {
	type ToolRouteAccessMap,
	indexToolRouteAccessEntries,
} from "./tool-launches";
import {
	type UIExperienceMode,
	normalizeUIExperienceMode,
} from "./ui-experience";

type RouteAccessOptions = {
	session?: unknown;
	mode?: UIExperienceMode;
};

function assertExperienceContract(kind: string, id: string) {
	const normalized = String(kind ?? "")
		.trim()
		.toLowerCase();
	if (
		normalized !== "both" &&
		normalized !== "simple" &&
		normalized !== "advanced"
	) {
		throw new Error(`${id} is missing a valid experience contract`);
	}
	return normalized;
}

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
	options?: RouteAccessOptions,
): boolean {
	if (!route) {
		return false;
	}
	const experience = assertExperienceContract(
		route.experience,
		`route ${route.path}`,
	);
	const mode = normalizeUIExperienceMode(options?.mode);
	if (
		(experience === "advanced" && mode !== "advanced") ||
		(experience === "simple" && mode !== "simple")
	) {
		return false;
	}
	if (
		route.adminOnly &&
		options?.session !== undefined &&
		!sessionHasRole(options.session, "ADMIN")
	) {
		return false;
	}
	return true;
}
