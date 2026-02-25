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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import { queryKeys } from "../../lib/query-keys";
import {
	createUserForwardCollectorConfig,
	deleteUserForwardCollectorConfig,
	listUserForwardCollectorConfigs,
} from "../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/forward/credentials")({
	component: ForwardCredentialsPage,
});

type ForwardCredentialTarget = "fwd_app" | "in_cluster_org" | "custom_onprem";

const FORWARD_FWD_APP = "https://fwd.app";
const FORWARD_IN_CLUSTER_ORG =
	"http://fwd-appserver.forward.svc.cluster.local:8080";

function normalizeBaseURL(
	target: ForwardCredentialTarget,
	customHost: string,
): string {
	if (target === "fwd_app") return FORWARD_FWD_APP;
	if (target === "in_cluster_org") return FORWARD_IN_CLUSTER_ORG;
	const raw = customHost.trim();
	if (!raw) return "";
	if (/^https?:\/\//i.test(raw)) return raw;
	return `https://${raw}`;
}

function stripProtocol(value: string): string {
	return value.replace(/^https?:\/\//i, "");
}

function ForwardCredentialsPage() {
	const queryClient = useQueryClient();
	const collectorsKey = queryKeys.userForwardCollectorConfigs();
	const collectorsQ = useQuery({
		queryKey: collectorsKey,
		queryFn: listUserForwardCollectorConfigs,
		staleTime: 10_000,
	});

	const [target, setTarget] = useState<ForwardCredentialTarget>("fwd_app");
	const [customHost, setCustomHost] = useState("");
	const [skipTlsVerify, setSkipTlsVerify] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const tlsCheckboxDisabled = target !== "custom_onprem";
	const effectiveSkipTlsVerify =
		target === "in_cluster_org"
			? true
			: target === "fwd_app"
				? false
				: skipTlsVerify;

	const credentialSets = useMemo(
		() => collectorsQ.data?.collectors ?? [],
		[collectorsQ.data?.collectors],
	);

	const createMutation = useMutation({
		mutationFn: async () => {
			const baseUrl = normalizeBaseURL(target, customHost);
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
		<div className="mx-auto w-full max-w-3xl space-y-6 p-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">
					Forward Credentials
				</h1>
				<p className="text-sm text-muted-foreground">
					Create and remove saved Forward credential sets.
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
						<div className="space-y-2">
							<Label>Target</Label>
							<Select
								value={target}
								onValueChange={(v) => {
									const next = v as ForwardCredentialTarget;
									setTarget(next);
									if (next === "in_cluster_org") {
										setSkipTlsVerify(true);
										return;
									}
									if (next === "fwd_app") {
										setSkipTlsVerify(false);
									}
								}}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="fwd_app">fwd.app</SelectItem>
									<SelectItem value="in_cluster_org">
										in-cluster credential org
									</SelectItem>
									<SelectItem value="custom_onprem">custom on-prem</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{target === "custom_onprem" ? (
							<div className="space-y-2">
								<Label>Host</Label>
								<Input
									value={customHost}
									onChange={(e) => setCustomHost(e.target.value)}
									placeholder="https://forward.example.com"
								/>
							</div>
						) : (
							<div className="space-y-2">
								<Label>Host</Label>
								<Input
									value={normalizeBaseURL(target, customHost)}
									readOnly
									disabled
								/>
							</div>
						)}
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							checked={effectiveSkipTlsVerify}
							onCheckedChange={(v) => setSkipTlsVerify(Boolean(v))}
							disabled={tlsCheckboxDisabled}
						/>
						<Label className="text-sm">
							Disable TLS verification
							{target === "in_cluster_org"
								? " (required for in-cluster endpoint)"
								: target === "fwd_app"
									? " (always off for fwd.app)"
									: ""}
						</Label>
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
								</div>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => deleteMutation.mutate(String(c.id))}
									disabled={deleteMutation.isPending}
								>
									Delete
								</Button>
							</div>
						);
					})}
				</CardContent>
			</Card>
		</div>
	);
}
