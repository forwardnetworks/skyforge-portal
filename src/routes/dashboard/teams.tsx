import { createFileRoute } from "@tanstack/react-router";
import { TeamsPageContent } from "../../components/teams-page-content";
import { useTeamsPage } from "../../hooks/use-teams-page";

export const Route = createFileRoute("/dashboard/teams")({
	component: TeamsPage,
});

function TeamsPage() {
	const page = useTeamsPage();
	return <TeamsPageContent page={page} />;
}
