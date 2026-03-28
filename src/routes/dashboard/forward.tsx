import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireCatalogRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/forward")({
	beforeLoad: ({ context }) =>
		requireCatalogRouteAccess(context, "/dashboard/forward"),
	component: ForwardLayout,
});

function ForwardLayout() {
	return <Outlet />;
}
