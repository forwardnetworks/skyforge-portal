import { createFileRoute, redirect } from "@tanstack/react-router";
import { requireCatalogRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/admin/settings")({
	beforeLoad: async ({ context }) => {
		await requireCatalogRouteAccess(context, "/admin/settings");
		throw redirect({ to: "/settings", search: { section: "users" } });
	},
	component: RedirectedAdminSettingsPage,
});

function RedirectedAdminSettingsPage() {
	return null;
}
