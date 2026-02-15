import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/dashboard/workspaces/$workspaceId/integrations",
)({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/integrations" });
	},
});
