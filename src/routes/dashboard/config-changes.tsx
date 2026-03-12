import { createFileRoute } from "@tanstack/react-router";
import { ConfigChangesPageContent } from "../../components/config-changes-page-content";
import { useConfigChangesPage } from "../../hooks/use-config-changes-page";

export const Route = createFileRoute("/dashboard/config-changes")({
	component: ConfigChangesPage,
});

function ConfigChangesPage() {
	const page = useConfigChangesPage();
	return <ConfigChangesPageContent page={page} />;
}
