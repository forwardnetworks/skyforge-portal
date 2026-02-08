import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
	ArrowLeft,
	Database,
	ExternalLink,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import {
	type PutUserElasticConfigRequest,
	clearUserElasticConfig,
	getElasticToolsStatus,
	getUserElasticConfig,
	putUserElasticConfig,
	testUserElasticConfig,
	wakeElasticTools,
} from "@/lib/skyforge-api";

export const Route = createFileRoute("/dashboard/elastic")({
	component: ElasticIntegrationPage,
});

type AuthType = "none" | "api_key" | "basic";

function findSvc(
	st: Awaited<ReturnType<typeof getElasticToolsStatus>> | undefined,
	id: string,
) {
	return st?.services?.find((s) => String(s.id) === id);
}

function isAsleep(
	st: Awaited<ReturnType<typeof getElasticToolsStatus>> | undefined,
) {
	const es = findSvc(st, "elasticsearch");
	const kb = findSvc(st, "kibana");
	return (es?.desiredReplicas ?? 0) === 0 && (kb?.desiredReplicas ?? 0) === 0;
}

function isElasticsearchReady(
	st: Awaited<ReturnType<typeof getElasticToolsStatus>> | undefined,
) {
	const es = findSvc(st, "elasticsearch");
	return (es?.desiredReplicas ?? 0) > 0 && (es?.availableReplicas ?? 0) > 0;
}

function ElasticIntegrationPage() {
	const qc = useQueryClient();

	const cfgQ = useQuery({
		queryKey: queryKeys.userElasticConfig(),
		queryFn: getUserElasticConfig,
		retry: false,
		staleTime: 10_000,
	});

	const initial = cfgQ.data;
	const enabled = initial?.enabled ?? false;
	const defaultUrl = initial?.defaultUrl ?? "";
	const defaultIndexPrefix = initial?.defaultIndexPrefix ?? "";

	const toolsQ = useQuery({
		queryKey: queryKeys.elasticToolsStatus(),
		queryFn: getElasticToolsStatus,
		retry: false,
		staleTime: 5_000,
		enabled,
	});

	const [url, setUrl] = useState("");
	const [indexPrefix, setIndexPrefix] = useState("");
	const [authType, setAuthType] = useState<AuthType>("none");
	const [apiKey, setApiKey] = useState("");
	const [basicUsername, setBasicUsername] = useState("");
	const [basicPassword, setBasicPassword] = useState("");
	const [wakeAttempted, setWakeAttempted] = useState(false);

	useEffect(() => {
		if (!initial) return;
		setUrl(initial.url ?? initial.defaultUrl ?? "");
		setIndexPrefix(initial.indexPrefix ?? initial.defaultIndexPrefix ?? "");
		const at = String(initial.authType ?? "none").toLowerCase();
		setAuthType(at === "basic" || at === "api_key" ? (at as AuthType) : "none");
		setBasicUsername(initial.basicUsername ?? "");
		// Never hydrate secrets into the browser.
		setApiKey("");
		setBasicPassword("");
	}, [initial]);

	const savePayload = useMemo((): PutUserElasticConfigRequest => {
		return {
			url,
			indexPrefix,
			authType,
			apiKey,
			basicUsername,
			basicPassword,
			verifyTls: true,
		};
	}, [apiKey, authType, basicPassword, basicUsername, indexPrefix, url]);

	const canSave = useMemo(() => {
		// Allow leaving URL blank if the instance default is set.
		if (!url.trim() && !defaultUrl.trim()) return false;
		// Allow leaving indexPrefix blank if the instance default is set.
		if (!indexPrefix.trim() && !defaultIndexPrefix.trim()) return false;
		if (authType === "api_key" && !apiKey.trim() && !initial?.hasApiKey)
			return false;
		if (authType === "basic" && !basicUsername.trim()) return false;
		if (
			authType === "basic" &&
			!basicPassword.trim() &&
			!initial?.hasBasicPassword
		)
			return false;
		return true;
	}, [
		apiKey,
		authType,
		basicPassword,
		basicUsername,
		defaultIndexPrefix,
		defaultUrl,
		indexPrefix,
		initial,
		url,
	]);

	const wake = useMutation({
		mutationFn: async () => wakeElasticTools(),
		onSuccess: async () => {
			await qc.invalidateQueries({ queryKey: queryKeys.elasticToolsStatus() });
		},
	});

	const ensureAwake = async () => {
		let st: Awaited<ReturnType<typeof getElasticToolsStatus>> | undefined;
		try {
			st = await getElasticToolsStatus();
		} catch {
			return;
		}
		if (!st?.autosleepEnabled) return;
		if (!isAsleep(st)) return;

		try {
			await wakeElasticTools();
		} catch {
			return;
		}

		const deadline = Date.now() + 60_000;
		while (Date.now() < deadline) {
			try {
				const cur = await getElasticToolsStatus();
				if (!isAsleep(cur) && isElasticsearchReady(cur)) return;
			} catch {
				// ignore
			}
			await new Promise((r) => setTimeout(r, 2000));
		}
	};

	const save = useMutation({
		mutationFn: async () => putUserElasticConfig(savePayload),
		onSuccess: async () => {
			toast.success("Elastic config saved");
			await qc.invalidateQueries({ queryKey: queryKeys.userElasticConfig() });
		},
		onError: (e) =>
			toast.error("Failed to save Elastic config", {
				description: (e as Error).message,
			}),
	});

	const clear = useMutation({
		mutationFn: async () => clearUserElasticConfig(),
		onSuccess: async () => {
			toast.success("Elastic config cleared");
			await qc.invalidateQueries({ queryKey: queryKeys.userElasticConfig() });
		},
		onError: (e) =>
			toast.error("Failed to clear Elastic config", {
				description: (e as Error).message,
			}),
	});

	const test = useMutation({
		mutationFn: async () => {
			await ensureAwake();
			return testUserElasticConfig();
		},
		onSuccess: (resp) => {
			if (String(resp.status).toLowerCase() === "ok") {
				toast.success("Elastic reachable");
			} else {
				toast.error("Elastic test failed", {
					description: resp.detail ?? "unknown error",
				});
			}
		},
		onError: (e) =>
			toast.error("Failed to test Elastic", {
				description: (e as Error).message,
			}),
	});

	// Page visit should wake tools when autosleep is enabled.
	useEffect(() => {
		if (!enabled) return;
		if (!toolsQ.data?.autosleepEnabled) return;
		if (!isAsleep(toolsQ.data)) return;
		if (wake.isPending || wakeAttempted) return;
		setWakeAttempted(true);
		wake.mutate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled, toolsQ.data, wakeAttempted]);

	return (
		<div className="space-y-6 p-6 pb-20">
			<div className="flex items-center gap-3">
				<Link
					to="/dashboard/integrations"
					className={buttonVariants({
						variant: "outline",
						size: "icon",
						className: "h-9 w-9",
					})}
				>
					<ArrowLeft className="h-4 w-4" />
				</Link>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Elastic</h1>
					<p className="text-sm text-muted-foreground">
						Optional per-user Elasticsearch settings for indexing Skyforge
						events.
					</p>
				</div>
			</div>

			<Card variant="glass">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Database className="h-5 w-5" />
						Integration Status
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					{cfgQ.isLoading ? (
						<div className="text-muted-foreground">Loading…</div>
					) : cfgQ.isError ? (
						<div className="text-destructive">
							Failed to load:{" "}
							{cfgQ.error instanceof Error
								? cfgQ.error.message
								: String(cfgQ.error)}
						</div>
					) : !enabled ? (
						<div className="text-muted-foreground">
							Elastic is disabled on this Skyforge instance. Ask an admin to
							enable `skyforge.elastic.enabled` in the Helm values.
						</div>
					) : (
						<div className="space-y-1 text-muted-foreground">
							<div>
								{cfgQ.data?.configured ? "Configured" : "Not configured"} ·
								Default: <span className="font-mono">{defaultUrl || "—"}</span>
							</div>
							{toolsQ.isLoading ? (
								<div>Tools: loading…</div>
							) : toolsQ.isError ? (
								<div>Tools: status unavailable</div>
							) : toolsQ.data ? (
								<div>
									Tools:{" "}
									{isAsleep(toolsQ.data)
										? wake.isPending
											? "waking…"
											: "asleep"
										: isElasticsearchReady(toolsQ.data)
											? "ready"
											: "starting…"}
									{toolsQ.data.autosleepEnabled
										? ` · autosleep ${toolsQ.data.idleMinutes}m`
										: ""}
								</div>
							) : null}
						</div>
					)}

					<div className="flex flex-wrap gap-2">
						<Button
							size="sm"
							variant="secondary"
							disabled={
								cfgQ.isLoading ||
								cfgQ.isError ||
								test.isPending ||
								wake.isPending
							}
							onClick={() => test.mutate()}
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Test
						</Button>
						<Button size="sm" variant="secondary" asChild>
							<a href="/kibana/" target="_blank" rel="noreferrer noopener">
								Open Kibana <ExternalLink className="ml-1 inline h-4 w-4" />
							</a>
						</Button>
						<Button
							size="sm"
							variant="outline"
							disabled={clear.isPending || cfgQ.isLoading || cfgQ.isError}
							onClick={() => clear.mutate()}
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Clear
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Configuration</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="elastic-url">Elasticsearch URL</Label>
						<Input
							id="elastic-url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder={defaultUrl || "http://elasticsearch:9200"}
						/>
						<div className="text-xs text-muted-foreground">
							Leave blank to use the instance default{" "}
							<span className="font-mono">
								{defaultUrl || "http://elasticsearch:9200"}
							</span>
							.
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="elastic-index">Index prefix</Label>
						<Input
							id="elastic-index"
							value={indexPrefix}
							onChange={(e) => setIndexPrefix(e.target.value)}
							placeholder={defaultIndexPrefix || "skyforge"}
						/>
						<div className="text-xs text-muted-foreground">
							Leave blank to use the instance default{" "}
							<span className="font-mono">
								{defaultIndexPrefix || "skyforge"}
							</span>
							.
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Auth</Label>
							<Select
								value={authType}
								onValueChange={(v) => setAuthType(v as AuthType)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select auth" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None</SelectItem>
									<SelectItem value="api_key">API key</SelectItem>
									<SelectItem value="basic">Basic auth</SelectItem>
								</SelectContent>
							</Select>
							<div className="text-xs text-muted-foreground">
								{authType === "api_key" && cfgQ.data?.hasApiKey
									? "API key stored. Leave blank to keep."
									: authType === "basic" && cfgQ.data?.hasBasicPassword
										? "Password stored. Leave blank to keep."
										: "Secrets are stored encrypted; they are not shown again."}
							</div>
						</div>

						{authType === "api_key" ? (
							<div className="space-y-2">
								<Label htmlFor="elastic-api-key">API key</Label>
								<Input
									id="elastic-api-key"
									value={apiKey}
									onChange={(e) => setApiKey(e.target.value)}
									placeholder={cfgQ.data?.hasApiKey ? "(stored)" : "ApiKey ..."}
								/>
							</div>
						) : authType === "basic" ? (
							<div className="space-y-3">
								<div className="space-y-2">
									<Label htmlFor="elastic-basic-user">Username</Label>
									<Input
										id="elastic-basic-user"
										value={basicUsername}
										onChange={(e) => setBasicUsername(e.target.value)}
										placeholder="elastic"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="elastic-basic-pass">Password</Label>
									<Input
										id="elastic-basic-pass"
										value={basicPassword}
										onChange={(e) => setBasicPassword(e.target.value)}
										placeholder={
											cfgQ.data?.hasBasicPassword ? "(stored)" : "••••••••"
										}
									/>
								</div>
							</div>
						) : (
							<div className="text-sm text-muted-foreground">
								No auth headers will be sent.
							</div>
						)}
					</div>

					<div className="flex flex-wrap gap-2">
						<Button
							disabled={!canSave || save.isPending}
							onClick={() => save.mutate()}
						>
							Save
						</Button>
						<Button
							variant="secondary"
							disabled={
								test.isPending ||
								wake.isPending ||
								cfgQ.isLoading ||
								cfgQ.isError
							}
							onClick={() => test.mutate()}
						>
							Test
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
