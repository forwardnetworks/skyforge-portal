import { ForwardNetworkCapacityPageContent } from "@/components/capacity/forward-network-capacity-page-content";
import { useForwardNetworkCapacityPage } from "@/hooks/use-forward-network-capacity-page";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAdvancedRouteAccess } from "../../../lib/ui-experience-route";

const searchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute(
	"/dashboard/forward-analytics/$networkRef/capacity",
)({
	validateSearch: (search) => searchSchema.parse(search),
	beforeLoad: async ({ context }) => requireAdvancedRouteAccess(context),
	component: ForwardNetworkCapacityPage,
});

function ForwardNetworkCapacityPage() {
	const { networkRef } = Route.useParams();
	const { userId } = Route.useSearch();
	const page = useForwardNetworkCapacityPage(networkRef, userId);
	return <ForwardNetworkCapacityPageContent page={page} />;
}
