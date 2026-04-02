import type {
	AdminAuditSectionProps,
	AdminMaintenanceSectionProps,
	AdminTasksSectionProps,
	AdminUsersSectionProps,
	SettingsAdminSectionProps,
} from "./settings-section-types";
import { AdminOverviewAuthCard } from "./admin-overview-auth-card";
import { AdminOverviewConfigCard } from "./admin-overview-config-card";
import { AdminOverviewForwardDemoSeedsCard } from "./admin-overview-forward-demo-seeds-card";
import { AdminOverviewForwardSupportCard } from "./admin-overview-forward-support-card";
import { AdminOverviewHetznerBurstCard } from "./admin-overview-hetzner-burst-card";
import { AdminOverviewImpersonationCard } from "./admin-overview-impersonation-card";
import { AdminOverviewOIDCCard } from "./admin-overview-oidc-card";
import { AdminOverviewPublicAccessCard } from "./admin-overview-public-access-card";
import { AdminOverviewQuickDeployCard } from "./admin-overview-quick-deploy-card";
import { AdminOverviewRuntimePressureCard } from "./admin-overview-runtime-pressure-card";
import { AdminOverviewServiceNowCard } from "./admin-overview-servicenow-card";
import { AdminOverviewTeamsCard } from "./admin-overview-teams-card";
import { AdminUsersApiPermissionsCard } from "./admin-users-api-permissions-card";
import { AdminUsersForwardResetCard } from "./admin-users-forward-reset-card";
import { AdminUsersManagementCard } from "./admin-users-management-card";
import { AdminUsersPlatformPolicyCard } from "./admin-users-platform-policy-card";
import { AdminUsersPurgeCard } from "./admin-users-purge-card";
import { AdminUsersRbacCard } from "./admin-users-rbac-card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { DataTable } from "./ui/data-table";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import type { SettingsSectionId } from "../lib/settings-sections";

export function renderAdminSettingsSection(
	section: Exclude<SettingsSectionId, "profile">,
	adminProps: SettingsAdminSectionProps,
) {
	switch (section) {
		case "identity":
			return <IdentitySettingsSection {...adminProps.identity} />;
		case "integrations":
			return <IntegrationsSettingsSection {...adminProps.integrations} />;
		case "forward":
			return <ForwardSettingsSection {...adminProps.forward} />;
		case "runtime":
			return <RuntimeSettingsSection {...adminProps.runtime} />;
		case "users":
			return <UsersSettingsSection {...adminProps.users} />;
		case "maintenance":
			return <MaintenanceSettingsSection {...adminProps.maintenance} />;
	}
}

function IdentitySettingsSection(props: SettingsAdminSectionProps["identity"]) {
	return (
		<>
			<AdminOverviewAuthCard {...props} />
			<AdminOverviewOIDCCard {...props} />
			<AdminOverviewImpersonationCard {...props} />
		</>
	);
}

function IntegrationsSettingsSection(
	props: SettingsAdminSectionProps["integrations"],
) {
	return (
		<>
			<AdminOverviewTeamsCard {...props} />
			<AdminOverviewServiceNowCard {...props} />
		</>
	);
}

function ForwardSettingsSection(props: SettingsAdminSectionProps["forward"]) {
	return (
		<>
			<AdminOverviewForwardSupportCard {...props} />
			<AdminOverviewForwardDemoSeedsCard {...props} />
			<AdminOverviewQuickDeployCard {...props} />
		</>
	);
}

function RuntimeSettingsSection(props: SettingsAdminSectionProps["runtime"]) {
	return (
		<>
			<AdminOverviewHetznerBurstCard {...props} />
			<AdminOverviewRuntimePressureCard {...props} />
			<AdminOverviewPublicAccessCard {...props} />
		</>
	);
}

function UsersSettingsSection(props: AdminUsersSectionProps) {
	return (
		<>
			<AdminUsersManagementCard {...props} />
			<AdminUsersRbacCard {...props} />
			<AdminUsersPlatformPolicyCard {...props} />
			<AdminUsersForwardResetCard {...props} />
			<AdminUsersApiPermissionsCard {...props} />
			<AdminUsersPurgeCard {...props} />
		</>
	);
}

function MaintenanceSettingsSection(props: AdminMaintenanceSectionProps) {
	return (
		<>
			<AdminOverviewConfigCard {...props.config} />
			<AdminAuditSectionCard {...props.audit} />
			<AdminMaintenanceTasksSection {...props.tasks} />
		</>
	);
}

function AdminAuditSectionCard(props: AdminAuditSectionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Audit log</CardTitle>
				<CardDescription>Recent admin and user actions.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-2 lg:grid-cols-[auto_1fr_1fr_1fr_auto] lg:items-center">
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">Limit</span>
						<Input
							className="w-28"
							value={props.auditLimit}
							onChange={(e) => props.onAuditLimitChange(e.target.value)}
						/>
					</div>
					<Input
						placeholder="Actor username"
						value={props.auditActor}
						onChange={(e) => props.onAuditActorChange(e.target.value)}
					/>
					<Input
						placeholder="Action prefix"
						value={props.auditAction}
						onChange={(e) => props.onAuditActionChange(e.target.value)}
					/>
					<Input
						placeholder="Search details"
						value={props.auditQuery}
						onChange={(e) => props.onAuditQueryChange(e.target.value)}
					/>
					<Badge variant="outline">{props.auditTimestamp ?? "—"}</Badge>
				</div>
				<DataTable
					rows={props.auditEvents ?? []}
					columns={props.auditColumns}
					getRowId={(row) => String(row.id)}
					isLoading={props.auditLoading}
					emptyText="No audit events."
					minWidthClassName="min-w-[1100px]"
				/>
			</CardContent>
		</Card>
	);
}

function AdminMaintenanceTasksSection(props: AdminTasksSectionProps) {
	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Task reconciliation</CardTitle>
					<CardDescription>
						Manual guardrails for stuck queued and running jobs.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="font-medium">Queued tasks</div>
							<div className="text-sm text-muted-foreground">
								Republish missing queue events.
							</div>
						</div>
						<Button
							variant="outline"
							disabled={props.reconcileQueuedPending}
							onClick={props.onReconcileQueued}
						>
							{props.reconcileQueuedPending ? "Running…" : "Reconcile queued"}
						</Button>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="font-medium">Running tasks</div>
							<div className="text-sm text-muted-foreground">
								Mark long-running or no-log tasks failed.
							</div>
						</div>
						<Button
							variant="outline"
							disabled={props.reconcileRunningPending}
							onClick={props.onReconcileRunning}
						>
							{props.reconcileRunningPending ? "Running…" : "Reconcile running"}
						</Button>
					</div>

					<div className="space-y-3 rounded-md border p-3">
						<div>
							<div className="font-medium">Tenant pod cleanup</div>
							<div className="text-sm text-muted-foreground">
								Force-clean lingering topology pods and resources after failed
								deletions.
							</div>
						</div>
						<div className="grid gap-2 md:grid-cols-2">
							<Select
								value={props.cleanupScopeMode}
								onValueChange={(value) =>
									props.onCleanupScopeModeChange(
										value === "scope" ? "scope" : "all",
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Scope mode" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All user scopes</SelectItem>
									<SelectItem value="scope">Single user scope</SelectItem>
								</SelectContent>
							</Select>
							{props.cleanupScopeMode === "scope" ? (
								<Select
									value={props.cleanupScopeID}
									onValueChange={props.onCleanupScopeIDChange}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select user scope…" />
									</SelectTrigger>
									<SelectContent>
										{props.allUserScopes.map((scope) => (
											<SelectItem key={scope.id} value={scope.id}>
												{scope.slug} ({scope.createdBy})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<Input
									placeholder="Optional namespace override"
									value={props.cleanupNamespace}
									onChange={(e) =>
										props.onCleanupNamespaceChange(e.target.value)
									}
								/>
							)}
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								disabled={
									props.cleanupTenantPodsPending ||
									(props.cleanupScopeMode === "scope" &&
										!props.cleanupScopeID.trim())
								}
								onClick={props.onPreviewCleanup}
							>
								Preview cleanup
							</Button>
							<Button
								variant="destructive"
								disabled={
									props.cleanupTenantPodsPending ||
									(props.cleanupScopeMode === "scope" &&
										!props.cleanupScopeID.trim())
								}
								onClick={props.onRunCleanup}
							>
								{props.cleanupTenantPodsPending ? "Running…" : "Run cleanup"}
							</Button>
						</div>
						{props.cleanupResult ? (
							<div className="rounded-md border bg-muted/40 p-3 text-xs">
								<div>
									namespaces={props.cleanupResult.namespacesConsidered} owners=
									{props.cleanupResult.topologyOwnersFound} topologies=
									{props.cleanupResult.topologiesFound} deleted=
									{props.cleanupResult.topologiesDeleted}
								</div>
								{props.cleanupResult.errors?.length ? (
									<div className="mt-2 text-amber-600">
										{props.cleanupResult.errors.join(" | ")}
									</div>
								) : null}
							</div>
						) : null}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Ephemeral runtime cleanup</CardTitle>
					<CardDescription>
						Inspect and delete stale KNE smoke and runtime namespaces before
						they build enough control-plane churn to hurt embedded etcd.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap items-center gap-2 text-sm">
						<Badge variant="secondary">
							total {props.adminEphemeralRuntimeSummary.total}
						</Badge>
						<Badge variant="outline">
							active {props.adminEphemeralRuntimeSummary.active}
						</Badge>
						<Badge variant="outline">
							inactive {props.adminEphemeralRuntimeSummary.inactive}
						</Badge>
						<Badge variant="outline">
							expired {props.adminEphemeralRuntimeSummary.expired}
						</Badge>
						<Badge variant="outline">
							eligible {props.adminEphemeralRuntimeSummary.eligibleForCleanup}
						</Badge>
						<Badge variant="outline">
							finalize {props.adminEphemeralRuntimeSummary.eligibleForForceFinalize}
						</Badge>
						<Badge variant="outline">
							terminating {props.adminEphemeralRuntimeSummary.terminating}
						</Badge>
						<Badge variant="outline">
							pods {props.adminEphemeralRuntimeSummary.resourceTotals.pods}
						</Badge>
						<Badge variant="outline">
							vms {props.adminEphemeralRuntimeSummary.resourceTotals.virtualMachines}
						</Badge>
						<Badge variant="outline">
							vmis {props.adminEphemeralRuntimeSummary.resourceTotals.virtualMachineInstances}
						</Badge>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							disabled={props.adminEphemeralRuntimesLoading}
							onClick={props.onRefreshEphemeralRuntimes}
						>
							Refresh inventory
						</Button>
						<Button
							variant="destructive"
							disabled={
								props.cleanupEphemeralRuntimesPending ||
								props.adminEphemeralRuntimeSummary.eligibleForCleanup === 0
							}
							onClick={props.onCleanupEligibleEphemeralRuntimes}
						>
							{props.cleanupEphemeralRuntimesPending
								? "Cleaning…"
								: "Cleanup eligible namespaces"}
						</Button>
						<Button
							variant="destructive"
							disabled={
								props.forceFinalizeEphemeralRuntimesPending ||
								props.adminEphemeralRuntimeSummary.eligibleForForceFinalize === 0
							}
							onClick={props.onForceFinalizeEligibleEphemeralRuntimes}
						>
							{props.forceFinalizeEphemeralRuntimesPending
								? "Finalizing…"
								: "Force finalize eligible namespaces"}
						</Button>
					</div>
					{props.cleanupEphemeralRuntimesResult ? (
						<div className="rounded-md border bg-muted/40 p-3 text-xs">
							cleaned={props.cleanupEphemeralRuntimesResult.namespacesCleaned} errors=
							{props.cleanupEphemeralRuntimesResult.errors?.length ?? 0}
						</div>
					) : null}
					{props.forceFinalizeEphemeralRuntimesResult ? (
						<div className="rounded-md border bg-muted/40 p-3 text-xs">
							finalized={props.forceFinalizeEphemeralRuntimesResult.namespacesFinalized} errors=
							{props.forceFinalizeEphemeralRuntimesResult.errors?.length ?? 0}
						</div>
					) : null}
					<div className="space-y-2">
						{props.adminEphemeralRuntimes.map((runtime) => (
							<div
								key={runtime.namespace}
								className="flex flex-col gap-3 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between"
							>
								<div className="space-y-1 text-sm">
									<div className="font-medium">{runtime.namespace}</div>
									<div className="text-muted-foreground">
										phase={runtime.phase} scope={runtime.userScopeId ?? "—"} owner=
										{runtime.owner}
									</div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											props.onCleanupEphemeralRuntimeNamespace(runtime.namespace)
										}
									>
										Cleanup namespace
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() =>
											props.onForceFinalizeEphemeralRuntimeNamespace(runtime.namespace)
										}
									>
										Force finalize
									</Button>
								</div>
							</div>
						))}
						{props.adminEphemeralRuntimes.length === 0 ? (
							<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
								No ephemeral runtimes found.
							</div>
						) : null}
					</div>
				</CardContent>
			</Card>
		</>
	);
}
