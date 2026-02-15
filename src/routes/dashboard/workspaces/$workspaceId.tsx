import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/workspaces/$workspaceId")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/deployments" });
	},
});
