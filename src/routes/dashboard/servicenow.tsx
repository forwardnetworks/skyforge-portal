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
	installUserServiceNowDemo,
	putUserServiceNowConfig,
} from "../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/servicenow")({
	component: ServiceNowPage,
});

function ServiceNowPage() {
	const qc = useQueryClient();
	const cfgKey = queryKeys.userServiceNowConfig();

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
