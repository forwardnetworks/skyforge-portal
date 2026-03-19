import { createFileRoute } from "@tanstack/react-router";
import { ServiceNowPageContent } from "../../components/servicenow-page-content";
import { useServiceNowPage } from "../../hooks/use-servicenow-page";
import { requireAdvancedRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/servicenow")({
	beforeLoad: async ({ context }) => requireAdvancedRouteAccess(context),
	component: ServiceNowPage,
});

function ServiceNowPage() {
	const page = useServiceNowPage();
	return <ServiceNowPageContent page={page} />;
}
