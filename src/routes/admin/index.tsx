import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { requireCatalogRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/admin/")({
	beforeLoad: async ({ context }) =>
		requireCatalogRouteAccess(context, "/admin/"),
	component: AdminIndex,
});

function AdminIndex() {
	const navigate = useNavigate();
	useEffect(() => {
		void navigate({ to: "/settings", search: { tab: "admin" }, replace: true });
	}, [navigate]);
	return null;
}
