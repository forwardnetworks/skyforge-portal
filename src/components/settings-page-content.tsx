import type {
	AdminAuditTabProps,
	AdminOverviewTabProps,
	AdminTasksTabProps,
	AdminUsersTabProps,
} from "./admin-settings-tab-types";
import { AdminOverviewAuthCard } from "./admin-overview-auth-card";
import { AdminOverviewConfigCard } from "./admin-overview-config-card";
import { AdminOverviewPublicAccessCard } from "./admin-overview-public-access-card";
import { AdminOverviewForwardDemoSeedsCard } from "./admin-overview-forward-demo-seeds-card";
import { AdminOverviewForwardSupportCard } from "./admin-overview-forward-support-card";
import { AdminOverviewHetznerBurstCard } from "./admin-overview-hetzner-burst-card";
import { AdminOverviewImpersonationCard } from "./admin-overview-impersonation-card";
import { AdminOverviewOIDCCard } from "./admin-overview-oidc-card";
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
import type { UserSettingsPageState } from "./user-settings-types";
import { UserSettingsContent } from "./user-settings-content";
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
import type {
	SettingsSectionDefinition,
	SettingsSectionId,
} from "../lib/settings-sections";

type SettingsAdminSectionProps = {
	overview: AdminOverviewTabProps;
	users: AdminUsersTabProps;
	tasks: AdminTasksTabProps;
	audit: AdminAuditTabProps;
};

export function SettingsSectionContent(props: {
	section: SettingsSectionId;
	sectionDefinition: SettingsSectionDefinition;
	userPage: UserSettingsPageState;
	adminProps?: SettingsAdminSectionProps;
}) {
	const { section, sectionDefinition, userPage, adminProps } = props;

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">
					{sectionDefinition.label}
				</h1>
				<p className="text-sm text-muted-foreground">
					{sectionDefinition.description}
				</p>
			</div>
			{renderSectionBody({ section, userPage, adminProps })}
		</div>
	);
}

function renderSectionBody(args: {
	section: SettingsSectionId;
	userPage: UserSettingsPageState;
	adminProps?: SettingsAdminSectionProps;
}) {
	const { section, userPage, adminProps } = args;

	switch (section) {
		case "profile":
			return <UserSettingsContent page={userPage} />;
		case "identity":
			if (!adminProps) return null;
			return (
				<>
					<AdminOverviewAuthCard {...adminProps.overview} />
					<AdminOverviewOIDCCard {...adminProps.overview} />
					<AdminOverviewImpersonationCard {...adminProps.overview} />
				</>
			);
		case "integrations":
			if (!adminProps) return null;
			return (
				<>
					<AdminOverviewTeamsCard {...adminProps.overview} />
					<AdminOverviewServiceNowCard {...adminProps.overview} />
				</>
			);
		case "forward":
			if (!adminProps) return null;
			return (
				<>
					<AdminOverviewForwardSupportCard {...adminProps.overview} />
					<AdminOverviewForwardDemoSeedsCard {...adminProps.overview} />
					<AdminOverviewQuickDeployCard {...adminProps.overview} />
				</>
			);
		case "runtime":
			if (!adminProps) return null;
			return (
				<>
					<AdminOverviewHetznerBurstCard {...adminProps.overview} />
					<AdminOverviewRuntimePressureCard {...adminProps.overview} />
					<AdminOverviewPublicAccessCard {...adminProps.overview} />
				</>
			);
		case "users":
			if (!adminProps) return null;
			return (
				<>
					<AdminUsersManagementCard {...adminProps.users} />
					<AdminUsersRbacCard {...adminProps.users} />
					<AdminUsersPlatformPolicyCard {...adminProps.users} />
					<AdminUsersForwardResetCard {...adminProps.users} />
					<AdminUsersApiPermissionsCard {...adminProps.users} />
					<AdminUsersPurgeCard {...adminProps.users} />
				</>
			);
		case "maintenance":
			if (!adminProps) return null;
			return (
				<>
					<AdminOverviewConfigCard {...adminProps.overview} />
					<AdminAuditSection {...adminProps.audit} />
					<AdminMaintenanceSection {...adminProps.tasks} />
				</>
			);
		default:
			return null;
	}
}

function AdminAuditSection(props: AdminAuditTabProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Audit log</CardTitle>
				<CardDescription>Recent admin and user actions.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">Limit</span>
						<Input
							className="w-28"
							value={props.auditLimit}
							onChange={(e) => props.onAuditLimitChange(e.target.value)}
						/>
					</div>
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

function AdminMaintenanceSection(props: AdminTasksTabProps) {
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
							finalize{" "}
							{props.adminEphemeralRuntimeSummary.eligibleForForceFinalize}
						</Badge>
						<Badge variant="outline">
							terminating {props.adminEphemeralRuntimeSummary.terminating}
						</Badge>
						<Badge variant="outline">
							pods {props.adminEphemeralRuntimeSummary.resourceTotals.pods}
						</Badge>
						<Badge variant="outline">
							vms{" "}
							{
								props.adminEphemeralRuntimeSummary.resourceTotals
									.virtualMachines
							}
						</Badge>
						<Badge variant="outline">
							vmis{" "}
							{
								props.adminEphemeralRuntimeSummary.resourceTotals
									.virtualMachineInstances
							}
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
								props.adminEphemeralRuntimeSummary.eligibleForForceFinalize ===
									0
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
							cleaned={props.cleanupEphemeralRuntimesResult.cleanedNamespaces}{" "}
							errors=
							{props.cleanupEphemeralRuntimesResult.errors.length}
						</div>
					) : null}
					{props.forceFinalizeEphemeralRuntimesResult ? (
						<div className="rounded-md border bg-muted/40 p-3 text-xs">
							finalized=
							{props.forceFinalizeEphemeralRuntimesResult.finalizedNamespaces}{" "}
							errors=
							{props.forceFinalizeEphemeralRuntimesResult.errors.length}
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
										state={runtime.state} scope={runtime.scopeSlug} owner=
										{runtime.owner}
									</div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											props.onCleanupEphemeralRuntimeNamespace(
												runtime.namespace,
											)
										}
									>
										Cleanup namespace
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() =>
											props.onForceFinalizeEphemeralRuntimeNamespace(
												runtime.namespace,
											)
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
