import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
	"/dashboard/workspaces/$workspaceId/policy-reports",
)({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/policy-reports" });
	},
});
