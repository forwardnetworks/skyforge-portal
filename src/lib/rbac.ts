export type Role = "USER" | "ADMIN";

type SessionRecord = {
	isAdmin?: unknown;
	roles?: unknown;
	effectiveRole?: unknown;
};

function toSessionRecord(session: unknown): SessionRecord {
	if (!session || typeof session !== "object") {
		return {};
	}
	return session as SessionRecord;
}

function normalizeRole(value: unknown): Role | "" {
	if (typeof value !== "string") return "";
	const upper = value.trim().toUpperCase();
	if (upper === "ADMIN") return "ADMIN";
	if (upper === "USER") return "USER";
	return "";
}

export function sessionRoles(session: unknown): Role[] {
	const s = toSessionRecord(session);
	const out = new Set<Role>();
	if (Array.isArray(s.roles)) {
		for (const raw of s.roles) {
			const role = normalizeRole(raw);
			if (role) out.add(role);
		}
	}
	if (s.isAdmin === true) out.add("ADMIN");
	out.add("USER");
	return Array.from(out);
}

export function sessionEffectiveRole(session: unknown): Role {
	const s = toSessionRecord(session);
	const role = normalizeRole(s.effectiveRole);
	if (role) return role;
	return sessionHasRole(session, "ADMIN") ? "ADMIN" : "USER";
}

export function sessionHasRole(session: unknown, role: Role): boolean {
	const roles = sessionRoles(session);
	return roles.includes(role);
}

export function sessionIsAdmin(session: unknown): boolean {
	return sessionHasRole(session, "ADMIN");
}
