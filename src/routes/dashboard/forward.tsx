import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
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
	deleteUserForwardCollectorConfig,
	getUserForwardCollectorConfigLogs,
	getUserGitCredentials,
	listUserForwardCollectorConfigs,
	listUserForwardCredentialSets,
	restartUserForwardCollectorConfig,
} from "../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/forward")({
	component: ForwardCollectorPage,
});

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

	const [collectorName, setCollectorName] = useState("");
	const [collectorNameTouched, setCollectorNameTouched] = useState(false);
	const [setDefault, setSetDefault] = useState(true);
	const [sourceCredentialSetId, setSourceCredentialSetId] =
		useState<string>("");

	const userGitQ = useQuery({
		queryKey: queryKeys.userGitCredentials(),
		queryFn: getUserGitCredentials,
		staleTime: 60_000,
		retry: false,
	});

	const credentialSetsQ = useQuery({
		queryKey: credentialSetsKey,
		queryFn: listUserForwardCredentialSets,
		staleTime: 30_000,
		retry: false,
	});
	const credentialSets = useMemo(
		() =>
			(credentialSetsQ.data?.credentialSets ??
				[]) as ForwardCredentialSetSummary[],
		[credentialSetsQ.data?.credentialSets],
	);

	useEffect(() => {
		if (sourceCredentialSetId) return;
		if (credentialSets.length === 0) return;
		setSourceCredentialSetId(String(credentialSets[0]?.id ?? ""));
	}, [sourceCredentialSetId, credentialSets]);

	const selectedSourceCredentialSet = useMemo(() => {
		if (!sourceCredentialSetId) return null;
		return (
			credentialSets.find(
				(cs) => String(cs.id) === String(sourceCredentialSetId),
			) ?? null
		);
	}, [credentialSets, sourceCredentialSetId]);

	useEffect(() => {
		const cs = selectedSourceCredentialSet;
		if (!cs) return;
	}, [selectedSourceCredentialSet]);

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
			if (!selectedSourceCredentialSet)
				throw new Error("Select a credential set in Settings");
			if (!selectedSourceCredentialSet.hasPassword)
				throw new Error("Selected credential set has no stored password");

			const baseUrl =
				String(selectedSourceCredentialSet?.baseUrl ?? "").trim() ||
				"https://fwd.app";
			if (!baseUrl) throw new Error("Forward URL is required");

			return createUserForwardCollectorConfig({
				name,
				baseUrl,
				skipTlsVerify: Boolean(selectedSourceCredentialSet.skipTlsVerify),
				username: "",
				password: "",
				setDefault,
				sourceCredentialId: selectedSourceCredentialSet.id,
			});
		},
		onSuccess: async () => {
			toast.success("Collector created");
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
						<Label>Credential set</Label>
						<Select
							value={sourceCredentialSetId || "__none__"}
							onValueChange={(v) =>
								setSourceCredentialSetId(v === "__none__" ? "" : v)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a credential set" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">(Select)</SelectItem>
								{credentialSets.map((cs) => (
									<SelectItem key={cs.id} value={cs.id}>
										{cs.name}
										{cs.username ? ` (${cs.username})` : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className="text-xs text-muted-foreground">
							Manage credential sets in{" "}
							<Link
								className="underline"
								to="/dashboard/settings"
								hash="forward-account"
							>
								Settings
							</Link>
							.
						</div>
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
							!selectedSourceCredentialSet ||
							!selectedSourceCredentialSet.hasPassword
						}
					>
						{createMutation.isPending ? "Creating…" : "Create"}
					</Button>
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
