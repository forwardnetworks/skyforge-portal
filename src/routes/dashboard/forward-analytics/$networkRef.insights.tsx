import { ForwardNetworkCapacityPageContent } from "@/components/capacity/forward-network-capacity-page-content";
import { useForwardNetworkCapacityPage } from "@/hooks/use-forward-network-capacity-page";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireCatalogRouteAccess } from "../../../lib/ui-experience-route";

const searchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute(
	"/dashboard/forward-analytics/$networkRef/insights",
)({
	validateSearch: (search) => searchSchema.parse(search),
	beforeLoad: async ({ context }) =>
		requireCatalogRouteAccess(
			context,
			"/dashboard/forward-analytics/$networkRef/insights",
		),
	component: ForwardNetworkInsightsPage,
});

function ForwardNetworkInsightsPage() {
	const { networkRef } = Route.useParams();
	const { userId } = Route.useSearch();
	const page = useForwardNetworkCapacityPage(networkRef, userId);
	return <ForwardNetworkCapacityPageContent page={page} />;
}
