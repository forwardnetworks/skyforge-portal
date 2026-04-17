import { ObservabilityPage } from "@/components/observability-page";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/dashboard/observability")({
	component: ObservabilityPage,
});
