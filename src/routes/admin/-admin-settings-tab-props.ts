import type {
	AdminAuditTabProps,
	AdminOverviewTabProps,
	AdminTasksTabProps,
	AdminUsersTabProps,
} from "../../components/admin-settings-tab-types";
import type { AdminSettingsPageState } from "../../hooks/use-admin-settings-page";

export function buildAdminOverviewTabProps(
	page: AdminSettingsPageState,
): AdminOverviewTabProps {
	return {
		authSettings: page.authSettingsQ.data,
		authSettingsLoading: page.authSettingsQ.isLoading,
		authProviderDraft: page.authProviderDraft,
		breakGlassEnabledDraft: page.breakGlassEnabledDraft,
		breakGlassLabelDraft: page.breakGlassLabelDraft,
		saveAuthSettingsPending: page.saveAuthSettings.isPending,
		onAuthProviderChange: page.setAuthProviderDraft,
		onBreakGlassEnabledChange: page.setBreakGlassEnabledDraft,
		onBreakGlassLabelChange: page.setBreakGlassLabelDraft,
		onSaveAuthSettings: () => page.saveAuthSettings.mutate(),
		oidcSettings: page.oidcSettingsQ.data,
		oidcSettingsLoading: page.oidcSettingsQ.isLoading,
		oidcEnabledDraft: page.oidcEnabledDraft,
		oidcIssuerDraft: page.oidcIssuerDraft,
		oidcDiscoveryDraft: page.oidcDiscoveryDraft,
		oidcClientIDDraft: page.oidcClientIDDraft,
		oidcClientSecretDraft: page.oidcClientSecretDraft,
		oidcRedirectDraft: page.oidcRedirectDraft,
		saveOIDCSettingsPending: page.saveOIDCSettings.isPending,
		onOidcEnabledChange: page.setOidcEnabledDraft,
		onOidcIssuerChange: page.setOidcIssuerDraft,
		onOidcDiscoveryChange: page.setOidcDiscoveryDraft,
		onOidcClientIdChange: page.setOidcClientIDDraft,
		onOidcClientSecretChange: page.setOidcClientSecretDraft,
		onOidcRedirectChange: page.setOidcRedirectDraft,
		onSaveOIDCSettings: () => page.saveOIDCSettings.mutate(),
		config: page.cfgQ.data,
		configLoading: page.cfgQ.isLoading,
		impersonateStatus: page.impersonateStatusQ.data,
		sessionUsername: page.sessionQ.data?.username,
		impersonateUserOptions: page.impersonateUserOptions,
		impersonateTarget: page.impersonateTarget,
		impersonateStartPending: page.impersonateStart.isPending,
		impersonateStopPending: page.impersonateStop.isPending,
		onImpersonateTargetChange: page.setImpersonateTarget,
		onImpersonateStart: () => page.impersonateStart.mutate(),
		onImpersonateStop: () => page.impersonateStop.mutate(),
		quickDeploySource: page.quickDeployCatalogQ.data?.source,
		quickDeployRepo:
			page.quickDeployTemplateOptionsQ.data?.repo ??
			page.quickDeployCatalogQ.data?.repo,
		quickDeployBranch:
			page.quickDeployTemplateOptionsQ.data?.branch ??
			page.quickDeployCatalogQ.data?.branch,
		quickDeployDir:
			page.quickDeployTemplateOptionsQ.data?.dir ??
			page.quickDeployCatalogQ.data?.dir,
		selectedQuickDeployOption: page.selectedQuickDeployOption,
		availableQuickDeployTemplates: page.availableQuickDeployTemplates,
		quickDeployTemplates: page.quickDeployTemplates,
		quickDeployLookupFailed:
			page.blueprintNetlabTemplatesQ.isError ||
			page.quickDeployTemplateOptionsQ.isError,
		quickDeployCatalogLoading: page.quickDeployCatalogQ.isLoading,
		saveQuickDeployCatalogPending: page.saveQuickDeployCatalog.isPending,
		hasQuickDeployTemplateRows: page.hasQuickDeployTemplateRows,
		onSelectedQuickDeployOptionChange: page.setSelectedQuickDeployOption,
		onAddQuickDeployTemplateFromOption:
			page.addQuickDeployTemplateFromOption,
		onQuickDeployTemplateFieldChange: page.upsertQuickDeployTemplateField,
		onRemoveQuickDeployTemplate: page.removeQuickDeployTemplate,
		onAddQuickDeployTemplate: page.addQuickDeployTemplate,
		onAllowedProfilesChange: (index, value) =>
			page.upsertQuickDeployTemplateField(index, "allowedProfiles", value),
		onSaveQuickDeployCatalog: () => page.saveQuickDeployCatalog.mutate(),
		serviceNowGlobalConfig: page.serviceNowGlobalConfigQ.data,
		serviceNowGlobalConfigLoading: page.serviceNowGlobalConfigQ.isLoading,
		serviceNowInstanceURLDraft: page.serviceNowInstanceURLDraft,
		serviceNowAdminUsernameDraft: page.serviceNowAdminUsernameDraft,
		serviceNowAdminPasswordDraft: page.serviceNowAdminPasswordDraft,
		serviceNowBootstrapCredentialSetDraft:
			page.serviceNowBootstrapCredentialSetDraft,
		saveServiceNowGlobalConfigPending: page.saveServiceNowGlobalConfig.isPending,
		pushServiceNowForwardConfigPending: page.pushServiceNowForwardConfig.isPending,
		onServiceNowInstanceURLChange: page.setServiceNowInstanceURLDraft,
		onServiceNowAdminUsernameChange: page.setServiceNowAdminUsernameDraft,
		onServiceNowAdminPasswordChange: page.setServiceNowAdminPasswordDraft,
		onServiceNowBootstrapCredentialSetChange:
			page.setServiceNowBootstrapCredentialSetDraft,
		onSaveServiceNowGlobalConfig: () => page.saveServiceNowGlobalConfig.mutate(),
		onPushServiceNowForwardConfig: () => page.pushServiceNowForwardConfig.mutate(),
		teamsGlobalConfig: page.teamsGlobalConfigQ.data,
		teamsGlobalConfigLoading: page.teamsGlobalConfigQ.isLoading,
		teamsEnabledDraft: page.teamsEnabledDraft,
		teamsDisplayNameDraft: page.teamsDisplayNameDraft,
		teamsPublicBaseURLDraft: page.teamsPublicBaseURLDraft,
		teamsInboundSecretDraft: page.teamsInboundSecretDraft,
		teamsTestWebhookURLDraft: page.teamsTestWebhookURLDraft,
		saveTeamsGlobalConfigPending: page.saveTeamsGlobalConfig.isPending,
		testTeamsOutgoingPending: page.testTeamsOutgoing.isPending,
		onTeamsEnabledChange: page.setTeamsEnabledDraft,
		onTeamsDisplayNameChange: page.setTeamsDisplayNameDraft,
		onTeamsPublicBaseURLChange: page.setTeamsPublicBaseURLDraft,
		onTeamsInboundSecretChange: page.setTeamsInboundSecretDraft,
		onTeamsTestWebhookURLChange: page.setTeamsTestWebhookURLDraft,
		onSaveTeamsGlobalConfig: () => page.saveTeamsGlobalConfig.mutate(),
		onTestTeamsOutgoing: () => page.testTeamsOutgoing.mutate(),
		adminForwardSupportCredentialLoading:
			page.adminForwardSupportCredentialQ.isLoading,
		adminForwardSupportCredentialConfigured:
			page.adminForwardSupportCredentialQ.data?.configured ?? false,
		adminForwardSupportUsername:
			page.adminForwardSupportCredentialQ.data?.username ?? "",
		adminForwardSupportHasPassword:
			page.adminForwardSupportCredentialQ.data?.hasPassword ?? false,
		adminForwardSupportPassword: page.adminForwardSupportPassword,
		revealAdminForwardSupportCredentialPending:
			page.revealAdminForwardSupportCredentialMutation.isPending,
		onRevealAdminForwardSupportCredentialPassword: () =>
			page.revealAdminForwardSupportCredentialMutation.mutate(),
	};
}

export function buildAdminAuditTabProps(
	page: AdminSettingsPageState,
): AdminAuditTabProps {
	return {
		auditLimit: page.auditLimit,
		onAuditLimitChange: page.setAuditLimit,
		auditTimestamp: page.auditQ.data?.timestamp,
		auditEvents: page.auditQ.data?.events ?? [],
		auditColumns: page.auditColumns,
		auditLoading: page.auditQ.isLoading,
	};
}

export function buildAdminTasksTabProps(
	page: AdminSettingsPageState,
): AdminTasksTabProps {
	return {
		reconcileQueuedPending: page.reconcileQueued.isPending,
		reconcileRunningPending: page.reconcileRunning.isPending,
		onReconcileQueued: () => page.reconcileQueued.mutate(200),
		onReconcileRunning: () =>
			page.reconcileRunning.mutate({
				limit: 50,
				hardMaxRuntimeMinutes: 12 * 60,
				maxIdleMinutes: 120,
			}),
		cleanupScopeMode: page.cleanupScopeMode,
		onCleanupScopeModeChange: page.setCleanupScopeMode,
		cleanupScopeID: page.cleanupScopeID,
		onCleanupScopeIDChange: page.setCleanupScopeID,
		cleanupNamespace: page.cleanupNamespace,
		onCleanupNamespaceChange: page.setCleanupNamespace,
		allUserScopes: page.allUserScopes,
		cleanupTenantPodsPending: page.cleanupTenantPods.isPending,
		onPreviewCleanup: () => page.cleanupTenantPods.mutate(true),
		onRunCleanup: () => page.cleanupTenantPods.mutate(false),
		cleanupResult: page.cleanupResult,
	};
}

export function buildAdminUsersTabProps(
	page: AdminSettingsPageState,
): AdminUsersTabProps {
	return {
		manageUsername: page.manageUsername,
		manageInitialRole: page.manageInitialRole,
		availableRbacRoles: page.availableRbacRoles,
		createManagedUserPending: page.createManagedUser.isPending,
		onManageUsernameChange: page.setManageUsername,
		onManageInitialRoleChange: page.setManageInitialRole,
		onCreateManagedUser: () => page.createManagedUser.mutate(),
		deleteManagedUserQuery: page.deleteManagedUserQuery,
		deleteManagedUser: page.deleteManagedUser,
		filteredManagedDeleteUsers: page.filteredManagedDeleteUsers,
		deleteManagedUserPending: page.deleteManagedUserMutation.isPending,
		onDeleteManagedUserQueryChange: page.setDeleteManagedUserQuery,
		onDeleteManagedUserChange: page.setDeleteManagedUser,
		onDeleteManagedUser: () => page.deleteManagedUserMutation.mutate(),
		rbacUserQuery: page.rbacUserQuery,
		rbacTargetUser: page.rbacTargetUser,
		rbacTargetRole: page.rbacTargetRole,
		filteredRbacKnownUsers: page.filteredRbacKnownUsers,
		upsertRbacRolePending: page.upsertRbacRole.isPending,
		onRbacUserQueryChange: page.setRbacUserQuery,
		onRbacTargetUserChange: page.setRbacTargetUser,
		onRbacTargetRoleChange: page.setRbacTargetRole,
		onUpsertRbacRole: () => page.upsertRbacRole.mutate(),
		adminUserRolesLoading: page.adminUserRolesQ.isLoading,
		filteredRbacRows: page.filteredRbacRows,
		revokeRbacRolePending: page.revokeRbacRole.isPending,
		onRevokeRbacRole: (payload) => page.revokeRbacRole.mutate(payload),
		apiPermTargetUser: page.apiPermTargetUser,
		rbacKnownUsers: page.rbacKnownUsers,
		apiPermFilter: page.apiPermFilter,
		apiDraftOverrideCount: page.apiDraftOverrideCount,
		apiCatalogLoading: page.apiCatalogQ.isLoading,
		userApiPermsLoading: page.userApiPermsQ.isLoading,
		filteredApiCatalogEntries: page.filteredApiCatalogEntries,
		apiPermDraft: page.apiPermDraft,
		saveUserApiPermissionsPending: page.saveUserApiPermissions.isPending,
		onApiPermTargetUserChange: page.setApiPermTargetUser,
		onApiPermFilterChange: page.setApiPermFilter,
		onReloadUserApiPerms: () => {
			void page.userApiPermsQ.refetch();
		},
		onSaveUserApiPermissions: () => page.saveUserApiPermissions.mutate(),
		onApiPermDraftChange: (key, nextDecision) => {
			page.setApiPermDraft((prev) => {
				if (nextDecision === "inherit") {
					const next = { ...prev };
					delete next[key];
					return next;
				}
				return { ...prev, [key]: nextDecision };
			});
		},
		apiPermissionKey: page.apiPermissionKey,
		purgeUserQuery: page.purgeUserQuery,
		purgeUsername: page.purgeUsername,
		filteredPurgeUserOptions: page.filteredPurgeUserOptions,
		purgeUserPending: page.purgeUser.isPending,
		onPurgeUserQueryChange: page.setPurgeUserQuery,
		onPurgeUsernameChange: page.setPurgeUsername,
		onPurgeUser: () => page.purgeUser.mutate(),
		platformPolicyUserQuery: page.platformPolicyUserQuery,
		platformPolicyTargetUser: page.platformPolicyTargetUser,
		filteredPlatformPolicyUsers: page.filteredPlatformPolicyUsers,
		platformPolicySearchMatches: page.platformPolicySearchMatches,
		platformPolicySearchCount: page.platformPolicySearchCount,
		platformPolicyLoading: page.platformPolicyQ.isLoading,
		platformPolicyProfiles: page.platformPolicyQ.data?.profiles ?? [],
		platformPolicyOperatingModes: page.platformPolicyQ.data?.operatingModes ?? [],
		platformPolicyPrimaryOperatingMode:
			page.platformPolicyQ.data?.primaryOperatingMode ?? "",
		platformPolicyCapabilities: page.platformPolicyQ.data?.capabilities ?? [],
		platformPolicyQuota: page.platformPolicyQ.data?.quota ?? null,
		platformProfileDraft: page.platformProfileDraft,
		platformQuotaDraft: page.platformQuotaDraft,
		platformPolicyDerivedCapabilities:
			page.platformPolicyDerivedCapabilities,
		platformQuotaValidationErrors: page.platformQuotaValidationErrors,
		platformQuotaHasErrors: page.platformQuotaHasErrors,
		savePlatformProfilesPending: page.savePlatformProfiles.isPending,
		savePlatformQuotaPending: page.savePlatformQuota.isPending,
		adminForwardTenantResetRunsLoading:
			page.adminForwardTenantResetRunsQ.isLoading,
		adminForwardTenantResetRuns: page.adminForwardTenantResetRunsQ.data?.runs ?? [],
		adminForwardTenantResetMode: page.adminForwardTenantResetMode,
		adminForwardTenantResetConfirm: page.adminForwardTenantResetConfirm,
		requestAdminForwardTenantResetPending:
			page.requestAdminForwardTenantReset.isPending,
		onPlatformPolicyUserQueryChange: page.setPlatformPolicyUserQuery,
		onPlatformPolicyTargetUserChange: page.setPlatformPolicyTargetUser,
		onPlatformProfileToggle: (profile, enabled) => {
			page.setPlatformProfileDraft((prev) => {
				if (enabled) {
					return prev.includes(profile) ? prev : [...prev, profile];
				}
				return prev.filter((item) => item !== profile);
			});
		},
		onPlatformQuotaDraftChange: (field, value) => {
			page.setPlatformQuotaDraft((prev) => ({
				...prev,
				[field]: value,
			}));
		},
		onSavePlatformProfiles: () => page.savePlatformProfiles.mutate(),
		onSavePlatformQuota: () => page.savePlatformQuota.mutate(),
		onAdminForwardTenantResetModeChange: page.setAdminForwardTenantResetMode,
		onAdminForwardTenantResetConfirmChange:
			page.setAdminForwardTenantResetConfirm,
		onRequestAdminForwardTenantReset: () =>
			page.requestAdminForwardTenantReset.mutate(),
	};
}
