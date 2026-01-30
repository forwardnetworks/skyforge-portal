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
import { queryKeys } from "../../lib/query-keys";
import {
	getUserServiceNowConfig,
	getUserServiceNowPdiStatus,
	installUserServiceNowDemo,
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

	const cfgQ = useQuery({
		queryKey: cfgKey,
		queryFn: getUserServiceNowConfig,
		retry: false,
	});

	const cfg = cfgQ.data;

	const [instanceUrl, setInstanceUrl] = useState("");
	const [adminUsername, setAdminUsername] = useState("");
	const [adminPassword, setAdminPassword] = useState("");
	const [forwardBaseUrl, setForwardBaseUrl] = useState("https://fwd.app/api");
	const [forwardUsername, setForwardUsername] = useState("");
	const [forwardPassword, setForwardPassword] = useState("");

	useEffect(() => {
		if (!cfg) return;
		setInstanceUrl(cfg.instanceUrl ?? "");
		setAdminUsername(cfg.adminUsername ?? "");
		setForwardBaseUrl(cfg.forwardBaseUrl ?? "https://fwd.app/api");
		setForwardUsername(cfg.forwardUsername ?? "");
	}, [cfg]);

	const pdiQ = useQuery({
		queryKey: pdiKey,
		queryFn: getUserServiceNowPdiStatus,
		enabled: Boolean(cfg?.configured),
		retry: false,
		refetchOnWindowFocus: false,
		staleTime: 0,
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

	const importEnvFile = async (file: File) => {
		const text = await file.text();
		const lines = text.split(/\r?\n/);
		const parsed: Record<string, string> = {};
		for (const raw of lines) {
			const line = raw.trim();
			if (!line || line.startsWith("#")) continue;
			const withoutExport = line.startsWith("export ")
				? line.slice("export ".length).trim()
				: line;
			const eq = withoutExport.indexOf("=");
			if (eq <= 0) continue;
			const key = withoutExport.slice(0, eq).trim();
			let value = withoutExport.slice(eq + 1).trim();
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}
			parsed[key] = value;
		}

		const snURL =
			parsed.SN_INSTANCE_URL || parsed.SERVICENOW_INSTANCE_URL || "";
		const snUser =
			parsed.SN_ADMIN_USERNAME || parsed.SERVICENOW_ADMIN_USERNAME || "";
		const snPass =
			parsed.SN_ADMIN_PASSWORD || parsed.SERVICENOW_ADMIN_PASSWORD || "";
		const fwdBase =
			parsed.FWD_BASE_URL || parsed.FORWARD_BASE_URL || "https://fwd.app/api";
		const fwdUser = parsed.FWD_USERNAME || parsed.FORWARD_USERNAME || "";
		const fwdPass = parsed.FWD_PASSWORD || parsed.FORWARD_PASSWORD || "";

		if (snURL) setInstanceUrl(snURL);
		if (snUser) setAdminUsername(snUser);
		if (snPass) setAdminPassword(snPass);
		if (fwdBase) setForwardBaseUrl(fwdBase);
		if (fwdUser) setForwardUsername(fwdUser);
		if (fwdPass) setForwardPassword(fwdPass);

		toast.success("Imported env file (not uploaded)");
	};

	const effectiveAdminPassword = useMemo(() => {
		if (adminPassword.trim()) return adminPassword;
		return cfg?.hasAdminPassword ? "(stored)" : "";
	}, [adminPassword, cfg?.hasAdminPassword]);

	const effectiveForwardPassword = useMemo(() => {
		if (forwardPassword.trim()) return forwardPassword;
		return cfg?.hasForwardPassword ? "(stored)" : "";
	}, [forwardPassword, cfg?.hasForwardPassword]);

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!instanceUrl.trim())
				throw new Error("ServiceNow instance URL is required");
			if (!adminUsername.trim())
				throw new Error("ServiceNow admin username is required");
			if (!forwardUsername.trim())
				throw new Error("Forward username is required");
			if (!forwardBaseUrl.trim())
				throw new Error("Forward base URL is required");

			return putUserServiceNowConfig({
				instanceUrl: instanceUrl.trim(),
				adminUsername: adminUsername.trim(),
				adminPassword,
				forwardBaseUrl: forwardBaseUrl.trim(),
				forwardUsername: forwardUsername.trim(),
				forwardPassword,
			});
		},
		onSuccess: async () => {
			toast.success("Saved ServiceNow settings");
			setAdminPassword("");
			setForwardPassword("");
			await qc.invalidateQueries({ queryKey: cfgKey });
			await qc.invalidateQueries({ queryKey: pdiKey });
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
					<div className="pt-2">
						<Label>Import from env file</Label>
						<div className="text-xs text-muted-foreground mt-1">
							Expected keys: <code>SN_INSTANCE_URL</code>,{" "}
							<code>SN_ADMIN_USERNAME</code>, <code>SN_ADMIN_PASSWORD</code>,{" "}
							<code>FWD_BASE_URL</code>, <code>FWD_USERNAME</code>,{" "}
							<code>FWD_PASSWORD</code>.
						</div>
						<Input
							type="file"
							accept=".env,.txt"
							onChange={(e) => {
								const f = e.target.files?.[0];
								if (f) void importEnvFile(f);
								e.target.value = "";
							}}
							className="mt-2"
						/>
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
							{effectiveAdminPassword ? (
								<div className="text-xs text-muted-foreground">
									Current: {effectiveAdminPassword}
								</div>
							) : null}
						</div>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Forward base URL</Label>
							<Input
								value={forwardBaseUrl}
								onChange={(e) => setForwardBaseUrl(e.target.value)}
								placeholder="https://fwd.app/api"
							/>
						</div>
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
									cfg?.hasForwardPassword ? "(leave blank to keep stored)" : ""
								}
							/>
							{effectiveForwardPassword ? (
								<div className="text-xs text-muted-foreground">
									Current: {effectiveForwardPassword}
								</div>
							) : null}
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
								!cfg?.configured
							}
						>
							Install demo app
						</Button>
						<a
							className="text-sm underline text-muted-foreground ml-2"
							href="/assets/skyforge/docs/servicenow.html"
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
