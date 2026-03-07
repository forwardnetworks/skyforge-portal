import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { getSession, login } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

const localLoginSearchSchema = z.object({
	next: z.string().optional().catch("/"),
});

export const Route = createFileRoute("/login/local")({
	validateSearch: (search) => localLoginSearchSchema.parse(search),
	component: LocalLoginPage,
});

function normalizeNext(nextRaw: string | undefined): string {
	const next = String(nextRaw ?? "").trim();
	if (!next.startsWith("/")) return "/";
	return next;
}

function LocalLoginPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const search = Route.useSearch();
	const [username, setUsername] = useState("skyforge");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 10_000,
		retry: false,
	});

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
		<div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center px-4">
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Emergency Local Login</CardTitle>
					<CardDescription>
						Use this only when external login is unavailable.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<Input
						placeholder="Username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						disabled={loginM.isPending}
					/>
					<Input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						disabled={loginM.isPending}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								loginM.mutate();
							}
						}}
					/>
					{error ? (
						<div className="text-sm text-destructive">{error}</div>
					) : null}
					<Button
						className="w-full"
						disabled={loginM.isPending || username.trim() === "" || password === ""}
						onClick={() => loginM.mutate()}
					>
						{loginM.isPending ? "Signing in..." : "Sign in"}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

