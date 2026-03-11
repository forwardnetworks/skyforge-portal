import { RunDetailPageContent } from "@/components/runs/run-detail-page-content";
import { useRunDetailPage } from "@/hooks/use-run-detail-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/runs/$runId")({
	component: RunDetailRoute,
});

function RunDetailRoute() {
	const { runId } = Route.useParams();
	const page = useRunDetailPage({ runId });

	return <RunDetailPageContent page={page} />;
}
