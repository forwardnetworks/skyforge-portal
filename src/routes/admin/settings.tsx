import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	AdminAuditTab,
	AdminOverviewTab,
	AdminTasksTab,
	AdminUsersTab,
} from "../../components/admin-settings-tabs";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useAdminSettingsPage } from "../../hooks/use-admin-settings-page";
import { requireAdminRouteAccess } from "../../lib/admin-route";

export const Route = createFileRoute("/admin/settings")({
	beforeLoad: async ({ context }) => {
		await requireAdminRouteAccess(context);
		throw redirect({ to: "/settings", search: { tab: "admin" } });
	},
	component: AdminSettingsPage,
});

export function AdminSettingsPage() {
	const page = useAdminSettingsPage();

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle>System settings</CardTitle>
					<CardDescription>Admin-only settings for Skyforge.</CardDescription>
				</CardHeader>
			</Card>

			{!page.isAdmin && (
				<Card variant="danger">
					<CardContent className="pt-6">
						<div className="text-center font-medium">
							Admin access required.
						</div>
					</CardContent>
				</Card>
			)}

			{page.isAdmin && (
				<Tabs defaultValue="overview">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="audit">Audit</TabsTrigger>
						<TabsTrigger value="tasks">Tasks</TabsTrigger>
						<TabsTrigger value="users">Users</TabsTrigger>
					</TabsList>

					<AdminOverviewTab
						authSettings={page.authSettingsQ.data}
						authSettingsLoading={page.authSettingsQ.isLoading}
						authProviderDraft={page.authProviderDraft}
						breakGlassEnabledDraft={page.breakGlassEnabledDraft}
						breakGlassLabelDraft={page.breakGlassLabelDraft}
						saveAuthSettingsPending={page.saveAuthSettings.isPending}
						onAuthProviderChange={page.setAuthProviderDraft}
						onBreakGlassEnabledChange={page.setBreakGlassEnabledDraft}
						onBreakGlassLabelChange={page.setBreakGlassLabelDraft}
						onSaveAuthSettings={() => page.saveAuthSettings.mutate()}
						oidcSettings={page.oidcSettingsQ.data}
						oidcSettingsLoading={page.oidcSettingsQ.isLoading}
						oidcEnabledDraft={page.oidcEnabledDraft}
						oidcIssuerDraft={page.oidcIssuerDraft}
						oidcDiscoveryDraft={page.oidcDiscoveryDraft}
						oidcClientIDDraft={page.oidcClientIDDraft}
						oidcClientSecretDraft={page.oidcClientSecretDraft}
						oidcRedirectDraft={page.oidcRedirectDraft}
						saveOIDCSettingsPending={page.saveOIDCSettings.isPending}
						onOidcEnabledChange={page.setOidcEnabledDraft}
						onOidcIssuerChange={page.setOidcIssuerDraft}
						onOidcDiscoveryChange={page.setOidcDiscoveryDraft}
						onOidcClientIdChange={page.setOidcClientIDDraft}
						onOidcClientSecretChange={page.setOidcClientSecretDraft}
						onOidcRedirectChange={page.setOidcRedirectDraft}
						onSaveOIDCSettings={() => page.saveOIDCSettings.mutate()}
						config={page.cfgQ.data}
						configLoading={page.cfgQ.isLoading}
						impersonateStatus={page.impersonateStatusQ.data}
						sessionUsername={page.sessionQ.data?.username}
						impersonateUserOptions={page.impersonateUserOptions}
						impersonateTarget={page.impersonateTarget}
						impersonateStartPending={page.impersonateStart.isPending}
						impersonateStopPending={page.impersonateStop.isPending}
						onImpersonateTargetChange={page.setImpersonateTarget}
						onImpersonateStart={() => page.impersonateStart.mutate()}
						onImpersonateStop={() => page.impersonateStop.mutate()}
						quickDeploySource={page.quickDeployCatalogQ.data?.source}
						quickDeployRepo={
							page.quickDeployTemplateOptionsQ.data?.repo ??
							page.quickDeployCatalogQ.data?.repo
						}
						quickDeployBranch={
							page.quickDeployTemplateOptionsQ.data?.branch ??
							page.quickDeployCatalogQ.data?.branch
						}
						quickDeployDir={
							page.quickDeployTemplateOptionsQ.data?.dir ??
							page.quickDeployCatalogQ.data?.dir
						}
						selectedQuickDeployOption={page.selectedQuickDeployOption}
						availableQuickDeployTemplates={page.availableQuickDeployTemplates}
						quickDeployTemplates={page.quickDeployTemplates}
						quickDeployLookupFailed={
							page.blueprintNetlabTemplatesQ.isError ||
							page.quickDeployTemplateOptionsQ.isError
						}
						quickDeployCatalogLoading={page.quickDeployCatalogQ.isLoading}
						saveQuickDeployCatalogPending={
							page.saveQuickDeployCatalog.isPending
						}
						hasQuickDeployTemplateRows={page.hasQuickDeployTemplateRows}
						onSelectedQuickDeployOptionChange={
							page.setSelectedQuickDeployOption
						}
						onAddQuickDeployTemplateFromOption={
							page.addQuickDeployTemplateFromOption
						}
						onQuickDeployTemplateFieldChange={
							page.upsertQuickDeployTemplateField
						}
						onRemoveQuickDeployTemplate={page.removeQuickDeployTemplate}
						onAddQuickDeployTemplate={page.addQuickDeployTemplate}
						onSaveQuickDeployCatalog={() =>
							page.saveQuickDeployCatalog.mutate()
						}
						serviceNowGlobalConfig={page.serviceNowGlobalConfigQ.data}
						serviceNowGlobalConfigLoading={
							page.serviceNowGlobalConfigQ.isLoading
						}
						serviceNowInstanceURLDraft={page.serviceNowInstanceURLDraft}
						serviceNowAdminUsernameDraft={page.serviceNowAdminUsernameDraft}
						serviceNowAdminPasswordDraft={page.serviceNowAdminPasswordDraft}
						serviceNowBootstrapCredentialSetDraft={
							page.serviceNowBootstrapCredentialSetDraft
						}
						saveServiceNowGlobalConfigPending={
							page.saveServiceNowGlobalConfig.isPending
						}
						pushServiceNowForwardConfigPending={
							page.pushServiceNowForwardConfig.isPending
						}
						onServiceNowInstanceURLChange={page.setServiceNowInstanceURLDraft}
						onServiceNowAdminUsernameChange={
							page.setServiceNowAdminUsernameDraft
						}
						onServiceNowAdminPasswordChange={
							page.setServiceNowAdminPasswordDraft
						}
						onServiceNowBootstrapCredentialSetChange={
							page.setServiceNowBootstrapCredentialSetDraft
						}
						onSaveServiceNowGlobalConfig={() =>
							page.saveServiceNowGlobalConfig.mutate()
						}
						onPushServiceNowForwardConfig={() =>
							page.pushServiceNowForwardConfig.mutate()
						}
					/>

					<AdminAuditTab
						auditLimit={page.auditLimit}
						onAuditLimitChange={page.setAuditLimit}
						auditTimestamp={page.auditQ.data?.timestamp}
						auditEvents={page.auditQ.data?.events ?? []}
						auditColumns={page.auditColumns}
						auditLoading={page.auditQ.isLoading}
					/>

					<AdminTasksTab
						reconcileQueuedPending={page.reconcileQueued.isPending}
						reconcileRunningPending={page.reconcileRunning.isPending}
						onReconcileQueued={() => page.reconcileQueued.mutate(200)}
						onReconcileRunning={() =>
							page.reconcileRunning.mutate({
								limit: 50,
								hardMaxRuntimeMinutes: 12 * 60,
								maxIdleMinutes: 120,
							})
						}
						cleanupScopeMode={page.cleanupScopeMode}
						onCleanupScopeModeChange={page.setCleanupScopeMode}
						cleanupScopeID={page.cleanupScopeID}
						onCleanupScopeIDChange={page.setCleanupScopeID}
						cleanupNamespace={page.cleanupNamespace}
						onCleanupNamespaceChange={page.setCleanupNamespace}
						allUserScopes={page.allUserScopes}
						cleanupWorkspacePodsPending={page.cleanupWorkspacePods.isPending}
						onPreviewCleanup={() => page.cleanupWorkspacePods.mutate(true)}
						onRunCleanup={() => page.cleanupWorkspacePods.mutate(false)}
						cleanupResult={page.cleanupResult}
					/>

					<AdminUsersTab
						manageUsername={page.manageUsername}
						manageInitialRole={page.manageInitialRole}
						availableRbacRoles={page.availableRbacRoles}
						createManagedUserPending={page.createManagedUser.isPending}
						onManageUsernameChange={page.setManageUsername}
						onManageInitialRoleChange={page.setManageInitialRole}
						onCreateManagedUser={() => page.createManagedUser.mutate()}
						deleteManagedUserQuery={page.deleteManagedUserQuery}
						deleteManagedUser={page.deleteManagedUser}
						filteredManagedDeleteUsers={page.filteredManagedDeleteUsers}
						deleteManagedUserPending={page.deleteManagedUserMutation.isPending}
						onDeleteManagedUserQueryChange={page.setDeleteManagedUserQuery}
						onDeleteManagedUserChange={page.setDeleteManagedUser}
						onDeleteManagedUser={() => page.deleteManagedUserMutation.mutate()}
						rbacUserQuery={page.rbacUserQuery}
						rbacTargetUser={page.rbacTargetUser}
						rbacTargetRole={page.rbacTargetRole}
						filteredRbacKnownUsers={page.filteredRbacKnownUsers}
						upsertRbacRolePending={page.upsertRbacRole.isPending}
						onRbacUserQueryChange={page.setRbacUserQuery}
						onRbacTargetUserChange={page.setRbacTargetUser}
						onRbacTargetRoleChange={page.setRbacTargetRole}
						onUpsertRbacRole={() => page.upsertRbacRole.mutate()}
						adminUserRolesLoading={page.adminUserRolesQ.isLoading}
						filteredRbacRows={page.filteredRbacRows}
						revokeRbacRolePending={page.revokeRbacRole.isPending}
						onRevokeRbacRole={(payload) => page.revokeRbacRole.mutate(payload)}
						apiPermTargetUser={page.apiPermTargetUser}
						rbacKnownUsers={page.rbacKnownUsers}
						apiPermFilter={page.apiPermFilter}
						apiDraftOverrideCount={page.apiDraftOverrideCount}
						apiCatalogLoading={page.apiCatalogQ.isLoading}
						userApiPermsLoading={page.userApiPermsQ.isLoading}
						filteredApiCatalogEntries={page.filteredApiCatalogEntries}
						apiPermDraft={page.apiPermDraft}
						saveUserApiPermissionsPending={
							page.saveUserApiPermissions.isPending
						}
						onApiPermTargetUserChange={page.setApiPermTargetUser}
						onApiPermFilterChange={page.setApiPermFilter}
						onReloadUserApiPerms={() => {
							void page.userApiPermsQ.refetch();
						}}
						onSaveUserApiPermissions={() =>
							page.saveUserApiPermissions.mutate()
						}
						onApiPermDraftChange={(key, nextDecision) => {
							page.setApiPermDraft((prev) => {
								if (nextDecision === "inherit") {
									const next = { ...prev };
									delete next[key];
									return next;
								}
								return { ...prev, [key]: nextDecision };
							});
						}}
						apiPermissionKey={page.apiPermissionKey}
						purgeUserQuery={page.purgeUserQuery}
						purgeUsername={page.purgeUsername}
						filteredPurgeUserOptions={page.filteredPurgeUserOptions}
						purgeUserPending={page.purgeUser.isPending}
						onPurgeUserQueryChange={page.setPurgeUserQuery}
						onPurgeUsernameChange={page.setPurgeUsername}
						onPurgeUser={() => page.purgeUser.mutate()}
					/>
				</Tabs>
			)}
		</div>
	);
}
