import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
	createUserForwardCollectorConfig,
	deleteUserForwardCollectorConfig,
	listUserForwardCollectorConfigs,
} from "../../lib/api-client";
import { queryKeys } from "../../lib/query-keys";

export const Route = createFileRoute("/dashboard/forward/credentials")({
	component: ForwardCredentialsPage,
});

type ForwardCredentialTarget = "in_cluster_org" | "custom_onprem";

const FORWARD_IN_CLUSTER_ORG =
	"https://fwd-appserver.forward.svc.cluster.local";

function normalizeBaseURL(
	target: ForwardCredentialTarget,
	customHost: string,
): string {
	if (target === "in_cluster_org") return FORWARD_IN_CLUSTER_ORG;
	const raw = customHost.trim();
	if (!raw) return "";
	if (/^https?:\/\//i.test(raw)) return raw;
	return `https://${raw}`;
}

function stripProtocol(value: string): string {
	return value.replace(/^https?:\/\//i, "");
}

function isInClusterCollectorBaseURL(value: string): boolean {
	return (
		stripProtocol(value).replace(/\/+$/, "").toLowerCase() ===
		stripProtocol(FORWARD_IN_CLUSTER_ORG).toLowerCase()
	);
}

function ForwardCredentialsPage() {
	const queryClient = useQueryClient();
	const collectorsKey = queryKeys.userForwardCollectorConfigs();
	const collectorsQ = useQuery({
		queryKey: collectorsKey,
		queryFn: listUserForwardCollectorConfigs,
		staleTime: 10_000,
	});

	const [customHost, setCustomHost] = useState("");
	const [skipTlsVerify, setSkipTlsVerify] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const tlsCheckboxDisabled = false;
	const effectiveSkipTlsVerify = skipTlsVerify;

	const credentialSets = useMemo(
		() => collectorsQ.data?.collectors ?? [],
		[collectorsQ.data?.collectors],
	);
	const createMutation = useMutation({
		mutationFn: async () => {
			const baseUrl = normalizeBaseURL("custom_onprem", customHost);
			if (!baseUrl) throw new Error("Host is required for custom on-prem");
			if (!username.trim()) throw new Error("Username is required");
			if (!password.trim()) throw new Error("Password is required");
			const hostKey = stripProtocol(baseUrl).replace(/\/+$/, "");
			const displayName = `${username.trim()}@${hostKey}`;
			return createUserForwardCollectorConfig({
				name: displayName,
				baseUrl,
				skipTlsVerify: effectiveSkipTlsVerify,
				username: username.trim(),
				password,
				setDefault: false,
			});
		},
		onSuccess: async () => {
			toast.success("Forward credential set saved");
			setPassword("");
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (err) =>
			toast.error("Failed to save credential set", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => deleteUserForwardCollectorConfig(id),
		onSuccess: async () => {
			toast.success("Credential set deleted");
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (err) =>
			toast.error("Failed to delete credential set", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	return (
		<div className="w-full space-y-6 p-4 sm:p-6 xl:p-8">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">
					Forward Credentials
				</h1>
				<p className="text-sm text-muted-foreground">
					In-cluster Forward credentials are managed automatically. Add custom
					on-prem credential sets here when needed.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Add Credential Set</CardTitle>
					<CardDescription>
						Choose the target host, provide username/password, and save.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2 md:col-span-2">
							<Label>Host</Label>
							<Input
								value={customHost}
								onChange={(e) => setCustomHost(e.target.value)}
								placeholder="https://forward.example.com"
							/>
						</div>
						</div>

					<div className="flex items-center gap-2">
						<Checkbox
							checked={effectiveSkipTlsVerify}
							onCheckedChange={(v) => setSkipTlsVerify(Boolean(v))}
							disabled={tlsCheckboxDisabled}
						/>
						<Label className="text-sm">Disable TLS verification</Label>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Username</Label>
							<Input
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								placeholder="you@example.com"
							/>
						</div>
						<div className="space-y-2">
							<Label>Password</Label>
							<Input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
							/>
						</div>
					</div>

					<Button
						onClick={() => createMutation.mutate()}
						disabled={createMutation.isPending}
					>
						{createMutation.isPending ? "Saving…" : "Save credential set"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Saved Credential Sets</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{collectorsQ.isLoading ? (
						<div className="text-sm text-muted-foreground">Loading…</div>
					) : null}
					{collectorsQ.isError ? (
						<div className="text-sm text-destructive">
							Failed to load credential sets.
						</div>
					) : null}
					{!collectorsQ.isLoading && credentialSets.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No credential sets saved.
						</div>
					) : null}

					{credentialSets.map((c) => {
						const inClusterManaged = isInClusterCollectorBaseURL((c.baseUrl || "").trim());
						const key =
							`${(c.username || "").trim()}@${stripProtocol((c.baseUrl || "").trim())}`.replace(
								/@$/,
								"",
							);
						return (
							<div
								key={c.id}
								className="flex items-center justify-between gap-3 rounded border p-3"
							>
								<div className="min-w-0">
									<div className="truncate text-sm font-medium">
										{key || c.name || c.id}
									</div>
									<div className="truncate font-mono text-xs text-muted-foreground">
										{c.baseUrl}
									</div>
									{inClusterManaged ? (
										<div className="text-xs text-muted-foreground">
											Managed automatically from your Forward tenant API token.
										</div>
									) : null}
								</div>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => deleteMutation.mutate(String(c.id))}
									disabled={deleteMutation.isPending || inClusterManaged}
								>
									{inClusterManaged ? "Managed" : "Delete"}
								</Button>
							</div>
						);
					})}
				</CardContent>
			</Card>
		</div>
	);
}
