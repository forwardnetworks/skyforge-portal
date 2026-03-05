import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { getSession } from "./api-client";
import { queryKeys } from "./query-keys";
import { sessionHasRole } from "./rbac";

type RouteContext = { queryClient: QueryClient };

export async function requireAdminRouteAccess(context: RouteContext) {
	const session = await context.queryClient.ensureQueryData({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	if (!sessionHasRole(session, "ADMIN")) {
		throw redirect({ to: "/status" });
	}
	return session;
}
