import { S3Route } from "@/components/s3-page";
import { createFileRoute } from "@tanstack/react-router";
import { requireCatalogRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/s3")({
	beforeLoad: async ({ context }) =>
		requireCatalogRouteAccess(context, "/dashboard/s3"),
	component: S3Route,
});
