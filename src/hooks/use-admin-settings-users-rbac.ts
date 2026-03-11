import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteAdminUserRole, upsertAdminUserRole } from "../lib/api-client";
import {
	type AdminUserRolesQuery,
	type RefetchableQuery,
	collectKnownRbacUsers,
	filterUsernames,
	normalizeAvailableRbacRoles,
} from "./admin-settings-users-access-shared";

export function useAdminSettingsUsersRbac({
	knownUsersFromScopes,
	adminUserRolesQ,
	sessionQ,
}: {
	knownUsersFromScopes: string[];
	adminUserRolesQ: AdminUserRolesQuery;
	sessionQ: RefetchableQuery;
}) {
	const [rbacUserQuery, setRbacUserQuery] = useState("");
	const [rbacTargetUser, setRbacTargetUser] = useState("");
	const [rbacTargetRole, setRbacTargetRole] = useState("ADMIN");

	const availableRbacRoles = useMemo(
		() => normalizeAvailableRbacRoles(adminUserRolesQ.data?.availableRoles),
		[adminUserRolesQ.data?.availableRoles],
	);

	const rbacKnownUsers = useMemo(
		() =>
			collectKnownRbacUsers(knownUsersFromScopes, adminUserRolesQ.data?.users),
		[adminUserRolesQ.data?.users, knownUsersFromScopes],
	);

	const filteredRbacKnownUsers = useMemo(
		() => filterUsernames(rbacKnownUsers, rbacUserQuery),
		[rbacKnownUsers, rbacUserQuery],
	);

	const filteredRbacRows = useMemo(() => {
		const query = rbacUserQuery.trim().toLowerCase();
		const rows = adminUserRolesQ.data?.users ?? [];
		if (!query) return rows;
		return rows.filter((row) =>
			String(row.username ?? "")
				.toLowerCase()
				.includes(query),
		);
	}, [adminUserRolesQ.data?.users, rbacUserQuery]);

	useEffect(() => {
		if (!availableRbacRoles.includes(rbacTargetRole)) {
			setRbacTargetRole(availableRbacRoles[0] ?? "ADMIN");
		}
	}, [availableRbacRoles, rbacTargetRole]);

	const upsertRbacRole = useMutation({
		mutationFn: async () =>
			upsertAdminUserRole(rbacTargetUser, { role: rbacTargetRole }),
		onSuccess: async () => {
			toast.success("Role updated");
			await Promise.all([adminUserRolesQ.refetch(), sessionQ.refetch()]);
		},
		onError: (e) => {
			toast.error("Failed to update role", {
				description: (e as Error).message,
			});
		},
	});

	const revokeRbacRole = useMutation({
		mutationFn: async (payload: { username: string; role: string }) =>
			deleteAdminUserRole(payload.username, payload.role),
		onSuccess: async () => {
			toast.success("Role removed");
			await Promise.all([adminUserRolesQ.refetch(), sessionQ.refetch()]);
		},
		onError: (e) => {
			toast.error("Failed to remove role", {
				description: (e as Error).message,
			});
		},
	});

	return {
		rbacUserQuery,
		setRbacUserQuery,
		rbacTargetUser,
		setRbacTargetUser,
		rbacTargetRole,
		setRbacTargetRole,
		availableRbacRoles,
		rbacKnownUsers,
		filteredRbacKnownUsers,
		filteredRbacRows,
		upsertRbacRole,
		revokeRbacRole,
	};
}
