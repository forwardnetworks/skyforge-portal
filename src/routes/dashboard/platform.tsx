import { createFileRoute } from "@tanstack/react-router";
import { PlatformCapacityPageContent } from "../../components/platform-capacity-page-content";
import { usePlatformCapacityPage } from "../../hooks/use-platform-capacity-page";
import { requireCatalogRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/platform")({
	beforeLoad: async ({ context }) =>
		requireCatalogRouteAccess(context, "/dashboard/platform"),
	component: PlatformCapacityPage,
});

function PlatformCapacityPage() {
	const page = usePlatformCapacityPage();
	return <PlatformCapacityPageContent page={page} />;
}
