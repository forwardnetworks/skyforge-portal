import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type {
	AdminForwardSectionProps,
	AdminIdentitySectionProps,
	AdminIntegrationsSectionProps,
	AdminRuntimeSectionProps,
} from "../components/settings-section-types";
import {
	getAdminUserRoles,
	getSession,
	listUserScopes,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { useAdminSettingsAudit } from "./use-admin-settings-audit";
import { useAdminSettingsAuth } from "./use-admin-settings-auth";
import {
	buildRuntimeSummary,
	useAdminSettingsMaintenanceSection,
} from "./use-admin-settings-maintenance-section";
import { useAdminSettingsOperations } from "./use-admin-settings-operations";
import { useAdminSettingsPlatformPolicyDrafts } from "./use-admin-settings-platform-policy-drafts";
import { useAdminSettingsPlatformPolicyUserSelection } from "./use-admin-settings-platform-policy-selection";
import { useAdminSettingsUsersAccess } from "./use-admin-settings-users-access";
import { useAdminSettingsUsersSection } from "./use-admin-settings-users-section";

function collectKnownUsers(
	scopes: {
		createdBy?: string | null;
		owners?: string[] | null;
		editors?: string[] | null;
		viewers?: string[] | null;
	}[],
): string[] {
	const users = new Set<string>();
	for (const scope of scopes) {
		const createdBy = String(scope.createdBy ?? "").trim();
		if (createdBy) users.add(createdBy);
		for (const owner of scope.owners ?? []) {
			const value = String(owner ?? "").trim();
			if (value) users.add(value);
		}
		for (const editor of scope.editors ?? []) {
			const value = String(editor ?? "").trim();
			if (value) users.add(value);
		}
		for (const viewer of scope.viewers ?? []) {
			const value = String(viewer ?? "").trim();
			if (value) users.add(value);
		}
	}
	return Array.from(users).sort((a, b) => a.localeCompare(b));
}

function useAdminSettingsBaseData() {
	const queryClient = useQueryClient();
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const effectiveUsername = String(sessionQ.data?.username ?? "").trim();

	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
		retry: false,
	});
	const allUserScopes = userScopesQ.data ?? [];
	const adminUserRolesQ = useQuery({
		queryKey: queryKeys.adminRbacUsers(),
		queryFn: getAdminUserRoles,
		staleTime: 15_000,
		retry: false,
	});
	const adminScopeID = useMemo(() => {
		if (allUserScopes.length === 0) return "";
		if (!effectiveUsername) return allUserScopes[0]?.id ?? "";
		const mine = allUserScopes.filter((scope) => {
			if (String(scope.createdBy ?? "").trim() === effectiveUsername)
				return true;
			if ((scope.owners ?? []).includes(effectiveUsername)) return true;
			if (String(scope.slug ?? "").trim() === effectiveUsername) return true;
			return false;
		});
		return (mine[0]?.id ?? allUserScopes[0]?.id ?? "").trim();
	}, [allUserScopes, effectiveUsername]);
	const knownUsersFromScopes = useMemo(
		() => collectKnownUsers(allUserScopes),
		[allUserScopes],
	);

	return {
		queryClient,
		sessionQ,
		userScopesQ,
		allUserScopes,
		adminUserRolesQ,
		adminScopeID,
		knownUsersFromScopes,
	};
}

function useAdminSettingsIdentitySection(args: {
	sessionQ: ReturnType<typeof useAdminSettingsBaseData>["sessionQ"];
	auth: ReturnType<typeof useAdminSettingsAuth>;
	ops: ReturnType<typeof useAdminSettingsOperations>;
}): AdminIdentitySectionProps {
	const { sessionQ, auth, ops } = args;
	return useMemo(
		() => ({
			authSettings: auth.authSettingsQ.data,
			authSettingsLoading: auth.authSettingsQ.isLoading,
			authProviderDraft: auth.authProviderDraft,
			breakGlassEnabledDraft: auth.breakGlassEnabledDraft,
			breakGlassLabelDraft: auth.breakGlassLabelDraft,
			saveAuthSettingsPending: auth.saveAuthSettings.isPending,
			onAuthProviderChange: auth.setAuthProviderDraft,
			onBreakGlassEnabledChange: auth.setBreakGlassEnabledDraft,
			onBreakGlassLabelChange: auth.setBreakGlassLabelDraft,
			onSaveAuthSettings: () => auth.saveAuthSettings.mutate(),
			oidcSettings: auth.oidcSettingsQ.data,
			oidcSettingsLoading: auth.oidcSettingsQ.isLoading,
			oidcEnabledDraft: auth.oidcEnabledDraft,
			oidcIssuerDraft: auth.oidcIssuerDraft,
			oidcDiscoveryDraft: auth.oidcDiscoveryDraft,
			oidcClientIDDraft: auth.oidcClientIDDraft,
			oidcClientSecretDraft: auth.oidcClientSecretDraft,
			oidcRedirectDraft: auth.oidcRedirectDraft,
			saveOIDCSettingsPending: auth.saveOIDCSettings.isPending,
			onOidcEnabledChange: auth.setOidcEnabledDraft,
			onOidcIssuerChange: auth.setOidcIssuerDraft,
			onOidcDiscoveryChange: auth.setOidcDiscoveryDraft,
			onOidcClientIdChange: auth.setOidcClientIDDraft,
			onOidcClientSecretChange: auth.setOidcClientSecretDraft,
			onOidcRedirectChange: auth.setOidcRedirectDraft,
			onSaveOIDCSettings: () => auth.saveOIDCSettings.mutate(),
			impersonateStatus: ops.impersonateStatusQ.data,
			sessionUsername: sessionQ.data?.username,
			impersonateUserOptions: ops.impersonateUserOptions,
			impersonateTarget: ops.impersonateTarget,
			impersonateStartPending: ops.impersonateStart.isPending,
			impersonateStopPending: ops.impersonateStop.isPending,
			onImpersonateTargetChange: ops.setImpersonateTarget,
			onImpersonateStart: () => ops.impersonateStart.mutate(),
			onImpersonateStop: () => ops.impersonateStop.mutate(),
		}),
		[sessionQ.data?.username, auth, ops],
	);
}

function useAdminSettingsIntegrationsSection(args: {
	auth: ReturnType<typeof useAdminSettingsAuth>;
}): AdminIntegrationsSectionProps {
	const { auth } = args;
	return useMemo(
		() => ({
			serviceNowGlobalConfig: auth.serviceNowGlobalConfigQ.data,
			serviceNowGlobalConfigLoading: auth.serviceNowGlobalConfigQ.isLoading,
			serviceNowInstanceURLDraft: auth.serviceNowInstanceURLDraft,
			serviceNowAdminUsernameDraft: auth.serviceNowAdminUsernameDraft,
			serviceNowAdminPasswordDraft: auth.serviceNowAdminPasswordDraft,
			saveServiceNowGlobalConfigPending:
				auth.saveServiceNowGlobalConfig.isPending,
			pushServiceNowForwardConfigPending:
				auth.pushServiceNowForwardConfig.isPending,
			onServiceNowInstanceURLChange: auth.setServiceNowInstanceURLDraft,
			onServiceNowAdminUsernameChange: auth.setServiceNowAdminUsernameDraft,
			onServiceNowAdminPasswordChange: auth.setServiceNowAdminPasswordDraft,
			onSaveServiceNowGlobalConfig: () =>
				auth.saveServiceNowGlobalConfig.mutate(),
			onPushServiceNowForwardConfig: () =>
				auth.pushServiceNowForwardConfig.mutate(),
			teamsGlobalConfig: auth.teamsGlobalConfigQ.data,
			teamsGlobalConfigLoading: auth.teamsGlobalConfigQ.isLoading,
			teamsEnabledDraft: auth.teamsEnabledDraft,
			teamsDisplayNameDraft: auth.teamsDisplayNameDraft,
			teamsPublicBaseURLDraft: auth.teamsPublicBaseURLDraft,
			teamsInboundSecretDraft: auth.teamsInboundSecretDraft,
			teamsTestWebhookURLDraft: auth.teamsTestWebhookURLDraft,
			saveTeamsGlobalConfigPending: auth.saveTeamsGlobalConfig.isPending,
			testTeamsOutgoingPending: auth.testTeamsOutgoing.isPending,
			onTeamsEnabledChange: auth.setTeamsEnabledDraft,
			onTeamsDisplayNameChange: auth.setTeamsDisplayNameDraft,
			onTeamsPublicBaseURLChange: auth.setTeamsPublicBaseURLDraft,
			onTeamsInboundSecretChange: auth.setTeamsInboundSecretDraft,
			onTeamsTestWebhookURLChange: auth.setTeamsTestWebhookURLDraft,
			onSaveTeamsGlobalConfig: () => auth.saveTeamsGlobalConfig.mutate(),
			onTestTeamsOutgoing: () => auth.testTeamsOutgoing.mutate(),
			adminRegistryCatalog: auth.adminRegistryCatalogQ.data,
			adminRegistryCatalogLoading: auth.adminRegistryCatalogQ.isLoading,
			registryBaseURLDraft: auth.registryBaseURLDraft,
			registrySkipTLSVerifyDraft: auth.registrySkipTLSVerifyDraft,
			registryRepoPrefixesDraft: auth.registryRepoPrefixesDraft,
			registryUsernameDraft: auth.registryUsernameDraft,
			registryPasswordDraft: auth.registryPasswordDraft,
			registryPrepullWorkerNodesDraft: auth.registryPrepullWorkerNodesDraft,
			registryCatalogImagesDraft: auth.registryCatalogImagesDraft,
			saveRegistryCatalogPending: auth.saveRegistryCatalog.isPending,
			triggerRegistryCatalogPrepullPending:
				auth.triggerRegistryCatalogPrepull.isPending,
			onRegistryBaseURLChange: auth.setRegistryBaseURLDraft,
			onRegistrySkipTLSVerifyChange: auth.setRegistrySkipTLSVerifyDraft,
			onRegistryRepoPrefixesChange: auth.setRegistryRepoPrefixesDraft,
			onRegistryUsernameChange: auth.setRegistryUsernameDraft,
			onRegistryPasswordChange: auth.setRegistryPasswordDraft,
			onRegistryPrepullWorkerNodesChange: auth.setRegistryPrepullWorkerNodesDraft,
			onRegistryCatalogImageFieldChange: auth.upsertRegistryCatalogImage,
			onAddRegistryCatalogImage: auth.addRegistryCatalogImage,
			onRemoveRegistryCatalogImage: auth.removeRegistryCatalogImage,
			onSaveRegistryCatalog: () => auth.saveRegistryCatalog.mutate(),
			onTriggerRegistryCatalogPrepull: () =>
				auth.triggerRegistryCatalogPrepull.mutate(),
		}),
		[auth],
	);
}

function useAdminSettingsForwardSection(args: {
	auth: ReturnType<typeof useAdminSettingsAuth>;
	ops: ReturnType<typeof useAdminSettingsOperations>;
}): AdminForwardSectionProps {
	const { auth, ops } = args;
	return useMemo(
		() => ({
			quickDeploySource: auth.quickDeployCatalogQ.data?.source,
			quickDeployRepo:
				auth.quickDeployTemplateOptionsQ.data?.repo ??
				auth.quickDeployCatalogQ.data?.repo,
			quickDeployBranch:
				auth.quickDeployTemplateOptionsQ.data?.branch ??
				auth.quickDeployCatalogQ.data?.branch,
			quickDeployDir:
				auth.quickDeployTemplateOptionsQ.data?.dir ??
				auth.quickDeployCatalogQ.data?.dir,
			selectedQuickDeployOption: auth.selectedQuickDeployOption,
			availableQuickDeployTemplates: auth.availableQuickDeployTemplates,
			quickDeployTemplates: auth.quickDeployTemplates,
			quickDeployLookupFailed:
				auth.blueprintNetlabTemplatesQ.isError ||
				auth.quickDeployTemplateOptionsQ.isError,
			quickDeployCatalogLoading: auth.quickDeployCatalogQ.isLoading,
			saveQuickDeployCatalogPending: auth.saveQuickDeployCatalog.isPending,
			hasQuickDeployTemplateRows: auth.hasQuickDeployTemplateRows,
			onSelectedQuickDeployOptionChange: auth.setSelectedQuickDeployOption,
			onAddQuickDeployTemplateFromOption: auth.addQuickDeployTemplateFromOption,
			onQuickDeployTemplateFieldChange: auth.upsertQuickDeployTemplateField,
			onRemoveQuickDeployTemplate: auth.removeQuickDeployTemplate,
			onAddQuickDeployTemplate: auth.addQuickDeployTemplate,
			onAllowedProfilesChange: (index, value) =>
				auth.upsertQuickDeployTemplateField(index, "allowedProfiles", value),
			onSaveQuickDeployCatalog: () => auth.saveQuickDeployCatalog.mutate(),
			forwardDemoSeedCatalog: auth.forwardDemoSeedCatalogQ.data,
			forwardDemoSeedCatalogLoading: auth.forwardDemoSeedCatalogQ.isLoading,
			uploadForwardDemoSeedPending: auth.uploadForwardDemoSeed.isPending,
			updateForwardDemoSeedPending: auth.updateForwardDemoSeed.isPending,
			saveForwardDemoSeedConfigPending:
				auth.saveForwardDemoSeedConfig.isPending,
			deleteForwardDemoSeedPending: auth.deleteForwardDemoSeed.isPending,
			onUploadForwardDemoSeed: (value) =>
				auth.uploadForwardDemoSeed.mutate(value),
			onUpdateForwardDemoSeed: (value) =>
				auth.updateForwardDemoSeed.mutate(value),
			onSaveForwardDemoSeedConfig: (value) =>
				auth.saveForwardDemoSeedConfig.mutate(value),
			onDeleteForwardDemoSeed: (seedID) =>
				auth.deleteForwardDemoSeed.mutate(seedID),
			adminForwardSupportCredentialLoading:
				ops.adminForwardSupportCredentialQ.isLoading,
			adminForwardSupportCredentialConfigured:
				ops.adminForwardSupportCredentialQ.data?.configured ?? false,
			adminForwardSupportUsername:
				ops.adminForwardSupportCredentialQ.data?.username ?? "",
			adminForwardSupportHasPassword:
				ops.adminForwardSupportCredentialQ.data?.hasPassword ?? false,
			adminForwardSupportPassword: ops.adminForwardSupportPassword,
			adminForwardSupportLaunchHref:
				"/api/admin/integrations/forward/session?next=%2F",
			revealAdminForwardSupportCredentialPending:
				ops.revealAdminForwardSupportCredentialMutation.isPending,
			onRevealAdminForwardSupportCredentialPassword: () =>
				ops.revealAdminForwardSupportCredentialMutation.mutate(),
			reconcileAdminForwardCustomerBannerPending:
				ops.reconcileAdminForwardCustomerBannerMutation.isPending,
			onReconcileAdminForwardCustomerBanner: () =>
				ops.reconcileAdminForwardCustomerBannerMutation.mutate(),
		}),
		[auth, ops],
	);
}

function useAdminSettingsRuntimeSection(args: {
	auth: ReturnType<typeof useAdminSettingsAuth>;
	ops: ReturnType<typeof useAdminSettingsOperations>;
}): AdminRuntimeSectionProps {
	const { auth, ops } = args;
	return useMemo(
		() => ({
			config: auth.cfgQ.data,
			configLoading: auth.cfgQ.isLoading,
			hetznerBurstStatus: auth.hetznerBurstStatusQ.data,
			hetznerBurstStatusLoading: auth.hetznerBurstStatusQ.isLoading,
			hetznerBurstRuntimePolicy: auth.hetznerBurstRuntimePolicyQ.data,
			hetznerBurstRuntimePolicyLoading:
				auth.hetznerBurstRuntimePolicyQ.isLoading,
			hetznerBurstEnabledDraft: auth.hetznerBurstEnabledDraft,
			hetznerBurstProvisioningEnabledDraft:
				auth.hetznerBurstProvisioningEnabledDraft,
			saveHetznerBurstRuntimePolicyPending:
				auth.saveHetznerBurstRuntimePolicy.isPending,
			onHetznerBurstEnabledChange: auth.setHetznerBurstEnabledDraft,
			onHetznerBurstProvisioningEnabledChange:
				auth.setHetznerBurstProvisioningEnabledDraft,
			onSaveHetznerBurstRuntimePolicy: () =>
				auth.saveHetznerBurstRuntimePolicy.mutate(),
			adminEphemeralRuntimeSummary: buildRuntimeSummary(
				ops.adminEphemeralRuntimesQ.data,
			),
		}),
		[auth, ops.adminEphemeralRuntimesQ.data],
	);
}

export function useAdminSettingsPage() {
	const base = useAdminSettingsBaseData();
	const auth = useAdminSettingsAuth({
		queryClient: base.queryClient,
		adminScopeID: base.adminScopeID,
	});
	const ops = useAdminSettingsOperations({
		knownUsersFromScopes: base.knownUsersFromScopes,
	});
	const usersAccess = useAdminSettingsUsersAccess({
		knownUsersFromScopes: base.knownUsersFromScopes,
		adminUserRolesQ: base.adminUserRolesQ,
		userScopesQ: base.userScopesQ,
		sessionQ: base.sessionQ,
	});
	const platformSelection = useAdminSettingsPlatformPolicyUserSelection({
		userOptions: usersAccess.rbacKnownUsers,
	});
	const platformDrafts = useAdminSettingsPlatformPolicyDrafts({
		platformPolicyTargetUser: platformSelection.platformPolicyTargetUser,
	});
	const audit = useAdminSettingsAudit();
	const identity = useAdminSettingsIdentitySection({
		sessionQ: base.sessionQ,
		auth,
		ops,
	});
	const integrations = useAdminSettingsIntegrationsSection({ auth });
	const forward = useAdminSettingsForwardSection({ auth, ops });
	const runtime = useAdminSettingsRuntimeSection({ auth, ops });
	const users = useAdminSettingsUsersSection({
		usersAccess,
		platformSelection,
		platformDrafts,
	});
	const maintenance = useAdminSettingsMaintenanceSection({
		auth,
		audit,
		allUserScopes: base.allUserScopes,
		ops,
	});

	return {
		identity,
		integrations,
		forward,
		runtime,
		users,
		maintenance,
	};
}

export type AdminSettingsPageState = ReturnType<typeof useAdminSettingsPage>;
