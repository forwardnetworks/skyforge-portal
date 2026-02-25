import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/forward")({
	component: ForwardLayout,
});

function ForwardLayout() {
	return <Outlet />;
}
