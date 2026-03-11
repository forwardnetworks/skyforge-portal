import type { AdminSettingsUsersAccessArgs } from "./admin-settings-users-access-shared";
import { useAdminSettingsManagedUsers } from "./use-admin-settings-managed-users";
import { useAdminSettingsUserApiPermissions } from "./use-admin-settings-user-api-permissions";
import { useAdminSettingsUsersPurge } from "./use-admin-settings-users-purge";
import { useAdminSettingsUsersRbac } from "./use-admin-settings-users-rbac";

export function useAdminSettingsUsersAccess(
	args: AdminSettingsUsersAccessArgs,
) {
	const {
		isAdmin,
		knownUsersFromScopes,
		adminUserRolesQ,
		userScopesQ,
		sessionQ,
	} = args;

	const rbac = useAdminSettingsUsersRbac({
		knownUsersFromScopes,
		adminUserRolesQ,
		sessionQ,
	});
	const managedUsers = useAdminSettingsManagedUsers({
		availableRbacRoles: rbac.availableRbacRoles,
		rbacKnownUsers: rbac.rbacKnownUsers,
		adminUserRolesQ,
		userScopesQ,
		sessionQ,
	});
	const apiPermissions = useAdminSettingsUserApiPermissions({
		isAdmin,
		rbacKnownUsers: rbac.rbacKnownUsers,
	});
	const purge = useAdminSettingsUsersPurge({
		knownUsersFromScopes,
		userScopesQ,
		adminUserRolesQ,
	});

	return {
		manageUsername: managedUsers.manageUsername,
		setManageUsername: managedUsers.setManageUsername,
		manageInitialRole: managedUsers.manageInitialRole,
		setManageInitialRole: managedUsers.setManageInitialRole,
		availableRbacRoles: rbac.availableRbacRoles,
		createManagedUser: managedUsers.createManagedUser,
		deleteManagedUserQuery: managedUsers.deleteManagedUserQuery,
		setDeleteManagedUserQuery: managedUsers.setDeleteManagedUserQuery,
		deleteManagedUser: managedUsers.deleteManagedUser,
		setDeleteManagedUser: managedUsers.setDeleteManagedUser,
		filteredManagedDeleteUsers: managedUsers.filteredManagedDeleteUsers,
		deleteManagedUserMutation: managedUsers.deleteManagedUserMutation,
		rbacUserQuery: rbac.rbacUserQuery,
		setRbacUserQuery: rbac.setRbacUserQuery,
		rbacTargetUser: rbac.rbacTargetUser,
		setRbacTargetUser: rbac.setRbacTargetUser,
		rbacTargetRole: rbac.rbacTargetRole,
		setRbacTargetRole: rbac.setRbacTargetRole,
		filteredRbacKnownUsers: rbac.filteredRbacKnownUsers,
		upsertRbacRole: rbac.upsertRbacRole,
		adminUserRolesQ,
		filteredRbacRows: rbac.filteredRbacRows,
		revokeRbacRole: rbac.revokeRbacRole,
		apiPermTargetUser: apiPermissions.apiPermTargetUser,
		setApiPermTargetUser: apiPermissions.setApiPermTargetUser,
		rbacKnownUsers: rbac.rbacKnownUsers,
		apiPermFilter: apiPermissions.apiPermFilter,
		setApiPermFilter: apiPermissions.setApiPermFilter,
		apiDraftOverrideCount: apiPermissions.apiDraftOverrideCount,
		apiCatalogQ: apiPermissions.apiCatalogQ,
		userApiPermsQ: apiPermissions.userApiPermsQ,
		filteredApiCatalogEntries: apiPermissions.filteredApiCatalogEntries,
		apiPermDraft: apiPermissions.apiPermDraft,
		setApiPermDraft: apiPermissions.setApiPermDraft,
		saveUserApiPermissions: apiPermissions.saveUserApiPermissions,
		apiPermissionKey: apiPermissions.apiPermissionKey,
		purgeUserQuery: purge.purgeUserQuery,
		setPurgeUserQuery: purge.setPurgeUserQuery,
		purgeUsername: purge.purgeUsername,
		setPurgeUsername: purge.setPurgeUsername,
		filteredPurgeUserOptions: purge.filteredPurgeUserOptions,
		purgeUser: purge.purgeUser,
	};
}
