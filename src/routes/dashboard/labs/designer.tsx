import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireCatalogRouteAccess } from "../../../lib/ui-experience-route";

const designerSearchSchema = z.object({
	userId: z.string().optional().catch(""),
	importDeploymentId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/labs/designer")({
	validateSearch: (search) => designerSearchSchema.parse(search),
	beforeLoad: async ({ context }) =>
		requireCatalogRouteAccess(context, "/dashboard/labs/designer"),
});
