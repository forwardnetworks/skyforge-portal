import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { adminPurgeUser } from "../lib/api-client";
import {
	type AdminUserRolesQuery,
	type RefetchableQuery,
	filterUsernames,
} from "./admin-settings-users-access-shared";

export function useAdminSettingsUsersPurge({
	knownUsersFromScopes,
	userScopesQ,
	adminUserRolesQ,
}: {
	knownUsersFromScopes: string[];
	userScopesQ: RefetchableQuery;
	adminUserRolesQ: AdminUserRolesQuery;
}) {
	const [purgeUsername, setPurgeUsername] = useState("");
	const [purgeUserQuery, setPurgeUserQuery] = useState("");

	const filteredPurgeUserOptions = useMemo(
		() => filterUsernames(knownUsersFromScopes, purgeUserQuery),
		[knownUsersFromScopes, purgeUserQuery],
	);

	const purgeUser = useMutation({
		mutationFn: async () =>
			adminPurgeUser({ username: purgeUsername, confirm: purgeUsername }),
		onSuccess: (res) => {
			toast.success("User purged", {
				description: `Deleted user scopes: ${res.deletedUserScopes}`,
			});
			setPurgeUsername("");
			setPurgeUserQuery("");
			void userScopesQ.refetch();
			void adminUserRolesQ.refetch();
		},
		onError: (e) => {
			toast.error("Failed to purge user", {
				description: (e as Error).message,
			});
		},
	});

	return {
		purgeUserQuery,
		setPurgeUserQuery,
		purgeUsername,
		setPurgeUsername,
		filteredPurgeUserOptions,
		purgeUser,
	};
}
