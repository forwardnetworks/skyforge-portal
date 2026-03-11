import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "../components/ui/badge";
import type { DataTableColumn } from "../components/ui/data-table";
import {
	type AdminAuditResponse,
	getAdminAudit,
	getAdminUserRoles,
	getSession,
	listUserScopes,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { sessionIsAdmin } from "../lib/rbac";
import { useAdminSettingsAuth } from "./use-admin-settings-auth";
import { useAdminSettingsOperations } from "./use-admin-settings-operations";
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
			if (String(scope.createdBy ?? "").trim() === effectiveUsername)
				return true;
			if ((scope.owners ?? []).includes(effectiveUsername)) return true;
			if (String(scope.slug ?? "").trim() === effectiveUsername) return true;
			return false;
		});
		return (mine[0]?.id ?? allUserScopes[0]?.id ?? "").trim();
	}, [allUserScopes, effectiveUsername]);

	const [auditLimit, setAuditLimit] = useState("200");
	const auditQ = useQuery({
		queryKey: queryKeys.adminAudit(auditLimit),
		queryFn: () => getAdminAudit({ limit: auditLimit }),
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});

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

	const auditColumns = useMemo<
		DataTableColumn<AdminAuditResponse["events"][number]>[]
	>(
		() => [
			{
				id: "createdAt",
				header: "Time",
				cell: (row) => (
					<span className="font-mono text-xs text-muted-foreground">
						{row.createdAt}
					</span>
				),
				width: 220,
			},
			{
				id: "actor",
				header: "Actor",
				cell: (row) => (
					<div className="flex items-center gap-2">
						<span className="font-medium">{row.actorUsername}</span>
						{row.actorIsAdmin ? <Badge variant="secondary">admin</Badge> : null}
						{row.impersonatedUsername ? (
							<Badge variant="outline">as {row.impersonatedUsername}</Badge>
						) : null}
					</div>
				),
				width: 260,
			},
			{ id: "action", header: "Action", cell: (row) => row.action, width: 260 },
			{
				id: "userId",
				header: "User Scope",
				cell: (row) => (
					<span className="font-mono text-xs text-muted-foreground">
						{row.userId}
					</span>
				),
				width: 220,
			},
			{
				id: "details",
				header: "Details",
				cell: (row) => (
					<span className="text-xs text-muted-foreground">{row.details}</span>
				),
			},
		],
		[],
	);

	return {
		sessionQ,
		isAdmin,
		allUserScopes,
		auditLimit,
		setAuditLimit,
		auditQ,
		...adminAuth,
		...adminOps,
		...adminUsersAccess,
		auditColumns,
	};
}
