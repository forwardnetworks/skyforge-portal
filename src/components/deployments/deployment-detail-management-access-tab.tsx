import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import type { DeploymentDetailPageState } from "@/hooks/use-deployment-detail-page";
import { reconcileDeploymentManagementAccess } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, RefreshCcw, Server, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function DeploymentDetailManagementAccessTab({
	page,
}: { page: DeploymentDetailPageState }) {
	const deployment = page.deployment;
	const accessQ = page.deploymentManagementAccessQ;
	const access = accessQ.data;
	const queryClient = useQueryClient();
	const reconcileAccess = useMutation({
		mutationFn: async () => {
			if (!deployment || !page.userId) throw new Error("deployment not found");
			return reconcileDeploymentManagementAccess(page.userId, deployment.id);
		},
		onSuccess: (data) => {
			if (deployment && page.userId) {
				queryClient.setQueryData(
					queryKeys.deploymentManagementAccess(page.userId, deployment.id),
					data,
				);
			}
			toast.success("Management access verified");
		},
		onError: (err) => {
			toast.error("Failed to verify management access", {
				description: err instanceof Error ? err.message : String(err),
			});
		},
	});

	if (!deployment) return null;

	const copy = async (value: string, label: string) => {
		try {
			await navigator.clipboard.writeText(value);
			toast.success(`${label} copied`);
		} catch (err) {
			toast.error(`Failed to copy ${label}`, {
				description: err instanceof Error ? err.message : String(err),
			});
		}
	};

	return (
		<TabsContent value="access" className="space-y-6 animate-in fade-in-50">
			<Card className="overflow-hidden">
				<CardHeader className="border-b bg-muted/30">
					<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
						<div className="space-y-2">
							<CardTitle className="flex items-center gap-2">
								<KeyRound className="h-5 w-5" /> Management Access
							</CardTitle>
							<CardDescription>
								Use Skyforge authentication as an SSH ProxyCommand into this
								deployment's KNE management services.
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<AccessStatusBadge
								loading={accessQ.isLoading}
								status={access?.status}
								ready={Boolean(access?.ready)}
							/>
							<Button
								variant="outline"
								size="sm"
								disabled={
									!page.isKNEDeployment ||
									accessQ.isLoading ||
									reconcileAccess.isPending
								}
								onClick={() => reconcileAccess.mutate()}
							>
								<RefreshCcw className="mr-2 h-4 w-4" />
								Verify
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-5 pt-5">
					{!page.isKNEDeployment ? (
						<div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
							Management access is available for KNE-backed deployments only.
						</div>
					) : null}
					{page.isKNEDeployment && accessQ.isError ? (
						<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
							Failed to load management access:{" "}
							{accessQ.error instanceof Error
								? accessQ.error.message
								: String(accessQ.error)}
						</div>
					) : null}
					{page.isKNEDeployment && access ? (
						<>
							<div className="grid gap-3 md:grid-cols-3">
								<AccessFact label="Namespace" value={access.namespace || "-"} />
								<AccessFact
									label="Topology"
									value={access.topologyName || "-"}
								/>
								<AccessFact
									label="Default port"
									value={String(access.defaultPort || 22)}
								/>
							</div>
							{access.message ? (
								<div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
									{access.message}
								</div>
							) : null}
							<div className="grid gap-4 lg:grid-cols-2">
								<CommandBlock
									title="SSH ProxyCommand"
									description="Use this in ~/.ssh/config, Ansible, or any automation that supports ProxyCommand."
									value={access.commands?.proxyCommand || ""}
									onCopy={(value) => copy(value, "ProxyCommand")}
								/>
								<CommandBlock
									title="SSH config"
									description={`Requires ${access.commands?.tokenEnvVarName || "SKYFORGE_API_TOKEN"} in your shell.`}
									value={access.commands?.sshConfig || ""}
									onCopy={(value) => copy(value, "SSH config")}
								/>
								<CommandBlock
									title="Direct tunnel"
									description="Useful for testing the bridge before wiring it into SSH."
									value={access.commands?.tunnel || ""}
									onCopy={(value) => copy(value, "tunnel command")}
								/>
								<CommandBlock
									title="Ansible common args"
									description="Drop this into inventory host_vars or group_vars."
									value={access.commands?.ansibleSshArgs || ""}
									onCopy={(value) => copy(value, "Ansible args")}
								/>
							</div>
							<div className="space-y-3">
								<div className="flex items-center gap-2 text-sm font-medium">
									<Server className="h-4 w-4" /> Nodes
								</div>
								<div className="grid gap-2">
									{(access.nodes ?? []).map((node) => (
										<div
											key={node.id}
											className="flex flex-col gap-2 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between"
										>
											<div>
												<div className="font-medium">
													{node.label || node.id}
												</div>
												<div className="text-xs text-muted-foreground">
													{node.id}
													{node.kind ? ` · ${node.kind}` : ""}
													{node.status ? ` · ${node.status}` : ""}
												</div>
											</div>
											<div className="flex items-center gap-2">
												{node.mgmtIp ? (
													<Badge variant="outline">{node.mgmtIp}</Badge>
												) : null}
												{node.tunnelPath ? (
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															node.tunnelPath &&
															copy(node.tunnelPath, `${node.id} tunnel path`)
														}
													>
														<Copy className="mr-2 h-4 w-4" />
														Path
													</Button>
												) : null}
											</div>
										</div>
									))}
									{(access.nodes ?? []).length === 0 ? (
										<div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
											No node management metadata is available yet.
										</div>
									) : null}
								</div>
							</div>
						</>
					) : null}
				</CardContent>
			</Card>
		</TabsContent>
	);
}

function AccessStatusBadge({
	loading,
	status,
	ready,
}: {
	loading: boolean;
	status?: string;
	ready: boolean;
}) {
	if (loading) return <Badge variant="outline">Loading</Badge>;
	if (ready) {
		return (
			<Badge className="gap-1">
				<ShieldCheck className="h-3.5 w-3.5" /> Ready
			</Badge>
		);
	}
	return <Badge variant="secondary">{status || "Unavailable"}</Badge>;
}

function AccessFact({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border bg-background p-3">
			<div className="text-xs uppercase tracking-wide text-muted-foreground">
				{label}
			</div>
			<div className="mt-1 truncate text-sm font-medium">{value}</div>
		</div>
	);
}

function CommandBlock({
	title,
	description,
	value,
	onCopy,
}: {
	title: string;
	description: string;
	value: string;
	onCopy: (value: string) => void;
}) {
	return (
		<div className="rounded-lg border bg-background">
			<div className="flex items-start justify-between gap-3 border-b p-3">
				<div>
					<div className="text-sm font-medium">{title}</div>
					<div className="text-xs text-muted-foreground">{description}</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					disabled={!value}
					onClick={() => onCopy(value)}
				>
					<Copy className="h-4 w-4" />
				</Button>
			</div>
			<pre className="max-h-44 overflow-auto whitespace-pre-wrap break-all p-3 text-xs leading-relaxed">
				{value || "Unavailable"}
			</pre>
		</div>
	);
}
