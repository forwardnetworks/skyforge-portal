import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
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
	type ForwardCredentialSetSummary,
	type UserForwardCollectorConfigSummary,
	createUserForwardCollectorConfig,
	createUserForwardCredentialSet,
	deleteUserForwardCollectorConfig,
	deleteUserForwardCredentialSet,
	getUserForwardCollectorConfigLogs,
	getUserGitCredentials,
	listUserForwardCollectorConfigs,
	listUserForwardCredentialSets,
	restartUserForwardCollectorConfig,
} from "../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/forward")({
	component: ForwardCollectorPage,
});

type ForwardTarget = "cloud" | "onprem";

function normalizeBaseURL(target: ForwardTarget, onPremHost: string): string {
	if (target === "cloud") return "https://fwd.app";
	const raw = onPremHost.trim();
	if (!raw) return "";
	if (/^https?:\/\//i.test(raw)) return raw;
	return `https://${raw}`;
}

function ForwardCollectorPage() {
	const queryClient = useQueryClient();
	const collectorsKey = queryKeys.userForwardCollectorConfigs();
	const credentialSetsKey = queryKeys.userForwardCredentialSets();

	const collectorsQ = useQuery({
		queryKey: collectorsKey,
		queryFn: listUserForwardCollectorConfigs,
		refetchInterval: 5000,
		staleTime: 10_000,
		retry: false,
	});

	const collectors = useMemo(
		() =>
			(collectorsQ.data?.collectors ??
				[]) as UserForwardCollectorConfigSummary[],
		[collectorsQ.data?.collectors],
	);

	const [showLogsId, setShowLogsId] = useState<string>("");
	const logsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigLogs(showLogsId),
		queryFn: async () => getUserForwardCollectorConfigLogs(showLogsId, 300),
		enabled: !!showLogsId,
		refetchInterval: showLogsId ? 3000 : false,
		retry: false,
	});

	const [target, setTarget] = useState<ForwardTarget>("cloud");
	const [onPremHost, setOnPremHost] = useState("");
	const [skipTlsVerify, setSkipTlsVerify] = useState(true);
	const [collectorName, setCollectorName] = useState("");
	const [collectorNameTouched, setCollectorNameTouched] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [setDefault, setSetDefault] = useState(true);
	const [sourceCredentialSetId, setSourceCredentialSetId] =
		useState<string>("manual");

	const userGitQ = useQuery({
		queryKey: queryKeys.userGitCredentials(),
		queryFn: getUserGitCredentials,
		staleTime: 60_000,
		retry: false,
	});

	useEffect(() => {
		if (target === "cloud") setSkipTlsVerify(false);
		else setSkipTlsVerify(true);
	}, [target]);

	const credentialSetsQ = useQuery({
		queryKey: credentialSetsKey,
		queryFn: listUserForwardCredentialSets,
		staleTime: 30_000,
		retry: false,
	});
	const credentialSets = useMemo(
		() => (credentialSetsQ.data?.credentialSets ?? []) as ForwardCredentialSetSummary[],
		[credentialSetsQ.data?.credentialSets],
	);
	const selectedSourceCredentialSet = useMemo(() => {
		if (sourceCredentialSetId === "manual") return null;
		return (
			credentialSets.find((cs) => String(cs.id) === String(sourceCredentialSetId)) ??
			null
		);
	}, [credentialSets, sourceCredentialSetId]);

	useEffect(() => {
		if (sourceCredentialSetId === "manual") return;
		const cs = selectedSourceCredentialSet;
		if (!cs) return;
		const baseUrl = String(cs.baseUrl ?? "").trim() || "https://fwd.app";
		if (baseUrl === "https://fwd.app" || /fwd\.app\s*$/i.test(baseUrl)) {
			setTarget("cloud");
			setOnPremHost("");
		} else {
			setTarget("onprem");
			try {
				const u = new URL(baseUrl);
				setOnPremHost(u.host);
			} catch {
				setOnPremHost(baseUrl.replace(/^https?:\/\//i, ""));
			}
		}
		setSkipTlsVerify(Boolean(cs.skipTlsVerify));
		setUsername("");
		setPassword("");
	}, [selectedSourceCredentialSet, sourceCredentialSetId]);

	useEffect(() => {
		if (collectorNameTouched) return;
		if (collectorName.trim()) return;
		const u = (userGitQ.data?.username ?? "").trim();
		if (!u) return;
		setCollectorName(`skyforge-${u}`);
	}, [collectorNameTouched, collectorName, userGitQ.data?.username]);

	const createMutation = useMutation({
		mutationFn: async () => {
			const name = collectorName.trim();
			if (!name) throw new Error("Collector name is required");
			const baseUrl =
				selectedSourceCredentialSet?.baseUrl?.trim() ||
				normalizeBaseURL(target, onPremHost);
			if (!baseUrl) throw new Error("Forward URL is required");

			if (sourceCredentialSetId !== "manual") {
				if (!selectedSourceCredentialSet)
					throw new Error("Selected credential set not found");
				if (!selectedSourceCredentialSet.hasPassword)
					throw new Error("Selected credential set has no stored password");
				return createUserForwardCollectorConfig({
					name,
					baseUrl,
					skipTlsVerify: Boolean(selectedSourceCredentialSet.skipTlsVerify),
					username: "",
					password: "",
					setDefault,
					sourceCredentialId: selectedSourceCredentialSet.id,
				});
			}

			if (!username.trim() || !password.trim())
				throw new Error("Forward username/password are required");
			return createUserForwardCollectorConfig({
				name,
				baseUrl,
				skipTlsVerify: target === "onprem" ? skipTlsVerify : false,
				username: username.trim(),
				password,
				setDefault,
			});
		},
		onSuccess: async () => {
			toast.success("Collector created");
			setPassword("");
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (e) =>
			toast.error("Failed to create collector", {
				description: (e as Error).message,
			}),
	});

	const restartMutation = useMutation({
		mutationFn: async (id: string) => restartUserForwardCollectorConfig(id),
		onSuccess: async () => {
			toast.success("Collector restarted");
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (e) =>
			toast.error("Failed to restart collector", {
				description: (e as Error).message,
			}),
	});

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => deleteUserForwardCollectorConfig(id),
		onSuccess: async (_data, id) => {
			toast.success("Collector deleted");
			setShowLogsId("");
			queryClient.setQueryData(collectorsKey, (prev: any) => {
				const prevCollectors = (prev?.collectors ??
					[]) as UserForwardCollectorConfigSummary[];
				return {
					...(prev ?? {}),
					collectors: prevCollectors.filter(
						(c) => String(c?.id ?? "") !== String(id),
					),
				};
			});
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (e) =>
			toast.error("Failed to delete collector", {
				description: (e as Error).message,
			}),
	});

	const deleteAllMutation = useMutation({
		mutationFn: async (ids: string[]) => {
			for (const id of ids) {
				await deleteUserForwardCollectorConfig(id);
			}
		},
		onSuccess: async () => {
			toast.success("Collectors deleted");
			setShowLogsId("");
			queryClient.setQueryData(collectorsKey, (prev: any) => ({
				...(prev ?? {}),
				collectors: [],
			}));
			await queryClient.invalidateQueries({ queryKey: collectorsKey });
		},
		onError: (e) =>
			toast.error("Failed to delete collectors", {
				description: (e as Error).message,
			}),
	});

	// Credential set create/delete
	const [csName, setCsName] = useState("");
	const [csBaseUrl, setCsBaseUrl] = useState("https://fwd.app");
	const [csSkipTlsVerify, setCsSkipTlsVerify] = useState(false);
	const [csUsername, setCsUsername] = useState("");
	const [csPassword, setCsPassword] = useState("");

	const createCredSetMutation = useMutation({
		mutationFn: async () => {
			const name = csName.trim();
			if (!name) throw new Error("Name is required");
			const baseUrl = csBaseUrl.trim();
			if (!baseUrl) throw new Error("Forward URL is required");
			const u = csUsername.trim();
			if (!u) throw new Error("Username is required");
			if (!csPassword.trim()) throw new Error("Password is required");
			return createUserForwardCredentialSet({
				name,
				baseUrl,
				skipTlsVerify: csSkipTlsVerify,
				username: u,
				password: csPassword,
			});
		},
		onSuccess: async () => {
			toast.success("Credential set created");
			setCsPassword("");
			await queryClient.invalidateQueries({ queryKey: credentialSetsKey });
		},
		onError: (e) =>
			toast.error("Failed to create credential set", {
				description: (e as Error).message,
			}),
	});

	const deleteCredSetMutation = useMutation({
		mutationFn: async (id: string) => deleteUserForwardCredentialSet(id),
		onSuccess: async () => {
			toast.success("Credential set deleted");
			await queryClient.invalidateQueries({ queryKey: credentialSetsKey });
		},
		onError: (e) =>
			toast.error("Failed to delete credential set", {
				description: (e as Error).message,
			}),
	});

	return (
		<div className="p-6 space-y-6">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold">Collector</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Create one or more per-user in-cluster Forward collectors. Select a
						collector per deployment.
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Create collector</CardTitle>
					<CardDescription>
						Creates a Forward collector and deploys a matching in-cluster
						Deployment. Deleting here only deletes the in-cluster Deployment and
						the saved credentials; it does not delete the Forward-side
						collector.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Use credential set (optional)</Label>
						<Select
							value={sourceCredentialSetId}
							onValueChange={setSourceCredentialSetId}
						>
							<SelectTrigger>
								<SelectValue placeholder="Manual" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="manual">Manual (enter username/password)</SelectItem>
								{credentialSets.map((cs) => (
									<SelectItem key={cs.id} value={cs.id}>
										{cs.name}
										{cs.username ? ` (${cs.username})` : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{sourceCredentialSetId !== "manual" ? (
							<p className="text-xs text-muted-foreground">
								Skyforge will use the selected credential set to create the Forward
								collector, and will save a separate credential set for the created
								collector.
							</p>
						) : null}
						{credentialSetsQ.isError ? (
							<p className="text-xs text-destructive">
								Failed to load credential sets:{" "}
								{(credentialSetsQ.error as Error).message}
							</p>
						) : null}
					</div>

					<div className="space-y-2">
						<Label>Collector name</Label>
						<Input
							value={collectorName}
							onChange={(e) => {
								setCollectorNameTouched(true);
								setCollectorName(e.target.value);
							}}
							placeholder="skyforge-yourname"
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Forward target</Label>
							<Select
								value={target}
								onValueChange={(v) => setTarget(v as ForwardTarget)}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="cloud">fwd.app (cloud)</SelectItem>
									<SelectItem value="onprem">on-prem</SelectItem>
								</SelectContent>
							</Select>
						</div>
						{target === "onprem" ? (
							<div className="space-y-2">
								<Label>On-prem host</Label>
								<Input
									value={onPremHost}
									onChange={(e) => setOnPremHost(e.target.value)}
									placeholder="forward.example.com (:port)"
									disabled={sourceCredentialSetId !== "manual"}
								/>
							</div>
						) : null}
					</div>

					{target === "onprem" ? (
						<div className="flex items-center gap-2">
							<Checkbox
								checked={skipTlsVerify}
								onCheckedChange={(v) => setSkipTlsVerify(Boolean(v))}
								disabled={sourceCredentialSetId !== "manual"}
							/>
							<Label className="text-sm">Skip TLS verification</Label>
						</div>
					) : null}

					{sourceCredentialSetId === "manual" ? (
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Forward username</Label>
								<Input
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									placeholder="you@company.com"
								/>
							</div>
							<div className="space-y-2">
								<Label>Forward password</Label>
								<Input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
								/>
							</div>
						</div>
					) : (
						<div className="text-sm text-muted-foreground">
							Using{" "}
							<span className="font-mono">
								{selectedSourceCredentialSet?.username ?? "(unknown user)"}
							</span>{" "}
							from the selected credential set.
						</div>
					)}

					<div className="flex items-center gap-2">
						<Checkbox
							checked={setDefault}
							onCheckedChange={(v) => setSetDefault(Boolean(v))}
						/>
						<Label className="text-sm">Make default</Label>
					</div>

					<Button
						onClick={() => createMutation.mutate()}
						disabled={
							createMutation.isPending ||
							(sourceCredentialSetId !== "manual" &&
								(!selectedSourceCredentialSet ||
									!selectedSourceCredentialSet.hasPassword))
						}
					>
						{createMutation.isPending ? "Creating…" : "Create"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Credential sets</CardTitle>
					<CardDescription>
						Reusable Forward API credential sets. Stored encrypted. Use them for
						Policy Reports, collector creation, and other Forward-backed features.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Name</Label>
							<Input
								value={csName}
								onChange={(e) => setCsName(e.target.value)}
								placeholder="demo-forward"
							/>
						</div>
						<div className="space-y-2">
							<Label>Forward URL</Label>
							<Input
								value={csBaseUrl}
								onChange={(e) => setCsBaseUrl(e.target.value)}
								placeholder="https://fwd.app"
							/>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							checked={csSkipTlsVerify}
							onCheckedChange={(v) => setCsSkipTlsVerify(Boolean(v))}
						/>
						<Label className="text-sm">Skip TLS verification</Label>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Forward username</Label>
							<Input
								value={csUsername}
								onChange={(e) => setCsUsername(e.target.value)}
								placeholder="you@company.com"
							/>
						</div>
						<div className="space-y-2">
							<Label>Forward password</Label>
							<Input
								type="password"
								value={csPassword}
								onChange={(e) => setCsPassword(e.target.value)}
								placeholder="••••••••"
							/>
						</div>
					</div>

					<Button
						onClick={() => createCredSetMutation.mutate()}
						disabled={createCredSetMutation.isPending}
					>
						{createCredSetMutation.isPending ? "Creating…" : "Create credential set"}
					</Button>

					<div className="space-y-2 pt-2">
						<div className="text-sm font-medium">Saved credential sets</div>
						{credentialSetsQ.isLoading ? (
							<div className="text-sm text-muted-foreground">Loading…</div>
						) : null}
						{credentialSetsQ.isError ? (
							<div className="text-sm text-destructive">
								Failed to load credential sets.
							</div>
						) : credentialSets.length === 0 ? (
							<div className="text-sm text-muted-foreground">
								No credential sets saved yet.
							</div>
						) : null}

						{credentialSets.map((cs) => (
							<div
								key={cs.id}
								className="rounded-md border p-3 flex items-start justify-between gap-3"
							>
								<div className="min-w-0">
									<div className="font-medium truncate">{cs.name}</div>
									<div className="text-xs text-muted-foreground">
										<span className="font-mono">{cs.username ?? ""}</span>
										{cs.baseUrl ? (
											<>
												{" "}
												{"·"} <span className="font-mono">{cs.baseUrl}</span>
											</>
										) : null}
									</div>
									<div className="text-xs text-muted-foreground font-mono truncate">
										{cs.id}
									</div>
								</div>
								<div className="flex items-center gap-2">
									{cs.hasPassword ? (
										<Badge variant="secondary">stored</Badge>
									) : (
										<Badge variant="destructive">missing</Badge>
									)}
									<Button
										variant="destructive"
										size="sm"
										onClick={() => {
											if (!confirm(`Delete credential set "${cs.name}"?`)) return;
											deleteCredSetMutation.mutate(cs.id);
										}}
										disabled={deleteCredSetMutation.isPending}
									>
										Delete
									</Button>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-4">
						<CardTitle>Configured collectors</CardTitle>
						{collectors.length > 0 ? (
							<Button
								variant="destructive"
								size="sm"
								disabled={deleteAllMutation.isPending}
								onClick={() => {
									const ids = collectors
										.map((c) => String(c.id))
										.filter(Boolean);
									if (ids.length === 0) return;
									if (
										!confirm(
											`Delete ${ids.length} collector(s)? This removes in-cluster Deployments and saved credentials.`,
										)
									)
										return;
									deleteAllMutation.mutate(ids);
								}}
							>
								{deleteAllMutation.isPending ? "Deleting…" : "Delete all"}
							</Button>
						) : null}
					</div>
					<CardDescription>
						Each entry maps to one in-cluster Deployment and one Forward
						collector.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{collectorsQ.isLoading ? (
						<div className="text-sm text-muted-foreground">Loading…</div>
					) : null}
					{collectorsQ.isError ? (
						<div className="text-sm text-destructive">
							Failed to load collectors.
						</div>
					) : collectors.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No collectors configured yet.
						</div>
					) : null}

					{collectors.map((c) => {
						const ready = Boolean(c.runtime?.ready);
						const connected =
							typeof c.forwardCollector?.connected === "boolean"
								? c.forwardCollector.connected
								: undefined;

						return (
							<div key={c.id} className="rounded-md border p-3 space-y-2">
								<div className="flex items-center justify-between gap-2">
									<div className="min-w-0">
										<div className="flex items-center gap-2 min-w-0">
											<div className="font-medium truncate">{c.name}</div>
											{c.isDefault ? (
												<Badge variant="secondary">default</Badge>
											) : null}
											{c.decryptionFailed ? (
												<Badge variant="destructive">re-save creds</Badge>
											) : null}
										</div>
										<div className="text-xs text-muted-foreground font-mono truncate">
											{c.id}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setShowLogsId((prev) => (prev === c.id ? "" : c.id))
											}
										>
											{showLogsId === c.id ? "Hide logs" : "Logs"}
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => restartMutation.mutate(c.id)}
											disabled={restartMutation.isPending}
										>
											Restart
										</Button>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => {
												if (!confirm(`Delete collector "${c.name}"?`)) return;
												deleteMutation.mutate(c.id);
											}}
											disabled={deleteMutation.isPending}
										>
											Delete
										</Button>
									</div>
								</div>

								<div className="text-sm">
									Status:{" "}
									<span
										className={
											ready ? "text-emerald-600" : "text-muted-foreground"
										}
									>
										{ready ? "Running" : "Starting…"}
									</span>
								</div>
								<div className="text-sm">
									Forward:{" "}
									{typeof connected === "boolean" ? (
										<span
											className={
												connected ? "text-emerald-600" : "text-muted-foreground"
											}
										>
											{connected ? "Connected" : "Not connected"}
										</span>
									) : (
										<span className="text-muted-foreground">Unknown</span>
									)}
								</div>

								{c.forwardCollector?.version ? (
									<div className="text-xs text-muted-foreground">
										Version:{" "}
										<span className="font-mono">
											{String(c.forwardCollector.version)}
										</span>
									</div>
								) : null}
								{c.forwardCollector?.updateStatus ? (
									<div className="text-xs text-muted-foreground">
										Update:{" "}
										<span className="font-mono">
											{String(c.forwardCollector.updateStatus)}
										</span>
									</div>
								) : null}
								{c.forwardCollector?.externalIp ? (
									<div className="text-xs text-muted-foreground">
										External IP:{" "}
										<span className="font-mono">
											{String(c.forwardCollector.externalIp)}
										</span>
									</div>
								) : null}
								{Array.isArray(c.forwardCollector?.internalIps) &&
								(c.forwardCollector?.internalIps ?? []).length > 0 ? (
									<div className="text-xs text-muted-foreground">
										Internal IPs:{" "}
										<span className="font-mono">
											{(c.forwardCollector?.internalIps ?? [])
												.filter(Boolean)
												.join(", ")}
										</span>
									</div>
								) : null}
								{c.runtime?.podName ? (
									<div className="text-xs text-muted-foreground">
										Pod:{" "}
										<span className="font-mono">
											{String(c.runtime.podName)}
										</span>{" "}
										({String(c.runtime.podPhase ?? "")})
									</div>
								) : null}

								{showLogsId === c.id ? (
									<pre className="bg-muted p-3 rounded-md overflow-auto font-mono text-xs whitespace-pre-wrap">
										{logsQ.isLoading
											? "Loading…"
											: (logsQ.data?.logs ?? "").trim() || "No logs yet."}
									</pre>
								) : null}
							</div>
						);
					})}
				</CardContent>
			</Card>
		</div>
	);
}
