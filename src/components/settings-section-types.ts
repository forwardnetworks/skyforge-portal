import type {
	AdminAPICatalogEntry,
	AdminAuditExportSignatureRecord,
	AdminAuditIntegrityStatus,
	AdminAuditResponse,
	AdminAuthSettingsResponse,
	AdminEffectiveConfigResponse,
	AdminEphemeralRuntimeCleanupResponse,
	AdminEphemeralRuntimeFinalizeResponse,
	AdminEphemeralRuntimeNamespaceRecord,
	AdminEphemeralRuntimeResourceCounts,
	AdminForwardDemoSeedCatalogResponse,
	AdminForwardTenantResetRun,
	AdminHetznerBurstRuntimePolicyResponse,
	AdminHetznerBurstStatusResponse,
	AdminImpersonateStatusResponse,
	AdminOIDCSettingsResponse,
	AdminServiceNowGlobalConfigResponse,
	AdminTeamsGlobalConfigResponse,
	AdminTenantPodCleanupResponse,
	AdminUserRoleRecord,
	QuickDeployTemplate,
	SkyforgeUserScope,
	VerifyAdminAuditExportSignatureResponse,
} from "../lib/api-client";
import type { DataTableColumn } from "./ui/data-table";

type QuickDeployField = keyof QuickDeployTemplate;

export type AdminIdentitySectionProps = {
	authSettings?: AdminAuthSettingsResponse;
	authSettingsLoading: boolean;
	authProviderDraft: "local" | "okta";
	breakGlassEnabledDraft: boolean;
	breakGlassLabelDraft: string;
	saveAuthSettingsPending: boolean;
	onAuthProviderChange: (value: "local" | "okta") => void;
	onBreakGlassEnabledChange: (enabled: boolean) => void;
	onBreakGlassLabelChange: (value: string) => void;
	onSaveAuthSettings: () => void;
	oidcSettings?: AdminOIDCSettingsResponse;
	oidcSettingsLoading: boolean;
	oidcEnabledDraft: boolean;
	oidcIssuerDraft: string;
	oidcDiscoveryDraft: string;
	oidcClientIDDraft: string;
	oidcClientSecretDraft: string;
	oidcRedirectDraft: string;
	saveOIDCSettingsPending: boolean;
	onOidcEnabledChange: (enabled: boolean) => void;
	onOidcIssuerChange: (value: string) => void;
	onOidcDiscoveryChange: (value: string) => void;
	onOidcClientIdChange: (value: string) => void;
	onOidcClientSecretChange: (value: string) => void;
	onOidcRedirectChange: (value: string) => void;
	onSaveOIDCSettings: () => void;
	impersonateStatus?: AdminImpersonateStatusResponse;
	sessionUsername?: string;
	impersonateUserOptions: string[];
	impersonateTarget: string;
	impersonateStartPending: boolean;
	impersonateStopPending: boolean;
	onImpersonateTargetChange: (value: string) => void;
	onImpersonateStart: () => void;
	onImpersonateStop: () => void;
};

export type AdminIntegrationsSectionProps = {
	serviceNowGlobalConfig?: AdminServiceNowGlobalConfigResponse;
	serviceNowGlobalConfigLoading: boolean;
	serviceNowInstanceURLDraft: string;
	serviceNowAdminUsernameDraft: string;
	serviceNowAdminPasswordDraft: string;
	saveServiceNowGlobalConfigPending: boolean;
	pushServiceNowForwardConfigPending: boolean;
	onServiceNowInstanceURLChange: (value: string) => void;
	onServiceNowAdminUsernameChange: (value: string) => void;
	onServiceNowAdminPasswordChange: (value: string) => void;
	onSaveServiceNowGlobalConfig: () => void;
	onPushServiceNowForwardConfig: () => void;
	teamsGlobalConfig?: AdminTeamsGlobalConfigResponse;
	teamsGlobalConfigLoading: boolean;
	teamsEnabledDraft: boolean;
	teamsDisplayNameDraft: string;
	teamsPublicBaseURLDraft: string;
	teamsInboundSecretDraft: string;
	teamsTestWebhookURLDraft: string;
	saveTeamsGlobalConfigPending: boolean;
	testTeamsOutgoingPending: boolean;
	onTeamsEnabledChange: (enabled: boolean) => void;
	onTeamsDisplayNameChange: (value: string) => void;
	onTeamsPublicBaseURLChange: (value: string) => void;
	onTeamsInboundSecretChange: (value: string) => void;
	onTeamsTestWebhookURLChange: (value: string) => void;
	onSaveTeamsGlobalConfig: () => void;
	onTestTeamsOutgoing: () => void;
};

export type AdminForwardSectionProps = {
	quickDeploySource?: string;
	quickDeployRepo?: string;
	quickDeployBranch?: string;
	quickDeployDir?: string;
	selectedQuickDeployOption: string;
	availableQuickDeployTemplates: string[];
	quickDeployTemplates: QuickDeployTemplate[];
	quickDeployLookupFailed: boolean;
	quickDeployCatalogLoading: boolean;
	saveQuickDeployCatalogPending: boolean;
	hasQuickDeployTemplateRows: boolean;
	onSelectedQuickDeployOptionChange: (value: string) => void;
	onAddQuickDeployTemplateFromOption: () => void;
	onQuickDeployTemplateFieldChange: (
		index: number,
		field: QuickDeployField,
		value: string,
	) => void;
	onRemoveQuickDeployTemplate: (index: number) => void;
	onAddQuickDeployTemplate: () => void;
	onAllowedProfilesChange: (index: number, value: string) => void;
	onSaveQuickDeployCatalog: () => void;
	forwardDemoSeedCatalog?: AdminForwardDemoSeedCatalogResponse;
	forwardDemoSeedCatalogLoading: boolean;
	uploadForwardDemoSeedPending: boolean;
	updateForwardDemoSeedPending: boolean;
	saveForwardDemoSeedConfigPending: boolean;
	deleteForwardDemoSeedPending: boolean;
	onUploadForwardDemoSeed: (value: {
		note: string;
		networkName?: string;
		fileName: string;
		contentBase64: string;
		enabled?: boolean;
	}) => void;
	onUpdateForwardDemoSeed: (value: {
		seedID: string;
		note?: string;
		enabled?: boolean;
		repeatCount?: number;
		order?: number;
	}) => void;
	onSaveForwardDemoSeedConfig: (value: { networkName: string }) => void;
	onDeleteForwardDemoSeed: (seedID: string) => void;
	adminForwardSupportCredentialLoading: boolean;
	adminForwardSupportCredentialConfigured: boolean;
	adminForwardSupportUsername: string;
	adminForwardSupportHasPassword: boolean;
	adminForwardSupportPassword: string;
	adminForwardSupportLaunchHref: string;
	revealAdminForwardSupportCredentialPending: boolean;
	onRevealAdminForwardSupportCredentialPassword: () => void;
	reconcileAdminForwardCustomerBannerPending: boolean;
	onReconcileAdminForwardCustomerBanner: () => void;
};

export type AdminConfigSectionProps = {
	config?: AdminEffectiveConfigResponse;
	configLoading: boolean;
};

export type AdminRuntimeSummaryProps = {
	adminEphemeralRuntimeSummary?: {
		total: number;
		active: number;
		inactive: number;
		expired: number;
		eligibleForCleanup: number;
		eligibleForForceFinalize: number;
		terminating: number;
		resourceTotals: AdminEphemeralRuntimeResourceCounts;
	};
};

export type AdminRuntimeSectionProps = AdminConfigSectionProps &
	AdminRuntimeSummaryProps & {
		hetznerBurstStatus?: AdminHetznerBurstStatusResponse;
		hetznerBurstStatusLoading: boolean;
		hetznerBurstRuntimePolicy?: AdminHetznerBurstRuntimePolicyResponse;
		hetznerBurstRuntimePolicyLoading: boolean;
		hetznerBurstEnabledDraft: boolean;
		hetznerBurstProvisioningEnabledDraft: boolean;
		saveHetznerBurstRuntimePolicyPending: boolean;
		onHetznerBurstEnabledChange: (enabled: boolean) => void;
		onHetznerBurstProvisioningEnabledChange: (enabled: boolean) => void;
		onSaveHetznerBurstRuntimePolicy: () => void;
	};

export type AdminAuditSectionProps = {
	auditLimit: string;
	onAuditLimitChange: (value: string) => void;
	auditActor: string;
	onAuditActorChange: (value: string) => void;
	auditActorType: string;
	onAuditActorTypeChange: (value: string) => void;
	auditImpersonated: string;
	onAuditImpersonatedChange: (value: string) => void;
	auditEventType: string;
	onAuditEventTypeChange: (value: string) => void;
	auditCategory: string;
	onAuditCategoryChange: (value: string) => void;
	auditOutcome: string;
	onAuditOutcomeChange: (value: string) => void;
	auditSeverity: string;
	onAuditSeverityChange: (value: string) => void;
	auditTargetType: string;
	onAuditTargetTypeChange: (value: string) => void;
	auditTarget: string;
	onAuditTargetChange: (value: string) => void;
	auditAuthMethod: string;
	onAuditAuthMethodChange: (value: string) => void;
	auditSourceIP: string;
	onAuditSourceIPChange: (value: string) => void;
	auditQuery: string;
	onAuditQueryChange: (value: string) => void;
	auditSince: string;
	onAuditSinceChange: (value: string) => void;
	auditUntil: string;
	onAuditUntilChange: (value: string) => void;
	onAuditQuickRangeChange: (value: string) => void;
	onAuditClearFilters: () => void;
	auditTimestamp?: string;
	auditEvents: AdminAuditResponse["events"];
	auditColumns: DataTableColumn<AdminAuditResponse["events"][number]>[];
	auditSummary?: AdminAuditResponse["summary"];
	auditIntegrityStatus?: AdminAuditIntegrityStatus;
	auditIntegrityLoading: boolean;
	auditExportSignatures: AdminAuditExportSignatureRecord[];
	auditExportSignaturesLoading: boolean;
	auditVerifyResult: VerifyAdminAuditExportSignatureResponse | null;
	auditVerifyPending: boolean;
	auditVerifyTargetID: string | null;
	auditVerifyError: string | null;
	auditLoading: boolean;
	selectedAuditEventID: number | null;
	onSelectAuditEvent: (id: number | null) => void;
	selectedAuditEvent?: AdminAuditResponse["events"][number];
	selectedAuditEventLoading: boolean;
	selectedAuditEventJSON: string;
	auditSavedViewName: string;
	onAuditSavedViewNameChange: (value: string) => void;
	auditSavedViews: { id: string; name: string }[];
	onAuditSaveView: () => void;
	onAuditLoadView: (id: string) => void;
	onAuditDeleteView: (id: string) => void;
	onAuditExport: (format: "csv" | "jsonl") => void;
	onAuditVerifySignature: (signatureID: string, file: File | null) => void;
};

export type AdminTasksSectionProps = {
	reconcileQueuedPending: boolean;
	reconcileRunningPending: boolean;
	onReconcileQueued: () => void;
	onReconcileRunning: () => void;
	cleanupScopeMode: "all" | "scope";
	onCleanupScopeModeChange: (value: "all" | "scope") => void;
	cleanupScopeID: string;
	onCleanupScopeIDChange: (value: string) => void;
	cleanupNamespace: string;
	onCleanupNamespaceChange: (value: string) => void;
	allUserScopes: SkyforgeUserScope[];
	cleanupTenantPodsPending: boolean;
	onPreviewCleanup: () => void;
	onRunCleanup: () => void;
	cleanupResult: AdminTenantPodCleanupResponse | null;
	adminEphemeralRuntimesLoading: boolean;
	adminEphemeralRuntimes: AdminEphemeralRuntimeNamespaceRecord[];
	adminEphemeralRuntimeSummary: {
		total: number;
		active: number;
		inactive: number;
		expired: number;
		eligibleForCleanup: number;
		eligibleForForceFinalize: number;
		terminating: number;
		resourceTotals: AdminEphemeralRuntimeResourceCounts;
	};
	cleanupEphemeralRuntimesPending: boolean;
	cleanupEphemeralRuntimesResult: AdminEphemeralRuntimeCleanupResponse | null;
	forceFinalizeEphemeralRuntimesPending: boolean;
	forceFinalizeEphemeralRuntimesResult: AdminEphemeralRuntimeFinalizeResponse | null;
	onRefreshEphemeralRuntimes: () => void;
	onCleanupEligibleEphemeralRuntimes: () => void;
	onCleanupEphemeralRuntimeNamespace: (namespace: string) => void;
	onForceFinalizeEligibleEphemeralRuntimes: () => void;
	onForceFinalizeEphemeralRuntimeNamespace: (namespace: string) => void;
};

export type AdminUsersSectionProps = {
	manageUsername: string;
	manageInitialRole: string;
	manageProvisionDefaultUserScope: boolean;
	availableRbacRoles: string[];
	createManagedUserPending: boolean;
	onManageUsernameChange: (value: string) => void;
	onManageInitialRoleChange: (value: string) => void;
	onManageProvisionDefaultUserScopeChange: (value: boolean) => void;
	onCreateManagedUser: () => void;
	deleteManagedUserQuery: string;
	deleteManagedUser: string;
	filteredManagedDeleteUsers: string[];
	deleteManagedUserPending: boolean;
	onDeleteManagedUserQueryChange: (value: string) => void;
	onDeleteManagedUserChange: (value: string) => void;
	onDeleteManagedUser: () => void;
	rbacUserQuery: string;
	rbacTargetUser: string;
	rbacTargetRole: string;
	filteredRbacKnownUsers: string[];
	upsertRbacRolePending: boolean;
	onRbacUserQueryChange: (value: string) => void;
	onRbacTargetUserChange: (value: string) => void;
	onRbacTargetRoleChange: (value: string) => void;
	onUpsertRbacRole: () => void;
	adminUserRolesLoading: boolean;
	filteredRbacRows: AdminUserRoleRecord[];
	revokeRbacRolePending: boolean;
	onRevokeRbacRole: (payload: { username: string; role: string }) => void;
	apiPermTargetUser: string;
	rbacKnownUsers: string[];
	apiPermFilter: string;
	apiDraftOverrideCount: number;
	apiCatalogLoading: boolean;
	userApiPermsLoading: boolean;
	filteredApiCatalogEntries: AdminAPICatalogEntry[];
	apiPermDraft: Record<string, "inherit" | "allow" | "deny">;
	saveUserApiPermissionsPending: boolean;
	onApiPermTargetUserChange: (value: string) => void;
	onApiPermFilterChange: (value: string) => void;
	onReloadUserApiPerms: () => void;
	onSaveUserApiPermissions: () => void;
	onApiPermDraftChange: (
		key: string,
		value: "inherit" | "allow" | "deny",
	) => void;
	apiPermissionKey: (entry: {
		service: string;
		endpoint: string;
		method: string;
	}) => string;
	purgeUserQuery: string;
	purgeUsername: string;
	filteredPurgeUserOptions: string[];
	purgeUserPending: boolean;
	onPurgeUserQueryChange: (value: string) => void;
	onPurgeUsernameChange: (value: string) => void;
	onPurgeUser: () => void;
	platformPolicyUserQuery: string;
	platformPolicyTargetUser: string;
	filteredPlatformPolicyUsers: string[];
	platformPolicySearchMatches: string[];
	platformPolicySearchCount: number;
	platformPolicyLoading: boolean;
	platformPolicyProfiles: string[];
	platformPolicyOperatingModes: string[];
	platformPolicyPrimaryOperatingMode: string;
	platformPolicyCapabilities: string[];
	platformPolicyQuota: {
		maxConcurrentLabs: number;
		maxPersistentLabs: number;
		maxPersistentHours: number;
		maxResourceClass: string;
	} | null;
	platformProfileDraft: string[];
	platformQuotaDraft: {
		maxConcurrentLabs: string;
		maxPersistentLabs: string;
		maxPersistentHours: string;
		maxResourceClass: string;
	};
	platformPolicyDerivedCapabilities: string[];
	platformQuotaValidationErrors: Record<
		"maxConcurrentLabs" | "maxPersistentLabs" | "maxPersistentHours",
		string
	>;
	platformQuotaHasErrors: boolean;
	savePlatformProfilesPending: boolean;
	savePlatformQuotaPending: boolean;
	adminForwardTenantResetRunsLoading: boolean;
	adminForwardTenantResetRuns: AdminForwardTenantResetRun[];
	adminForwardTenantResetMode: "hard-reset" | "curated-reset";
	adminForwardTenantResetConfirm: string;
	requestAdminForwardTenantResetPending: boolean;
	onPlatformPolicyUserQueryChange: (value: string) => void;
	onPlatformPolicyTargetUserChange: (value: string) => void;
	onPlatformProfileToggle: (profile: string, enabled: boolean) => void;
	onPlatformQuotaDraftChange: (
		field:
			| "maxConcurrentLabs"
			| "maxPersistentLabs"
			| "maxPersistentHours"
			| "maxResourceClass",
		value: string,
	) => void;
	onSavePlatformProfiles: () => void;
	onSavePlatformQuota: () => void;
	onAdminForwardTenantResetModeChange: (
		value: "hard-reset" | "curated-reset",
	) => void;
	onAdminForwardTenantResetConfirmChange: (value: string) => void;
	onRequestAdminForwardTenantReset: () => void;
};

export type AdminMaintenanceSectionProps = {
	config: AdminConfigSectionProps;
	audit: AdminAuditSectionProps;
	tasks: AdminTasksSectionProps;
};

export type SettingsAdminSectionProps = {
	identity: AdminIdentitySectionProps;
	integrations: AdminIntegrationsSectionProps;
	forward: AdminForwardSectionProps;
	runtime: AdminRuntimeSectionProps;
	users: AdminUsersSectionProps;
	maintenance: AdminMaintenanceSectionProps;
};
