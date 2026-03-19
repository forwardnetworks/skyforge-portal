import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { requireAdminRouteAccess } from "../../lib/admin-route";
import { requireAdvancedRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/admin/")({
	beforeLoad: async ({ context }) => {
		await requireAdvancedRouteAccess(context);
		return requireAdminRouteAccess(context);
	},
	component: AdminIndex,
});

function AdminIndex() {
	const navigate = useNavigate();
	useEffect(() => {
		void navigate({ to: "/settings", search: { tab: "admin" }, replace: true });
	}, [navigate]);
	return null;
}
