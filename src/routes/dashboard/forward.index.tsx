import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireCatalogRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/forward/")({
	beforeLoad: async ({ context }) => {
		await requireCatalogRouteAccess(context, "/dashboard/forward");
		throw redirect({ to: "/dashboard/forward/collectors" });
	},
});
