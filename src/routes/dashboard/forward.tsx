import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/forward")({
	component: ForwardCollectorLegacyRedirect,
});

function ForwardCollectorLegacyRedirect() {
	return <Navigate to="/dashboard/fwd/collector" replace />;
}
