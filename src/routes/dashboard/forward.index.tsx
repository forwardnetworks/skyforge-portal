import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/forward/")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/forward/collectors" });
	},
});
