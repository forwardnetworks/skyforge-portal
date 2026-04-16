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

export async function invalidateDashboardSnapshotQuery(
	queryClient: QueryClient,
) {
	await queryClient.invalidateQueries({
		queryKey: queryKeys.dashboardSnapshot(),
	});
}

export async function invalidateDashboardSummaryQuery(
	queryClient: QueryClient,
) {
	await queryClient.invalidateQueries({
		queryKey: queryKeys.dashboardSummary(),
	});
}

export async function invalidateUserScopeDeploymentsQueries(
	queryClient: QueryClient,
	userId?: string,
) {
	const scopeId = String(userId ?? "").trim();
	await queryClient.invalidateQueries({
		queryKey: scopeId
			? queryKeys.userScopeDeployments(scopeId)
			: (["userScopeDeployments"] as const),
	});
}

export async function invalidateUserScopeRunsQueries(
	queryClient: QueryClient,
	userId?: string,
) {
	const scopeId = String(userId ?? "").trim();
	await queryClient.invalidateQueries({
		queryKey: scopeId
			? (["userScopeRuns", scopeId] as const)
			: (["userScopeRuns"] as const),
	});
}

export async function invalidateUserScopeActivityQueries(
	queryClient: QueryClient,
	userId?: string,
) {
	await Promise.all([
		invalidateUserScopeDeploymentsQueries(queryClient, userId),
		invalidateUserScopeRunsQueries(queryClient, userId),
	]);
}
