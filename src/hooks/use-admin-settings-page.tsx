import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getAdminUserRoles, getSession, listUserScopes } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { sessionIsAdmin } from "../lib/rbac";
import { useAdminSettingsAuth } from "./use-admin-settings-auth";
import { useAdminSettingsAudit } from "./use-admin-settings-audit";
import { useAdminSettingsOperations } from "./use-admin-settings-operations";
import { useAdminSettingsPlatformPolicyDrafts } from "./use-admin-settings-platform-policy-drafts";
import { useAdminSettingsPlatformPolicyUserSelection } from "./use-admin-settings-platform-policy-selection";
import { useAdminSettingsUsersAccess } from "./use-admin-settings-users-access";

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

export function useAdminSettingsPage() {
	const queryClient = useQueryClient();
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const isAdmin = sessionIsAdmin(sessionQ.data);
	const effectiveUsername = String(sessionQ.data?.username ?? "").trim();

	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		enabled: isAdmin,
		staleTime: 30_000,
		retry: false,
	});
	const allUserScopes = userScopesQ.data ?? [];
	const adminUserRolesQ = useQuery({
		queryKey: queryKeys.adminRbacUsers(),
		queryFn: getAdminUserRoles,
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});
	const adminScopeID = useMemo(() => {
		if (allUserScopes.length === 0) return "";
		if (!effectiveUsername) return allUserScopes[0]?.id ?? "";
		const mine = allUserScopes.filter((scope) => {
			if (String(scope.createdBy ?? "").trim() === effectiveUsername) return true;
			if ((scope.owners ?? []).includes(effectiveUsername)) return true;
			if (String(scope.slug ?? "").trim() === effectiveUsername) return true;
			return false;
		});
		return (mine[0]?.id ?? allUserScopes[0]?.id ?? "").trim();
	}, [allUserScopes, effectiveUsername]);

	const adminAuth = useAdminSettingsAuth({
		queryClient,
		isAdmin,
		adminScopeID,
	});

	const knownUsersFromScopes = useMemo(
		() => collectKnownUsers(allUserScopes),
		[allUserScopes],
	);
	const adminOps = useAdminSettingsOperations({
		isAdmin,
		knownUsersFromScopes,
	});
	const adminUsersAccess = useAdminSettingsUsersAccess({
		isAdmin,
		knownUsersFromScopes,
		adminUserRolesQ,
		userScopesQ,
		sessionQ,
	});
	const platformPolicyUserSelection = useAdminSettingsPlatformPolicyUserSelection({
		userOptions: adminUsersAccess.rbacKnownUsers,
	});
	const platformPolicyDrafts = useAdminSettingsPlatformPolicyDrafts({
		platformPolicyTargetUser: platformPolicyUserSelection.platformPolicyTargetUser,
		isAdmin,
	});
	const auditState = useAdminSettingsAudit({ isAdmin });

	return {
		sessionQ,
		isAdmin,
		allUserScopes,
		...auditState,
		...adminAuth,
		...adminOps,
		...adminUsersAccess,
		...platformPolicyUserSelection,
		...platformPolicyDrafts,
	};
}

export type AdminSettingsPageState = ReturnType<typeof useAdminSettingsPage>;
