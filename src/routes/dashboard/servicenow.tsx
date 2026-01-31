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
	configureForwardServiceNowTicketing,
	getUserServiceNowConfig,
	getUserServiceNowPdiStatus,
	getUserServiceNowSchemaStatus,
	installUserServiceNowDemo,
	listUserForwardCollectorConfigs,
	putUserServiceNowConfig,
	wakeUserServiceNowPdi,
} from "../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/servicenow")({
	component: ServiceNowPage,
});

function ServiceNowPage() {
	const qc = useQueryClient();
	const cfgKey = queryKeys.userServiceNowConfig();
	const pdiKey = queryKeys.userServiceNowPdiStatus();
	const schemaKey = queryKeys.userServiceNowSchemaStatus();
	const collectorsKey = queryKeys.userForwardCollectorConfigs();

	const cfgQ = useQuery({
		queryKey: cfgKey,
		queryFn: getUserServiceNowConfig,
		retry: false,
	});

	const cfg = cfgQ.data;

	const [instanceUrl, setInstanceUrl] = useState("");
	const [adminUsername, setAdminUsername] = useState("");
	const [adminPassword, setAdminPassword] = useState("");
	const [forwardCollectorConfigId, setForwardCollectorConfigId] = useState("");
	const [forwardCredSource, setForwardCredSource] = useState<
		"collector" | "custom"
	>("collector");
	const [forwardUsername, setForwardUsername] = useState(""); // custom
	const [forwardPassword, setForwardPassword] = useState(""); // custom
	const [configureForwardTicketingOnSave, setConfigureForwardTicketingOnSave] =
		useState(true);

	useEffect(() => {
		if (!cfg) return;
		setInstanceUrl(cfg.instanceUrl ?? "");
		setAdminUsername(cfg.adminUsername ?? "");
		setForwardCollectorConfigId(cfg.forwardCollectorConfigId ?? "");
		// Prefer using an existing collector by default; fall back to custom only
		// when the user previously configured custom creds.
		setForwardCredSource(
			cfg.forwardCollectorConfigId
				? "collector"
				: cfg.forwardUsername
					? "custom"
					: "collector",
		);
		setForwardUsername(cfg.forwardUsername ?? "");
	}, [cfg]);

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

	useEffect(() => {
		// Prefer using an existing collector by default (recommended path).
		if (forwardCredSource !== "collector") return;
		if (forwardCollectorConfigId) return;
		const preferred =
			collectorOptions.find((c) => c.isDefault) ?? collectorOptions[0];
		if (preferred?.id) setForwardCollectorConfigId(preferred.id);
	}, [cfg, collectorOptions, forwardCollectorConfigId, forwardCredSource]);

	const pdiQ = useQuery({
		queryKey: pdiKey,
		queryFn: getUserServiceNowPdiStatus,
		enabled: Boolean(cfg?.configured),
		retry: false,
		refetchOnWindowFocus: true,
		staleTime: 0,
		refetchInterval: (query) => {
			if (document.visibilityState === "hidden") return false;
			const st = query.state.data?.status ?? "";
			if (st === "awake") return 120_000;
			if (st === "sleeping" || st === "waking" || st === "unreachable")
				return 30_000;
			return 60_000;
		},
	});

	const schemaQ = useQuery({
		queryKey: schemaKey,
		queryFn: getUserServiceNowSchemaStatus,
		enabled: Boolean(cfg?.configured),
		retry: false,
		refetchOnWindowFocus: true,
		staleTime: 0,
	});

	const schemaMissingTables = useMemo(() => {
		const missing = schemaQ.data?.missing ?? [];
		return missing.some((m) => m.startsWith("table:"));
	}, [schemaQ.data?.missing]);

	const wakeMutation = useMutation({
		mutationFn: async () => wakeUserServiceNowPdi(),
		onSuccess: async () => {
			toast.success("Wake requested");
			await qc.invalidateQueries({ queryKey: pdiKey });
		},
		onError: (e) =>
			toast.error("Failed to wake PDI", { description: (e as Error).message }),
	});

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!instanceUrl.trim())
				throw new Error("ServiceNow instance URL is required");
			if (!adminUsername.trim())
				throw new Error("ServiceNow admin username is required");
			const isCollector = forwardCredSource === "collector";
			if (isCollector) {
				if (!forwardCollectorConfigId.trim())
					throw new Error("Select a Forward collector (or choose Custom)");
			} else {
				if (!forwardUsername.trim())
					throw new Error("Forward username is required");
			}

			return putUserServiceNowConfig({
				instanceUrl: instanceUrl.trim(),
				adminUsername: adminUsername.trim(),
				adminPassword,
				forwardCollectorConfigId: isCollector
					? forwardCollectorConfigId.trim()
					: "",
				forwardUsername: isCollector ? "" : forwardUsername.trim(),
				forwardPassword: isCollector ? "" : forwardPassword,
			});
		},
		onSuccess: async () => {
			toast.success("Saved ServiceNow settings");
			setAdminPassword("");
			setForwardPassword("");
			await qc.invalidateQueries({ queryKey: cfgKey });
			await qc.invalidateQueries({ queryKey: pdiKey });
			await qc.invalidateQueries({ queryKey: schemaKey });
			if (configureForwardTicketingOnSave) {
				configureForwardTicketingMutation.mutate();
			}
		},
		onError: (e) =>
			toast.error("Failed to save ServiceNow settings", {
				description: (e as Error).message,
			}),
	});

	const installMutation = useMutation({
		mutationFn: async () => installUserServiceNowDemo(),
		onSuccess: async (resp) => {
			if (resp.installed) toast.success("ServiceNow demo installed");
			else
				toast.error("ServiceNow install failed", { description: resp.message });
			await qc.invalidateQueries({ queryKey: cfgKey });
		},
		onError: (e) =>
			toast.error("Failed to install ServiceNow demo", {
				description: (e as Error).message,
			}),
	});

	const configureForwardTicketingMutation = useMutation({
		mutationFn: async () => configureForwardServiceNowTicketing(),
		onSuccess: async (resp) => {
			if (resp.configured)
				toast.success("Configured Forward ticketing integration");
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

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">ServiceNow</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Install the Forward Connectivity Ticket demo into a ServiceNow PDI.
					ServiceNow calls Forward SaaS directly; Skyforge only installs and
					configures the app.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Quick links</CardTitle>
					<CardDescription>
						Create a ServiceNow PDI (manual step).
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2">
					<a
						className="text-sm underline"
						href="https://developer.servicenow.com/dev.do#!/guides/now-platform/pdi-guide/obtaining-a-pdi"
						target="_blank"
						rel="noreferrer"
					>
						Create a Personal Developer Instance (PDI)
					</a>
					<a
						className="text-sm underline"
						href="/docs/servicenow.html"
						target="_blank"
						rel="noreferrer"
					>
						Open Skyforge ServiceNow docs
					</a>
					<div className="text-xs text-muted-foreground">
						Create and wake your PDI in the ServiceNow portal; then paste the
						instance URL and admin creds below.
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>PDI status</CardTitle>
					<CardDescription>
						ServiceNow PDIs can sleep after inactivity. Skyforge can detect this
						and attempt to wake the instance.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="text-sm">
						{cfg?.configured ? (
							<>
								Status:{" "}
								<span className="font-medium">
									{pdiQ.data?.status ??
										(pdiQ.isFetching ? "checking…" : "unknown")}
								</span>
								{pdiQ.data?.httpStatus ? ` (HTTP ${pdiQ.data.httpStatus})` : ""}
								{pdiQ.data?.detail ? ` — ${pdiQ.data.detail}` : ""}
							</>
						) : (
							<span className="text-muted-foreground">
								Save configuration first.
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="secondary"
							onClick={() => void pdiQ.refetch()}
							disabled={
								!cfg?.configured || pdiQ.isFetching || wakeMutation.isPending
							}
						>
							Check now
						</Button>
						<Button
							variant="secondary"
							onClick={() => wakeMutation.mutate()}
							disabled={!cfg?.configured || wakeMutation.isPending}
						>
							Wake up
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Schema status</CardTitle>
					<CardDescription>
						The demo requires two custom tables. Create the tables once in the
						PDI; Skyforge can auto-create the required fields and choice lists
						when you install the demo app.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="text-sm">
						{cfg?.configured ? (
							<>
								Status:{" "}
								<span className="font-medium">
									{schemaQ.data?.status ??
										(schemaQ.isFetching ? "checking…" : "unknown")}
								</span>
								{schemaQ.data?.checkedAt
									? ` (checked ${schemaQ.data.checkedAt})`
									: ""}
								{schemaQ.data?.detail ? ` — ${schemaQ.data.detail}` : ""}
							</>
						) : (
							<span className="text-muted-foreground">
								Save configuration first.
							</span>
						)}
					</div>

					{cfg?.configured && instanceUrl ? (
						<div className="text-sm text-muted-foreground">
							Portal page:{" "}
							<a
									className="underline"
									href={`${instanceUrl.replace(/\/+$/, "")}/sp?id=connectivity_ticket`}
									target="_blank"
									rel="noreferrer"
								>
								/sp?id=connectivity_ticket
							</a>
						</div>
					) : null}

					{schemaQ.data?.status === "missing" &&
					schemaQ.data.missing?.length ? (
						<div className="rounded-md border p-3 bg-muted/30">
							<div className="text-xs text-muted-foreground mb-2">
								Missing items:
							</div>
							{schemaMissingTables ? (
								<div className="text-xs text-muted-foreground mb-2">
									Create the missing <span className="font-medium">tables</span>{" "}
									in ServiceNow first; then click <span className="font-medium">
										Install demo app
									</span>{" "}
									to let Skyforge auto-create the rest.
								</div>
							) : (
								<div className="text-xs text-muted-foreground mb-2">
									Click <span className="font-medium">Install demo app</span> to
									let Skyforge auto-create these fields/choices.
								</div>
							)}
							<ul className="text-xs font-mono space-y-1">
								{schemaQ.data.missing.map((m) => (
									<li key={m}>- {m}</li>
								))}
							</ul>
						</div>
					) : null}

					<div className="flex items-center gap-2">
						<Button
							variant="secondary"
							onClick={() => void schemaQ.refetch()}
							disabled={!cfg?.configured || schemaQ.isFetching}
						>
							Check schema
						</Button>
						<a
							className="text-sm underline text-muted-foreground"
							href="/docs/servicenow.html"
							target="_blank"
							rel="noreferrer"
						>
							Docs
						</a>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Configuration</CardTitle>
					<CardDescription>
						Skyforge uses ServiceNow admin creds to install/configure. Forward
						creds are stored in ServiceNow as a Basic Auth credential for the
						demo REST Message.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
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
					</div>

					<div className="space-y-2">
						<Label>Forward credentials</Label>
						<div className="text-xs text-muted-foreground">
							Uses Forward SaaS (<code>https://fwd.app</code>).
						</div>
						<Select
							value={
								forwardCredSource === "custom"
									? "custom"
									: forwardCollectorConfigId || ""
							}
							onValueChange={(v) => {
								if (v === "custom") {
									setForwardCredSource("custom");
									setForwardCollectorConfigId("");
									return;
								}
								setForwardCredSource("collector");
								setForwardCollectorConfigId(v);
							}}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select a collector" />
							</SelectTrigger>
							<SelectContent>
								{collectorOptions.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										{c.name}
										{c.isDefault ? " (default)" : ""}
									</SelectItem>
								))}
								<SelectItem value="custom">Custom…</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{forwardCredSource === "custom" ? (
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Forward username</Label>
								<Input
									value={forwardUsername}
									onChange={(e) => setForwardUsername(e.target.value)}
									placeholder="you@example.com"
								/>
							</div>
							<div className="space-y-2">
								<Label>Forward password</Label>
								<Input
									type="password"
									value={forwardPassword}
									onChange={(e) => setForwardPassword(e.target.value)}
									placeholder={
										cfg?.hasForwardPassword
											? "(leave blank to keep stored)"
											: ""
									}
								/>
							</div>
						</div>
					) : null}

					<div className="space-y-2">
						<Label>Forward integration</Label>
						<div className="flex items-center gap-2">
							<Checkbox
								id="snow-configure-ticketing-on-save"
								checked={configureForwardTicketingOnSave}
								onCheckedChange={(v) =>
									setConfigureForwardTicketingOnSave(Boolean(v))
								}
							/>
							<Label
								htmlFor="snow-configure-ticketing-on-save"
								className="font-normal text-sm"
							>
								Configure Forward ticketing integration on save
							</Label>
						</div>
						<div className="text-xs text-muted-foreground">
							Configures Forward SaaS to auto-create and auto-update incidents
							in this ServiceNow instance.
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Button
							onClick={() => saveMutation.mutate()}
							disabled={saveMutation.isPending || installMutation.isPending}
						>
							Save
						</Button>
						<Button
							variant="secondary"
							onClick={() => installMutation.mutate()}
							disabled={
								installMutation.isPending ||
								saveMutation.isPending ||
								!cfg?.configured ||
								schemaMissingTables
							}
						>
							Install demo app
						</Button>
						<Button
							variant="secondary"
							onClick={() => configureForwardTicketingMutation.mutate()}
							disabled={
								configureForwardTicketingMutation.isPending ||
								saveMutation.isPending ||
								!cfg?.configured
							}
						>
							Configure Forward (ticketing)
						</Button>
						<a
							className="text-sm underline text-muted-foreground ml-2"
							href="/docs/servicenow.html"
							target="_blank"
							rel="noreferrer"
						>
							Docs
						</a>
						{cfg?.lastInstallStatus ? (
							<div className="text-sm text-muted-foreground">
								Status: {cfg.lastInstallStatus}
								{cfg.lastInstallError ? ` (${cfg.lastInstallError})` : ""}
							</div>
						) : null}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
