import { useMemo } from "react";
import type { AdminUsersSectionProps } from "../components/settings-section-types";
import { useAdminSettingsPlatformPolicyDrafts } from "./use-admin-settings-platform-policy-drafts";
import { useAdminSettingsPlatformPolicyUserSelection } from "./use-admin-settings-platform-policy-selection";
import { useAdminSettingsUsersAccess } from "./use-admin-settings-users-access";

function useAdminSettingsManagedUsersSection(args: {
	usersAccess: ReturnType<typeof useAdminSettingsUsersAccess>;
}) {
	const { usersAccess } = args;
	return useMemo(
		() => ({
			manageUsername: usersAccess.manageUsername,
			manageInitialRole: usersAccess.manageInitialRole,
			manageProvisionDefaultUserScope:
				usersAccess.manageProvisionDefaultUserScope,
			availableRbacRoles: usersAccess.availableRbacRoles,
			createManagedUserPending: usersAccess.createManagedUser.isPending,
			onManageUsernameChange: usersAccess.setManageUsername,
			onManageInitialRoleChange: usersAccess.setManageInitialRole,
			onManageProvisionDefaultUserScopeChange:
				usersAccess.setManageProvisionDefaultUserScope,
			onCreateManagedUser: () => usersAccess.createManagedUser.mutate(),
			deleteManagedUserQuery: usersAccess.deleteManagedUserQuery,
			deleteManagedUser: usersAccess.deleteManagedUser,
			filteredManagedDeleteUsers: usersAccess.filteredManagedDeleteUsers,
			deleteManagedUserPending:
				usersAccess.deleteManagedUserMutation.isPending,
			onDeleteManagedUserQueryChange: usersAccess.setDeleteManagedUserQuery,
			onDeleteManagedUserChange: usersAccess.setDeleteManagedUser,
			onDeleteManagedUser: () =>
				usersAccess.deleteManagedUserMutation.mutate(),
		}),
		[usersAccess],
	);
}

function useAdminSettingsRbacSection(args: {
	usersAccess: ReturnType<typeof useAdminSettingsUsersAccess>;
}) {
	const { usersAccess } = args;
	return useMemo(
		() => ({
			rbacUserQuery: usersAccess.rbacUserQuery,
			rbacTargetUser: usersAccess.rbacTargetUser,
			rbacTargetRole: usersAccess.rbacTargetRole,
			filteredRbacKnownUsers: usersAccess.filteredRbacKnownUsers,
			upsertRbacRolePending: usersAccess.upsertRbacRole.isPending,
			onRbacUserQueryChange: usersAccess.setRbacUserQuery,
			onRbacTargetUserChange: usersAccess.setRbacTargetUser,
			onRbacTargetRoleChange: usersAccess.setRbacTargetRole,
			onUpsertRbacRole: () => usersAccess.upsertRbacRole.mutate(),
			adminUserRolesLoading: usersAccess.adminUserRolesQ.isLoading,
			filteredRbacRows: usersAccess.filteredRbacRows,
			revokeRbacRolePending: usersAccess.revokeRbacRole.isPending,
			onRevokeRbacRole: (payload: { username: string; role: string }) =>
				usersAccess.revokeRbacRole.mutate(payload),
			rbacKnownUsers: usersAccess.rbacKnownUsers,
		}),
		[usersAccess],
	);
}

function useAdminSettingsApiPermissionsSection(args: {
	usersAccess: ReturnType<typeof useAdminSettingsUsersAccess>;
}) {
	const { usersAccess } = args;
	return useMemo(
		() => ({
			apiPermTargetUser: usersAccess.apiPermTargetUser,
			apiPermFilter: usersAccess.apiPermFilter,
			apiDraftOverrideCount: usersAccess.apiDraftOverrideCount,
			apiCatalogLoading: usersAccess.apiCatalogQ.isLoading,
			userApiPermsLoading: usersAccess.userApiPermsQ.isLoading,
			filteredApiCatalogEntries: usersAccess.filteredApiCatalogEntries,
			apiPermDraft: usersAccess.apiPermDraft,
			saveUserApiPermissionsPending:
				usersAccess.saveUserApiPermissions.isPending,
			onApiPermTargetUserChange: usersAccess.setApiPermTargetUser,
			onApiPermFilterChange: usersAccess.setApiPermFilter,
			onReloadUserApiPerms: () => {
				void usersAccess.userApiPermsQ.refetch();
			},
			onSaveUserApiPermissions: () =>
				usersAccess.saveUserApiPermissions.mutate(),
			onApiPermDraftChange: (
				key: string,
				nextDecision: "inherit" | "allow" | "deny",
			) => {
				usersAccess.setApiPermDraft((prev) => {
					if (nextDecision === "inherit") {
						const next = { ...prev };
						delete next[key];
						return next;
					}
					return { ...prev, [key]: nextDecision };
				});
			},
			apiPermissionKey: usersAccess.apiPermissionKey,
		}),
		[usersAccess],
	);
}

function useAdminSettingsPurgeSection(args: {
	usersAccess: ReturnType<typeof useAdminSettingsUsersAccess>;
}) {
	const { usersAccess } = args;
	return useMemo(
		() => ({
			purgeUserQuery: usersAccess.purgeUserQuery,
			purgeUsername: usersAccess.purgeUsername,
			filteredPurgeUserOptions: usersAccess.filteredPurgeUserOptions,
			purgeUserPending: usersAccess.purgeUser.isPending,
			onPurgeUserQueryChange: usersAccess.setPurgeUserQuery,
			onPurgeUsernameChange: usersAccess.setPurgeUsername,
			onPurgeUser: () => usersAccess.purgeUser.mutate(),
		}),
		[usersAccess],
	);
}

function useAdminSettingsPlatformPolicySection(args: {
	platformSelection: ReturnType<typeof useAdminSettingsPlatformPolicyUserSelection>;
	platformDrafts: ReturnType<typeof useAdminSettingsPlatformPolicyDrafts>;
}) {
	const { platformSelection, platformDrafts } = args;
	return useMemo(
		() => ({
			platformPolicyUserQuery: platformSelection.platformPolicyUserQuery,
			platformPolicyTargetUser: platformSelection.platformPolicyTargetUser,
			filteredPlatformPolicyUsers:
				platformSelection.filteredPlatformPolicyUsers,
			platformPolicySearchMatches:
				platformSelection.platformPolicySearchMatches,
			platformPolicySearchCount:
				platformSelection.platformPolicySearchCount,
			platformPolicyLoading: platformDrafts.platformPolicyQ.isLoading,
			platformPolicyProfiles:
				platformDrafts.platformPolicyQ.data?.profiles ?? [],
			platformPolicyOperatingModes:
				platformDrafts.platformPolicyQ.data?.operatingModes ?? [],
			platformPolicyPrimaryOperatingMode:
				platformDrafts.platformPolicyQ.data?.primaryOperatingMode ?? "",
			platformPolicyCapabilities:
				platformDrafts.platformPolicyQ.data?.capabilities ?? [],
			platformPolicyQuota: platformDrafts.platformPolicyQ.data?.quota ?? null,
			platformProfileDraft: platformDrafts.platformProfileDraft,
			platformQuotaDraft: platformDrafts.platformQuotaDraft,
			platformPolicyDerivedCapabilities:
				platformDrafts.platformPolicyDerivedCapabilities,
			platformQuotaValidationErrors:
				platformDrafts.platformQuotaValidationErrors,
			platformQuotaHasErrors: platformDrafts.platformQuotaHasErrors,
			savePlatformProfilesPending:
				platformDrafts.savePlatformProfiles.isPending,
			savePlatformQuotaPending:
				platformDrafts.savePlatformQuota.isPending,
			adminForwardTenantResetRunsLoading:
				platformDrafts.adminForwardTenantResetRunsQ.isLoading,
			adminForwardTenantResetRuns:
				platformDrafts.adminForwardTenantResetRunsQ.data?.runs ?? [],
			adminForwardTenantResetMode:
				platformDrafts.adminForwardTenantResetMode,
			adminForwardTenantResetConfirm:
				platformDrafts.adminForwardTenantResetConfirm,
			requestAdminForwardTenantResetPending:
				platformDrafts.requestAdminForwardTenantReset.isPending,
			onPlatformPolicyUserQueryChange:
				platformSelection.setPlatformPolicyUserQuery,
			onPlatformPolicyTargetUserChange:
				platformSelection.setPlatformPolicyTargetUser,
			onPlatformProfileToggle: (profile: string, enabled: boolean) => {
				platformDrafts.setPlatformProfileDraft((prev) => {
					if (enabled) {
						return prev.includes(profile) ? prev : [...prev, profile];
					}
					return prev.filter((item) => item !== profile);
				});
			},
			onPlatformQuotaDraftChange: (
				field:
					| "maxConcurrentLabs"
					| "maxPersistentLabs"
					| "maxPersistentHours"
					| "maxResourceClass",
				value: string,
			) => {
				platformDrafts.setPlatformQuotaDraft((prev) => ({
					...prev,
					[field]: value,
				}));
			},
			onSavePlatformProfiles: () =>
				platformDrafts.savePlatformProfiles.mutate(),
			onSavePlatformQuota: () =>
				platformDrafts.savePlatformQuota.mutate(),
			onAdminForwardTenantResetModeChange:
				platformDrafts.setAdminForwardTenantResetMode,
			onAdminForwardTenantResetConfirmChange:
				platformDrafts.setAdminForwardTenantResetConfirm,
			onRequestAdminForwardTenantReset: () =>
				platformDrafts.requestAdminForwardTenantReset.mutate(),
		}),
		[platformSelection, platformDrafts],
	);
}

export function useAdminSettingsUsersSection(args: {
	usersAccess: ReturnType<typeof useAdminSettingsUsersAccess>;
	platformSelection: ReturnType<typeof useAdminSettingsPlatformPolicyUserSelection>;
	platformDrafts: ReturnType<typeof useAdminSettingsPlatformPolicyDrafts>;
}): AdminUsersSectionProps {
	const { usersAccess, platformSelection, platformDrafts } = args;
	const managedUsers = useAdminSettingsManagedUsersSection({ usersAccess });
	const rbac = useAdminSettingsRbacSection({ usersAccess });
	const apiPermissions = useAdminSettingsApiPermissionsSection({ usersAccess });
	const purge = useAdminSettingsPurgeSection({ usersAccess });
	const platformPolicy = useAdminSettingsPlatformPolicySection({
		platformSelection,
		platformDrafts,
	});

	return useMemo(
		() => ({
			...managedUsers,
			...rbac,
			...apiPermissions,
			...purge,
			...platformPolicy,
		}),
		[managedUsers, rbac, apiPermissions, purge, platformPolicy],
	);
}
