import { ForwardTestDrivesPageContent } from "@/components/forward-testdrives-page-content";
import { requireCatalogRouteAccess } from "@/lib/ui-experience-route";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/forward/testdrives")({
	beforeLoad: ({ context }) =>
		requireCatalogRouteAccess(context, "/dashboard/forward/testdrives"),
	component: ForwardTestDrivesPage,
});

function ForwardTestDrivesPage() {
	return <ForwardTestDrivesPageContent />;
}
