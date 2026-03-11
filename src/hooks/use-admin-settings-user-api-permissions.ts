import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
	AdminAPICatalogEntry,
	AdminUserAPIPermission,
} from "../lib/api-client";
import {
	getAdminAPICatalog,
	getAdminUserAPIPermissions,
	putAdminUserAPIPermissions,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import {
	type ApiPermissionDecision,
	apiPermissionKey,
} from "./admin-settings-users-access-shared";

function collectApiPermissionDraft(
	permissions: AdminUserAPIPermission[] | undefined,
): Record<string, ApiPermissionDecision> {
	const next: Record<string, ApiPermissionDecision> = {};
	for (const perm of permissions ?? []) {
		const decisionRaw = String(perm.decision ?? "")
			.trim()
			.toLowerCase();
		if (decisionRaw !== "allow" && decisionRaw !== "deny") {
			continue;
		}
		next[
			apiPermissionKey({
				service: String(perm.service ?? ""),
				endpoint: String(perm.endpoint ?? ""),
				method: String(perm.method ?? ""),
			})
		] = decisionRaw;
	}
	return next;
}

function filterApiCatalogEntries(
	entries: AdminAPICatalogEntry[] | undefined,
	query: string,
): AdminAPICatalogEntry[] {
	const normalizedQuery = query.trim().toLowerCase();
	const catalogEntries = entries ?? [];
	if (!normalizedQuery) return catalogEntries;
	return catalogEntries.filter((entry) => {
		const tags = (entry.tags ?? []).join(" ").toLowerCase();
		return (
			entry.service.toLowerCase().includes(normalizedQuery) ||
			entry.endpoint.toLowerCase().includes(normalizedQuery) ||
			entry.method.toLowerCase().includes(normalizedQuery) ||
			entry.path.toLowerCase().includes(normalizedQuery) ||
			String(entry.summary ?? "")
				.toLowerCase()
				.includes(normalizedQuery) ||
			tags.includes(normalizedQuery)
		);
	});
}

export function useAdminSettingsUserApiPermissions({
	isAdmin,
	rbacKnownUsers,
}: {
	isAdmin: boolean;
	rbacKnownUsers: string[];
}) {
	const [apiPermTargetUser, setApiPermTargetUser] = useState("");
	const [apiPermFilter, setApiPermFilter] = useState("");
	const [apiPermDraft, setApiPermDraft] = useState<
		Record<string, ApiPermissionDecision>
	>({});

	const apiCatalogQ = useQuery({
		queryKey: queryKeys.adminApiCatalog(),
		queryFn: getAdminAPICatalog,
		enabled: isAdmin,
		staleTime: 60_000,
		retry: false,
	});
	const userApiPermsQ = useQuery({
		queryKey: queryKeys.adminUserApiPermissions(apiPermTargetUser || "none"),
		queryFn: () => getAdminUserAPIPermissions(apiPermTargetUser),
		enabled: isAdmin && apiPermTargetUser.trim().length > 0,
		staleTime: 15_000,
		retry: false,
	});

	useEffect(() => {
		if (!apiPermTargetUser.trim() && rbacKnownUsers.length > 0) {
			setApiPermTargetUser(rbacKnownUsers[0] ?? "");
			return;
		}
		if (
			apiPermTargetUser.trim() &&
			!rbacKnownUsers.includes(apiPermTargetUser.trim())
		) {
			setApiPermTargetUser(rbacKnownUsers[0] ?? "");
		}
	}, [rbacKnownUsers, apiPermTargetUser]);

	useEffect(() => {
		setApiPermDraft(collectApiPermissionDraft(userApiPermsQ.data?.permissions));
	}, [userApiPermsQ.data?.permissions]);

	const filteredApiCatalogEntries = useMemo(
		() => filterApiCatalogEntries(apiCatalogQ.data?.entries, apiPermFilter),
		[apiCatalogQ.data?.entries, apiPermFilter],
	);

	const saveUserApiPermissions = useMutation({
		mutationFn: async () => {
			if (!apiPermTargetUser.trim()) {
				throw new Error("select a target user");
			}
			const permissions: AdminUserAPIPermission[] = [];
			for (const [key, decision] of Object.entries(apiPermDraft)) {
				if (decision !== "allow" && decision !== "deny") {
					continue;
				}
				const [service, endpoint, method] = key.split("::");
				if (!service || !endpoint || !method) continue;
				permissions.push({
					service,
					endpoint,
					method,
					decision,
				});
			}
			return putAdminUserAPIPermissions(apiPermTargetUser, {
				permissions,
			});
		},
		onSuccess: async () => {
			toast.success("API permissions updated");
			await userApiPermsQ.refetch();
		},
		onError: (e) => {
			toast.error("Failed to update API permissions", {
				description: (e as Error).message,
			});
		},
	});

	const apiDraftOverrideCount = useMemo(
		() =>
			Object.values(apiPermDraft).filter(
				(value) => value === "allow" || value === "deny",
			).length,
		[apiPermDraft],
	);

	return {
		apiPermTargetUser,
		setApiPermTargetUser,
		apiPermFilter,
		setApiPermFilter,
		apiPermDraft,
		setApiPermDraft,
		apiDraftOverrideCount,
		apiCatalogQ,
		userApiPermsQ,
		filteredApiCatalogEntries,
		saveUserApiPermissions,
		apiPermissionKey,
	};
}
