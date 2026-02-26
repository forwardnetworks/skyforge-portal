import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/deployments/executive")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/deployments/quick" });
	},
	component: () => null,
});
