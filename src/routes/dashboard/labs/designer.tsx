import { LabDesignerPage } from "@/components/lab-designer-page";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const designerSearchSchema = z.object({
	userId: z.string().optional().catch(""),
	importDeploymentId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/labs/designer")({
	validateSearch: (search) => designerSearchSchema.parse(search),
	component: LabDesignerRoute,
});

function LabDesignerRoute() {
	const search = Route.useSearch();
	return <LabDesignerPage search={search} />;
}
