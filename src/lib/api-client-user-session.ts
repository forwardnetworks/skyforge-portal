import { apiFetch } from "./http";
import type { operations } from "./openapi.gen";

export type SessionResponseEnvelope =
	operations["GET:authn.Session"]["responses"][200]["content"]["application/json"];

export async function getSession(): Promise<SessionResponseEnvelope> {
	return apiFetch<SessionResponseEnvelope>("/api/auth/session");
}

export async function refreshSession(): Promise<SessionResponseEnvelope> {
	return apiFetch<SessionResponseEnvelope>("/api/auth/refresh", {
		method: "POST",
		body: "{}",
	});
}
