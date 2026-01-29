import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { queryKeys } from "../lib/query-keys";
import { getSession } from "../lib/skyforge-api";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	const navigate = useNavigate();

	const session = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		retry: false,
		staleTime: 30_000,
	});

	useEffect(() => {
		if (session.isLoading) return;

		if (session.data?.authenticated) {
			void navigate({ to: "/dashboard/deployments", replace: true });
		} else {
			void navigate({ to: "/status", replace: true });
		}
	}, [session.data?.authenticated, session.isLoading, navigate]);

	return null;
}
