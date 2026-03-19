import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CompositePlansPageContent } from "../../../components/deployments/composite-plans-page-content";
import { useCompositePlansPage } from "../../../hooks/use-composite-plans-page";
import { requireAdvancedRouteAccess } from "../../../lib/ui-experience-route";

const searchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/deployments/composite")({
	validateSearch: (search) => searchSchema.parse(search),
	beforeLoad: async ({ context }) => requireAdvancedRouteAccess(context),
	component: CompositePlansPage,
});

function CompositePlansPage() {
	const { userId } = Route.useSearch();
	const page = useCompositePlansPage(userId);
	return <CompositePlansPageContent page={page} />;
}
