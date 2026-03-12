import { QuickDeployPageContent } from "@/components/quick-deploy-page-content";
import { useQuickDeployPage } from "@/hooks/use-quick-deploy-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/deployments/quick")({
	validateSearch: (search: Record<string, unknown>) => {
		const out: { mode?: string } = {};
		if (typeof search.mode === "string" && search.mode.trim()) {
			out.mode = search.mode.trim();
		}
		return out;
	},
	component: QuickDeployPage,
});

function QuickDeployPage() {
	const { mode } = Route.useSearch();
	const page = useQuickDeployPage({ mode });
	return <QuickDeployPageContent page={page} />;
}
