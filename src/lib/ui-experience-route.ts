import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { getUserSettings } from "./api-client";
import { queryKeys } from "./query-keys";
import { isSimpleUIExperienceMode } from "./ui-experience";

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
