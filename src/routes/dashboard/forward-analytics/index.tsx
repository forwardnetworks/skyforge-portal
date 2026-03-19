import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ForwardAnalyticsPageContent } from "../../../components/forward-analytics-page-content";
import { useForwardAnalyticsPage } from "../../../hooks/use-forward-analytics-page";
import { listUserScopes } from "../../../lib/api-client";
import { queryKeys } from "../../../lib/query-keys";
import { requireCatalogRouteAccess } from "../../../lib/ui-experience-route";

const searchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/forward-analytics/")({
	validateSearch: (search) => searchSchema.parse(search),
	loaderDeps: ({ search: { userId } }) => ({ userId }),
	loader: async ({ context }) => {
		await requireCatalogRouteAccess(context, "/dashboard/forward-analytics/");
		const { queryClient } = context;
		await queryClient.ensureQueryData({
			queryKey: queryKeys.userScopes(),
			queryFn: listUserScopes,
			staleTime: 30_000,
		});
	},
	component: ForwardAnalyticsPage,
});

function ForwardAnalyticsPage() {
	const { userId } = Route.useSearch();
	const page = useForwardAnalyticsPage({ userId });
	return <ForwardAnalyticsPageContent page={page} />;
}
