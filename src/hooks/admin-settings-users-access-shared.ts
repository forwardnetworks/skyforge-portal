import type {
	AdminUserRoleRecord,
	AdminUserRolesResponse,
} from "../lib/api-client";

export type RefetchableQuery = {
	refetch: () => Promise<unknown>;
};

export type AdminUserRolesQuery = RefetchableQuery & {
	data?: AdminUserRolesResponse;
	isLoading: boolean;
};

export type AdminSettingsUsersAccessArgs = {
	isAdmin: boolean;
	knownUsersFromScopes: string[];
	adminUserRolesQ: AdminUserRolesQuery;
	userScopesQ: RefetchableQuery;
	sessionQ: RefetchableQuery;
};

export type ApiPermissionDecision = "inherit" | "allow" | "deny";

const defaultRbacRoles = ["ADMIN", "USER"];

export function normalizeAvailableRbacRoles(
	roles: AdminUserRolesResponse["availableRoles"] | undefined,
): string[] {
	const normalized = (roles ?? [])
		.map((role) =>
			String(role ?? "")
				.trim()
				.toUpperCase(),
		)
		.filter((role) => role.length > 0);
	return normalized.length > 0 ? normalized : defaultRbacRoles;
}

export function collectKnownRbacUsers(
	knownUsersFromScopes: string[],
	roleRows: AdminUserRoleRecord[] | undefined,
): string[] {
	const users = new Set(knownUsersFromScopes);
	for (const row of roleRows ?? []) {
		const username = String(row.username ?? "").trim();
		if (username) users.add(username);
	}
	return Array.from(users).sort((a, b) => a.localeCompare(b));
}

export function filterUsernames(usernames: string[], query: string): string[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (!normalizedQuery) return usernames;
	return usernames.filter((username) =>
		username.toLowerCase().includes(normalizedQuery),
	);
}

export function apiPermissionKey(entry: {
	service: string;
	endpoint: string;
	method: string;
}): string {
	return `${entry.service.trim()}::${entry.endpoint.trim()}::${entry.method
		.trim()
		.toUpperCase()}`;
}
