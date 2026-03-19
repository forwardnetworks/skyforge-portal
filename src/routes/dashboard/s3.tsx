import { S3Route } from "@/components/s3-page";
import { createFileRoute } from "@tanstack/react-router";
import { requireAdvancedRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/s3")({
	beforeLoad: async ({ context }) => requireAdvancedRouteAccess(context),
	component: S3Route,
});
