import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getToolCatalog } from "../lib/api-client-tool-catalog";
import {
	catalogRouteAllowsAccess,
	indexCatalogRouteAccess,
	lookupCatalogRouteAccess,
} from "../lib/catalog-route-access";
import { queryKeys } from "../lib/query-keys";
import type { UIExperienceMode } from "../lib/ui-experience";

type Options = {
	session?: unknown;
	mode?: UIExperienceMode;
	enabled?: boolean;
};

export function useCatalogRouteAccess(options?: Options) {
	const toolCatalogQ = useQuery({
		queryKey: queryKeys.toolCatalog(),
		queryFn: getToolCatalog,
		enabled: options?.enabled ?? true,
		retry: false,
		staleTime: 5 * 60_000,
	});
	const routeAccessMap = useMemo(
		() => indexCatalogRouteAccess(toolCatalogQ.data?.routes),
		[toolCatalogQ.data?.routes],
	);

	return {
		toolCatalogQ,
		canAccessRoute: (routePath: string) =>
			catalogRouteAllowsAccess(
				lookupCatalogRouteAccess(routeAccessMap, routePath),
				{
					session: options?.session,
					mode: options?.mode,
				},
			),
	};
}
