import { DeploymentsPageContent } from "@/components/deployments/deployments-page-content";
import { useDeploymentsPage } from "@/hooks/use-deployments-page";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/dashboard/deployments/")({
	component: DeploymentsPage,
});

function DeploymentsPage() {
	const { userId } = Route.useSearch();
	const state = useDeploymentsPage(userId);
	return <DeploymentsPageContent state={state} />;
}
