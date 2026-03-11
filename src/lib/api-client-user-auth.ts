import { ApiError, extractErrorMessage } from "./http";
import type { operations } from "./openapi.gen";
import {
	SKYFORGE_API,
	SKYFORGE_PROXY_ROOT,
	buildLocalLoginUrl,
	buildLoginUrl,
} from "./skyforge-config";

export { buildLocalLoginUrl, buildLoginUrl, SKYFORGE_API, SKYFORGE_PROXY_ROOT };

export async function logout(): Promise<void> {
	const resp = await fetch(`${SKYFORGE_PROXY_ROOT}/api/auth/logout`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: "{}",
	});
	if (!resp.ok) {
		const text = await resp.text().catch(() => "");
		throw new Error(`logout failed (${resp.status}): ${text}`);
	}
}

export type LoginRequest = {
	username: string;
	password: string;
};

export async function login(
	req: LoginRequest,
): Promise<
	operations["POST:authn.Login"]["responses"][200]["content"]["application/json"]
> {
	const resp = await fetch(`${SKYFORGE_PROXY_ROOT}/api/auth/login`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(req),
	});
	if (!resp.ok) {
		const text = await resp.text().catch(() => "");
		const detail = extractErrorMessage(text);
		throw new ApiError(
			detail
				? `login failed (${resp.status}): ${detail}`
				: `login failed (${resp.status})`,
			resp.status,
			text,
		);
	}
	return (await resp.json()) as operations["POST:authn.Login"]["responses"][200]["content"]["application/json"];
}
