import { ForwardCredentialsPageContent } from "@/components/forward-credentials-page-content";
import { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { requireCatalogRouteAccess } from "@/lib/ui-experience-route";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/forward/credentials")({
	beforeLoad: ({ context }) =>
		requireCatalogRouteAccess(context, "/dashboard/forward/credentials"),
	component: ForwardCredentialsPage,
});

function ForwardCredentialsPage() {
	const page = useForwardCredentialsPage();
	return <ForwardCredentialsPageContent page={page} />;
}
