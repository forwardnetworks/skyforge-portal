import { createFileRoute } from "@tanstack/react-router";
import { ServiceNowPageContent } from "../../components/servicenow-page-content";
import { useServiceNowPage } from "../../hooks/use-servicenow-page";

export const Route = createFileRoute("/dashboard/servicenow")({
	component: ServiceNowPage,
});

function ServiceNowPage() {
	const page = useServiceNowPage();
	return <ServiceNowPageContent page={page} />;
}
