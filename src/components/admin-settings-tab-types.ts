import type {
	AdminAPICatalogEntry,
	AdminAuditResponse,
	AdminAuthSettingsResponse,
	AdminEffectiveConfigResponse,
	AdminImpersonateStatusResponse,
	AdminOIDCSettingsResponse,
	AdminServiceNowGlobalConfigResponse,
	AdminTeamsGlobalConfigResponse,
	AdminUserRoleRecord,
	AdminWorkspacePodCleanupResponse,
	QuickDeployTemplate,
	SkyforgeUserScope,
} from "../lib/api-client";
import type { DataTableColumn } from "./ui/data-table";

type QuickDeployField = keyof QuickDeployTemplate;

export type AdminOverviewTabProps = {
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
	config?: AdminEffectiveConfigResponse;
	configLoading: boolean;
	impersonateStatus?: AdminImpersonateStatusResponse;
	sessionUsername?: string;
	impersonateUserOptions: string[];
	impersonateTarget: string;
	impersonateStartPending: boolean;
	impersonateStopPending: boolean;
	onImpersonateTargetChange: (value: string) => void;
	onImpersonateStart: () => void;
	onImpersonateStop: () => void;
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
	onSaveQuickDeployCatalog: () => void;
	serviceNowGlobalConfig?: AdminServiceNowGlobalConfigResponse;
	serviceNowGlobalConfigLoading: boolean;
	serviceNowInstanceURLDraft: string;
	serviceNowAdminUsernameDraft: string;
	serviceNowAdminPasswordDraft: string;
	serviceNowBootstrapCredentialSetDraft: string;
	saveServiceNowGlobalConfigPending: boolean;
	pushServiceNowForwardConfigPending: boolean;
	onServiceNowInstanceURLChange: (value: string) => void;
	onServiceNowAdminUsernameChange: (value: string) => void;
	onServiceNowAdminPasswordChange: (value: string) => void;
	onServiceNowBootstrapCredentialSetChange: (value: string) => void;
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

export type AdminAuditTabProps = {
	auditLimit: string;
	onAuditLimitChange: (value: string) => void;
	auditTimestamp?: string;
	auditEvents: AdminAuditResponse["events"];
	auditColumns: DataTableColumn<AdminAuditResponse["events"][number]>[];
	auditLoading: boolean;
};

export type AdminTasksTabProps = {
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
	cleanupWorkspacePodsPending: boolean;
	onPreviewCleanup: () => void;
	onRunCleanup: () => void;
	cleanupResult: AdminWorkspacePodCleanupResponse | null;
};

export type AdminUsersTabProps = {
	manageUsername: string;
	manageInitialRole: string;
	availableRbacRoles: string[];
	createManagedUserPending: boolean;
	onManageUsernameChange: (value: string) => void;
	onManageInitialRoleChange: (value: string) => void;
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
};
