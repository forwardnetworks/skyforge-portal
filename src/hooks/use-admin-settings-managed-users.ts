import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createAdminUser, deleteAdminUser } from "../lib/api-client";
import {
	type AdminUserRolesQuery,
	type RefetchableQuery,
	filterUsernames,
} from "./admin-settings-users-access-shared";

export function useAdminSettingsManagedUsers({
	availableRbacRoles,
	rbacKnownUsers,
	adminUserRolesQ,
	userScopesQ,
	sessionQ,
}: {
	availableRbacRoles: string[];
	rbacKnownUsers: string[];
	adminUserRolesQ: AdminUserRolesQuery;
	userScopesQ: RefetchableQuery;
	sessionQ: RefetchableQuery;
}) {
	const [manageUsername, setManageUsername] = useState("");
	const [manageInitialRole, setManageInitialRole] = useState("USER");
	const [deleteManagedUser, setDeleteManagedUser] = useState("");
	const [deleteManagedUserQuery, setDeleteManagedUserQuery] = useState("");

	useEffect(() => {
		if (!availableRbacRoles.includes(manageInitialRole)) {
			setManageInitialRole(
				availableRbacRoles.includes("USER")
					? "USER"
					: (availableRbacRoles[0] ?? "USER"),
			);
		}
	}, [availableRbacRoles, manageInitialRole]);

	const createManagedUser = useMutation({
		mutationFn: async () =>
			createAdminUser({
				username: manageUsername,
				role: manageInitialRole,
			}),
		onSuccess: async () => {
			toast.success("User created");
			setManageUsername("");
			await Promise.all([
				adminUserRolesQ.refetch(),
				userScopesQ.refetch(),
				sessionQ.refetch(),
			]);
		},
		onError: (e) => {
			toast.error("Failed to create user", {
				description: (e as Error).message,
			});
		},
	});

	const deleteManagedUserMutation = useMutation({
		mutationFn: async () => deleteAdminUser(deleteManagedUser),
		onSuccess: async () => {
			toast.success("User deleted");
			setDeleteManagedUser("");
			setDeleteManagedUserQuery("");
			await Promise.all([
				adminUserRolesQ.refetch(),
				userScopesQ.refetch(),
				sessionQ.refetch(),
			]);
		},
		onError: (e) => {
			toast.error("Failed to delete user", {
				description: (e as Error).message,
			});
		},
	});

	const filteredManagedDeleteUsers = useMemo(
		() => filterUsernames(rbacKnownUsers, deleteManagedUserQuery),
		[rbacKnownUsers, deleteManagedUserQuery],
	);

	return {
		manageUsername,
		setManageUsername,
		manageInitialRole,
		setManageInitialRole,
		createManagedUser,
		deleteManagedUserQuery,
		setDeleteManagedUserQuery,
		deleteManagedUser,
		setDeleteManagedUser,
		filteredManagedDeleteUsers,
		deleteManagedUserMutation,
	};
}
