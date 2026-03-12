import { createFileRoute } from "@tanstack/react-router";
import { DashboardPageContent } from "../../components/dashboard-page-content";
import { useDashboardPage } from "../../hooks/use-dashboard-page";

export const Route = createFileRoute("/dashboard/")({
	component: DashboardRoute,
});

function DashboardRoute() {
	const page = useDashboardPage();
	return <DashboardPageContent page={page} />;
}
