import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings")({
	beforeLoad: () => {
		throw redirect({ to: "/settings", search: { section: "profile" } });
	},
	component: RedirectedDashboardSettingsPage,
});

function RedirectedDashboardSettingsPage() {
	return null;
}
