import { createFileRoute } from "@tanstack/react-router";
import { requireCatalogRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/observability")({
	beforeLoad: async ({ context }) =>
		requireCatalogRouteAccess(context, "/dashboard/observability"),
});
