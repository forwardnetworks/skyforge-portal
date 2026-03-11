import { createFileRoute } from "@tanstack/react-router";
import { ForwardCollectorsPageContent } from "../../components/forward-collectors-page-content";
import { useForwardCollectorsPage } from "../../hooks/use-forward-collectors-page";

export const Route = createFileRoute("/dashboard/forward/collectors")({
	component: ForwardCollectorPage,
});

function ForwardCollectorPage() {
	const page = useForwardCollectorsPage();
	return <ForwardCollectorsPageContent page={page} />;
}
