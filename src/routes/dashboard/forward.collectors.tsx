import { createFileRoute } from "@tanstack/react-router";
import { ForwardCollectorsPageContent } from "../../components/forward-collectors-page-content";
import { useForwardCollectorsPage } from "../../hooks/use-forward-collectors-page";
import { requireCatalogRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/forward/collectors")({
	beforeLoad: ({ context }) =>
		requireCatalogRouteAccess(context, "/dashboard/forward/collectors"),
	component: ForwardCollectorPage,
});

function ForwardCollectorPage() {
	const page = useForwardCollectorsPage();
	return <ForwardCollectorsPageContent page={page} />;
}
