import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
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
	cancelUserServiceNowSetup,
	configureForwardServiceNowTicketing,
	getUserServiceNowConfig,
	getUserServiceNowPdiStatus,
	getUserServiceNowSchemaStatus,
	getUserServiceNowSetupStatus,
	installUserServiceNowDemo,
	listUserForwardCollectorConfigs,
	putUserServiceNowConfig,
	startUserServiceNowSetup,
	wakeUserServiceNowPdi,
} from "../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/servicenow")({
	component: ServiceNowPage,
});

function ServiceNowPage() {
	const qc = useQueryClient();
	const cfgKey = queryKeys.userServiceNowConfig();
	const setupKey = queryKeys.userServiceNowSetupStatus();
	const pdiKey = queryKeys.userServiceNowPdiStatus();
	const schemaKey = queryKeys.userServiceNowSchemaStatus();
	const collectorsKey = queryKeys.userForwardCollectorConfigs();

	const cfgQ = useQuery({
		queryKey: cfgKey,
		queryFn: getUserServiceNowConfig,
		retry: false,
	});
	const cfg = cfgQ.data;

	const setupQ = useQuery({
		queryKey: setupKey,
		queryFn: getUserServiceNowSetupStatus,
		retry: false,
		refetchInterval: (query) =>
			query.state.data?.status === "running" ? 4_000 : 30_000,
	});

	const collectorsQ = useQuery({
		queryKey: collectorsKey,
		queryFn: listUserForwardCollectorConfigs,
		retry: false,
		staleTime: 30_000,
	});
	const collectorOptions = useMemo(
		() => collectorsQ.data?.collectors ?? [],
		[collectorsQ.data],
	);

	const [instanceUrl, setInstanceUrl] = useState("");
	const [adminUsername, setAdminUsername] = useState("");
	const [adminPassword, setAdminPassword] = useState("");
	const [forwardCredentialSetId, setForwardCredentialSetId] = useState("");

	useEffect(() => {
		if (!cfg) return;
		setInstanceUrl(cfg.instanceUrl ?? "");
		setAdminUsername(cfg.adminUsername ?? "");
		setForwardCredentialSetId(cfg.forwardCredentialSetId ?? "");
	}, [cfg]);

	useEffect(() => {
		if (forwardCredentialSetId) return;
		const preferred =
			collectorOptions.find((c) => c.isDefault) ?? collectorOptions[0];
		if (preferred?.id) setForwardCredentialSetId(preferred.id);
	}, [collectorOptions, forwardCredentialSetId]);

	const pdiQ = useQuery({
		queryKey: pdiKey,
		queryFn: getUserServiceNowPdiStatus,
		enabled: Boolean(cfg?.configured),
		retry: false,
	});

	const schemaQ = useQuery({
		queryKey: schemaKey,
		queryFn: getUserServiceNowSchemaStatus,
		enabled: Boolean(cfg?.configured),
		retry: false,
	});

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!instanceUrl.trim())
				throw new Error("ServiceNow instance URL is required");
			if (!adminUsername.trim())
				throw new Error("ServiceNow admin username is required");
			if (!forwardCredentialSetId.trim())
				throw new Error("Forward credential set is required");
			return putUserServiceNowConfig({
				instanceUrl: instanceUrl.trim(),
				adminUsername: adminUsername.trim(),
				adminPassword,
				forwardCredentialSetId: forwardCredentialSetId.trim(),
				forwardCollectorConfigId: forwardCredentialSetId.trim(),
			});
		},
		onSuccess: async () => {
			toast.success("Saved ServiceNow settings");
			setAdminPassword("");
			await qc.invalidateQueries({ queryKey: cfgKey });
			await qc.invalidateQueries({ queryKey: setupKey });
			await qc.invalidateQueries({ queryKey: pdiKey });
			await qc.invalidateQueries({ queryKey: schemaKey });
		},
		onError: (e) =>
			toast.error("Failed to save ServiceNow settings", {
				description: (e as Error).message,
			}),
	});

	const setupMutation = useMutation({
		mutationFn: async (resume: boolean) => startUserServiceNowSetup({ resume }),
		onSuccess: async (resp) => {
			if (resp.status === "completed")
				toast.success("ServiceNow setup completed");
			else if (resp.status === "needs_manual_step")
				toast.warning("ServiceNow setup needs manual remediation");
			else if (resp.status === "running")
				toast.success("ServiceNow setup started");
			await qc.invalidateQueries({ queryKey: setupKey });
			await qc.invalidateQueries({ queryKey: cfgKey });
			await qc.invalidateQueries({ queryKey: schemaKey });
		},
		onError: (e) =>
			toast.error("Failed to run setup", { description: (e as Error).message }),
	});

	const cancelSetupMutation = useMutation({
		mutationFn: async () => cancelUserServiceNowSetup(),
		onSuccess: async (resp) => {
			if (resp.canceled) toast.success("Setup canceled");
			await qc.invalidateQueries({ queryKey: setupKey });
		},
		onError: (e) =>
			toast.error("Failed to cancel setup", {
				description: (e as Error).message,
			}),
	});

	const wakeMutation = useMutation({
		mutationFn: async () => wakeUserServiceNowPdi(),
		onSuccess: async () => {
			toast.success("Wake requested");
			await qc.invalidateQueries({ queryKey: pdiKey });
		},
		onError: (e) =>
			toast.error("Failed to wake PDI", { description: (e as Error).message }),
	});

	const installMutation = useMutation({
		mutationFn: async () => installUserServiceNowDemo(),
		onSuccess: async (resp) => {
			if (resp.installed) toast.success("Demo app installed");
			else toast.error("Install failed", { description: resp.message });
			await qc.invalidateQueries({ queryKey: cfgKey });
			await qc.invalidateQueries({ queryKey: schemaKey });
		},
		onError: (e) =>
			toast.error("Failed to install demo app", {
				description: (e as Error).message,
			}),
	});

	const configureMutation = useMutation({
		mutationFn: async () => configureForwardServiceNowTicketing(),
		onSuccess: (resp) => {
			if (resp.configured) toast.success("Forward ticketing configured");
			else
				toast.error("Failed to configure Forward", {
					description: resp.message,
				});
		},
		onError: (e) =>
			toast.error("Failed to configure Forward", {
				description: (e as Error).message,
			}),
	});

	const setupStatus = setupQ.data?.status ?? "idle";
	const canResume = setupStatus === "needs_manual_step";
	const isRunning = setupStatus === "running";
	const selectedCredential = collectorOptions.find(
		(c) => c.id === forwardCredentialSetId,
	);

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">ServiceNow</h1>
				<p className="text-sm text-muted-foreground mt-1">
					One-click near-zero-touch setup for the Forward connectivity demo app.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Setup Workflow</CardTitle>
					<CardDescription>
						Primary path: save config, run setup, remediate only when required.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="text-sm">
						Status: <span className="font-medium">{setupStatus}</span>
						{setupQ.data?.currentStep
							? ` · Step: ${setupQ.data.currentStep}`
							: ""}
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={() => setupMutation.mutate(false)}
							disabled={
								setupMutation.isPending || isRunning || saveMutation.isPending
							}
						>
							Run setup
						</Button>
						<Button
							variant="secondary"
							onClick={() => setupMutation.mutate(true)}
							disabled={setupMutation.isPending || !canResume}
						>
							Resume setup
						</Button>
						<Button
							variant="outline"
							onClick={() => cancelSetupMutation.mutate()}
							disabled={cancelSetupMutation.isPending || !isRunning}
						>
							Cancel
						</Button>
						<Button
							variant="outline"
							onClick={() => void setupQ.refetch()}
							disabled={setupQ.isFetching}
						>
							Refresh
						</Button>
					</div>

					{setupQ.data?.steps?.length ? (
						<div className="rounded-md border p-3 space-y-1 text-xs">
							{setupQ.data.steps.map((step) => (
								<div key={step.step} className="font-mono">
									{step.step}: {step.status}
									{step.detail ? ` — ${step.detail}` : ""}
								</div>
							))}
						</div>
					) : null}

					{setupQ.data?.remediation?.length ? (
						<div className="rounded-md border p-3 bg-muted/30">
							<div className="text-xs font-medium mb-1">Remediation</div>
							<ul className="text-xs space-y-1 list-disc pl-4">
								{setupQ.data.remediation.map((line) => (
									<li key={line}>{line}</li>
								))}
							</ul>
						</div>
					) : null}

					{typeof setupQ.data?.ticketingIntegrationSupported === "boolean" ? (
						<div className="text-xs text-muted-foreground">
							Forward ticketing API:{" "}
							{setupQ.data.ticketingIntegrationSupported
								? "supported"
								: "unsupported"}
						</div>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Configuration</CardTitle>
					<CardDescription>
						Uses shared Forward credential sets from{" "}
						<code>/dashboard/forward/credentials</code>.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>ServiceNow instance URL</Label>
							<Input
								value={instanceUrl}
								onChange={(e) => setInstanceUrl(e.target.value)}
								placeholder="https://dev12345.service-now.com"
							/>
						</div>
						<div className="space-y-2">
							<Label>ServiceNow admin username</Label>
							<Input
								value={adminUsername}
								onChange={(e) => setAdminUsername(e.target.value)}
								placeholder="admin"
							/>
						</div>
						<div className="space-y-2">
							<Label>ServiceNow admin password</Label>
							<Input
								type="password"
								value={adminPassword}
								onChange={(e) => setAdminPassword(e.target.value)}
								placeholder={
									cfg?.hasAdminPassword ? "(leave blank to keep stored)" : ""
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Forward credential set</Label>
							<Select
								value={forwardCredentialSetId || ""}
								onValueChange={setForwardCredentialSetId}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select saved credential set" />
								</SelectTrigger>
								<SelectContent>
									{collectorOptions.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
											{c.isDefault ? " (default)" : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					{selectedCredential?.baseUrl ? (
						<div className="text-xs text-muted-foreground">
							Selected host: <code>{selectedCredential.baseUrl}</code>
						</div>
					) : null}
					<div className="flex items-center gap-2">
						<Button
							onClick={() => saveMutation.mutate()}
							disabled={saveMutation.isPending}
						>
							Save settings
						</Button>
						<Button
							variant="outline"
							onClick={() => void cfgQ.refetch()}
							disabled={cfgQ.isFetching}
						>
							Reload
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Advanced</CardTitle>
					<CardDescription>
						Manual controls for troubleshooting and verification.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="text-sm">
						PDI status:{" "}
						<span className="font-medium">
							{pdiQ.data?.status ?? "unknown"}
						</span>
						{pdiQ.data?.detail ? ` — ${pdiQ.data.detail}` : ""}
					</div>
					<div className="text-sm">
						Schema status:{" "}
						<span className="font-medium">
							{schemaQ.data?.status ?? "unknown"}
						</span>
						{schemaQ.data?.missing?.length
							? ` (${schemaQ.data.missing.length} missing)`
							: ""}
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						<Button
							variant="secondary"
							onClick={() => wakeMutation.mutate()}
							disabled={wakeMutation.isPending || !cfg?.configured}
						>
							Wake PDI
						</Button>
						<Button
							variant="secondary"
							onClick={() => installMutation.mutate()}
							disabled={installMutation.isPending || !cfg?.configured}
						>
							Install demo app
						</Button>
						<Button
							variant="secondary"
							onClick={() => configureMutation.mutate()}
							disabled={configureMutation.isPending || !cfg?.configured}
						>
							Configure Forward ticketing
						</Button>
						<Button
							variant="outline"
							onClick={() => void schemaQ.refetch()}
							disabled={schemaQ.isFetching || !cfg?.configured}
						>
							Check schema
						</Button>
						<a
							className="text-sm underline text-muted-foreground"
							href="/dashboard/docs/servicenow"
							target="_blank"
							rel="noreferrer"
						>
							Docs
						</a>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
