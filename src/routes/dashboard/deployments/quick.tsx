import { QuickDeployPageContent } from "@/components/quick-deploy-page-content";
import { useQuickDeployPage } from "@/hooks/use-quick-deploy-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/deployments/quick")({
	component: QuickDeployPage,
});

function QuickDeployPage() {
	const page = useQuickDeployPage();
	return <QuickDeployPageContent page={page} />;
}
