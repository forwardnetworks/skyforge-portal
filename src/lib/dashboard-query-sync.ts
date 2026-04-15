import type { QueryClient } from "@tanstack/react-query";
import type { DashboardSnapshot } from "./api-client-user-dashboard";
import { queryKeys } from "./query-keys";

export function setDashboardQueryData(
	queryClient: QueryClient,
	snapshot: DashboardSnapshot,
) {
	queryClient.setQueryData(queryKeys.dashboardSnapshot(), snapshot);
	queryClient.setQueryData(queryKeys.dashboardSummary(), snapshot);
}

export async function invalidateDashboardQueries(queryClient: QueryClient) {
	await Promise.all([
		queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSnapshot() }),
		queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSummary() }),
	]);
}
