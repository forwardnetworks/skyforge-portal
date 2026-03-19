import { createFileRoute } from "@tanstack/react-router";
import { PlatformCapacityPageContent } from "../../components/platform-capacity-page-content";
import { usePlatformCapacityPage } from "../../hooks/use-platform-capacity-page";
import { requireAdminRouteAccess } from "../../lib/admin-route";
import { requireAdvancedRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/platform")({
	beforeLoad: async ({ context }) => {
		await requireAdvancedRouteAccess(context);
		await requireAdminRouteAccess(context);
	},
	component: PlatformCapacityPage,
});

function PlatformCapacityPage() {
	const page = usePlatformCapacityPage();
	return <PlatformCapacityPageContent page={page} />;
}
