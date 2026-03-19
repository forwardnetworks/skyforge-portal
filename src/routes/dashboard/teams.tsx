import { createFileRoute } from "@tanstack/react-router";
import { TeamsPageContent } from "../../components/teams-page-content";
import { useTeamsPage } from "../../hooks/use-teams-page";
import { requireAdvancedRouteAccess } from "../../lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/teams")({
	beforeLoad: async ({ context }) => requireAdvancedRouteAccess(context),
	component: TeamsPage,
});

function TeamsPage() {
	const page = useTeamsPage();
	return <TeamsPageContent page={page} />;
}
