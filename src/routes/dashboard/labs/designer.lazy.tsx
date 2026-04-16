import { LabDesignerPage } from "@/components/lab-designer-page";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/dashboard/labs/designer")({
	component: LabDesignerRoute,
});

function LabDesignerRoute() {
	const search = Route.useSearch();
	return <LabDesignerPage search={search} />;
}
