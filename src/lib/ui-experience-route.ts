import type { QueryClient } from "@tanstack/react-query";
import { notFound, redirect } from "@tanstack/react-router";
import { requireAdminRouteAccess } from "./admin-route";
import { getUserSettings } from "./api-client";
import { getToolCatalog } from "./api-client-tool-catalog";
import { queryKeys } from "./query-keys";
import {
	indexToolLaunches,
	indexToolRouteAccessEntries,
} from "./tool-launches";
import { normalizeUIExperienceMode } from "./ui-experience";

type RouteContext = { queryClient: QueryClient };

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
	const rule = indexToolRouteAccessEntries(catalog.routes)[normalizedRoutePath];
	if (!rule) {
		throw new Error(
			`route ${normalizedRoutePath} is missing a catalog route contract`,
		);
	}
	const mode = normalizeUIExperienceMode(settings.uiExperienceMode);
	const experience = assertExperienceContract(
		rule.experience,
		`route ${normalizedRoutePath}`,
	);
	if (
		(experience === "advanced" && mode !== "advanced") ||
		(experience === "simple" && mode !== "simple")
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
	const experience = assertExperienceContract(
		tool.experience,
		`tool ${tool.id}`,
	);
	if (
		(experience === "advanced" && mode !== "advanced") ||
		(experience === "simple" && mode !== "simple")
	) {
		throw redirect({ to: "/dashboard" });
	}
	return settings;
}
