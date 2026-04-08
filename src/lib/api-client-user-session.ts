import { ApiError, apiFetch } from "./http";
import type { operations } from "./openapi.gen";

export type SessionResponseEnvelope =
	operations["GET:authn.Session"]["responses"][200]["content"]["application/json"];

export async function getSession(): Promise<SessionResponseEnvelope> {
	try {
		return await apiFetch<SessionResponseEnvelope>("/api/auth/session", {
			authRedirect: "never",
		});
	} catch (error) {
		// Landing and login routes must treat "no cookie yet" as a normal anonymous state.
		// This avoids redirect loops before auth mode is loaded from /api/ui/config.
		if (error instanceof ApiError && error.status === 401) {
			return {
				actorUsername: "",
				authenticated: false,
				displayName: "",
				effectiveRole: "",
				email: "",
				expiresAt: "",
				groups: [],
				impersonating: false,
				isAdmin: false,
				roles: [],
				username: "",
			};
		}
		throw error;
	}
}

export async function refreshSession(): Promise<SessionResponseEnvelope> {
	return apiFetch<SessionResponseEnvelope>("/api/auth/refresh", {
		method: "POST",
		body: "{}",
	});
}
