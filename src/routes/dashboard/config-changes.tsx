import { createFileRoute } from "@tanstack/react-router";
import { ConfigChangesPageContent } from "../../components/config-changes-page-content";
import { useConfigChangesPage } from "../../hooks/use-config-changes-page";
import { requireAdvancedRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/config-changes")({
	beforeLoad: async ({ context }) => requireAdvancedRouteAccess(context),
	component: ConfigChangesPage,
});

function ConfigChangesPage() {
	const page = useConfigChangesPage();
	return <ConfigChangesPageContent page={page} />;
}
