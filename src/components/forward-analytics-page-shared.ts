import type { ForwardAnalyticsPageData } from "../hooks/use-forward-analytics-page";
import type { SkyforgeUserScope } from "../lib/api-client";

export type ForwardAnalyticsPageContentProps = {
	page: ForwardAnalyticsPageData;
};

export function formatForwardAnalyticsPct(value: unknown): string {
	const n = Number(value);
	if (!Number.isFinite(n)) return "—";
	return `${(n * 100).toFixed(1)}%`;
}

export function userScopeLabel(scope: SkyforgeUserScope): string {
	return `${scope.name} (${scope.slug})`;
}
