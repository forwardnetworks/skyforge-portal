import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { LoginLocalPageContent } from "../components/login-local-page-content";
import {
	getPublicStatusSummary,
	getSession,
	getUIConfig,
	login,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { useStatusSummaryEvents } from "../lib/status-events";

const localLoginSearchSchema = z.object({
	next: z.string().optional().catch("/dashboard"),
});

export const Route = createFileRoute("/login/local")({
	validateSearch: (search) => localLoginSearchSchema.parse(search),
	component: LocalLoginPage,
});

function normalizeNext(nextRaw: string | undefined): string {
	const next = String(nextRaw ?? "").trim();
	if (!next.startsWith("/")) return "/dashboard";
	return next;
}

function LocalLoginPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const search = Route.useSearch();
	const [username, setUsername] = useState("skyforge");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const session = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 10_000,
		retry: false,
	});

	const uiConfig = useQuery({
		queryKey: queryKeys.uiConfig(),
		queryFn: getUIConfig,
		staleTime: 5 * 60_000,
		retry: false,
	});
	const statusSummary = useQuery({
		queryKey: queryKeys.statusSummary(),
		queryFn: getPublicStatusSummary,
		staleTime: 15_000,
		retry: false,
		refetchOnWindowFocus: false,
	});

	useStatusSummaryEvents(true);

	useEffect(() => {
		if (session.isLoading) return;
		if (session.data?.authenticated) {
			void navigate({ to: normalizeNext(search.next), replace: true });
		}
	}, [navigate, search.next, session.data?.authenticated, session.isLoading]);

	const loginM = useMutation({
		mutationFn: async () => {
			setError("");
			return login({ username: username.trim(), password });
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
			void navigate({ to: normalizeNext(search.next), replace: true });
		},
		onError: (e) => {
			setError(e instanceof Error ? e.message : "Login failed");
		},
	});

	return (
		<LoginLocalPageContent
			uiConfig={uiConfig.data}
			statusSummary={statusSummary.data}
			username={username}
			password={password}
			error={error}
			signingIn={loginM.isPending}
			onUsernameChange={setUsername}
			onPasswordChange={setPassword}
			onSubmit={() => loginM.mutate()}
		/>
	);
}
