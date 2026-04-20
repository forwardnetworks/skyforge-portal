import { SKYFORGE_PROXY_ROOT, buildLoginUrl } from "./skyforge-config";

export class ApiError extends Error {
	status: number;
	bodyText?: string;

	constructor(message: string, status: number, bodyText?: string) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.bodyText = bodyText;
	}
}

export type AuthRedirectMode = "auto" | "always" | "never";

export type ApiFetchInit = RequestInit & {
	authRedirect?: AuthRedirectMode;
};

let unauthorizedRedirectInFlight = false;

async function bestEffortLogout(): Promise<void> {
	await fetch(`${SKYFORGE_PROXY_ROOT}/api/auth/logout`, {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: "{}",
	}).catch(() => undefined);
}

export function isProtectedPath(pathname: string): boolean {
	return /^\/(dashboard|admin)(\/|$)/.test(pathname);
}

export function triggerUnauthorizedRedirect() {
	if (typeof window === "undefined" || unauthorizedRedirectInFlight) return;
	unauthorizedRedirectInFlight = true;
	const currentPath = window.location.pathname + (window.location.search ?? "");
	void (async () => {
		await bestEffortLogout();
		window.location.replace(buildLoginUrl(currentPath));
	})();
}

export function resetUnauthorizedRedirectStateForTests() {
	unauthorizedRedirectInFlight = false;
}

function shouldRedirectOnUnauthorized(
	path: string,
	method: string,
	authRedirect: AuthRedirectMode,
): boolean {
	if (authRedirect === "never") return false;
	if (authRedirect === "always") return true;
	// In auto mode, only force re-auth when the user is already in a protected
	// area. This avoids login loops on public/landing pages, but prevents 401s
	// from surfacing as hard app errors on authenticated routes.
	void path;
	void method;
	if (typeof window === "undefined") return false;
	return isProtectedPath(window.location.pathname);
}

export function extractErrorMessage(bodyText: string): string {
	const raw = (bodyText ?? "").trim();
	if (!raw) return "";
	try {
		const parsed = JSON.parse(raw) as any;
		// Encore errs shape: { code, message, details }
		if (typeof parsed?.message === "string" && parsed.message.trim()) {
			return parsed.message.trim();
		}
		// Google/others: { error: { message } }
		if (
			typeof parsed?.error?.message === "string" &&
			parsed.error.message.trim()
		) {
			return parsed.error.message.trim();
		}
	} catch {
		// ignore
	}
	return raw;
}

export async function apiFetch<T>(
	path: string,
	init?: ApiFetchInit,
): Promise<T> {
	const { authRedirect = "auto", ...requestInitRaw } = init ?? {};
	const requestInit: RequestInit = requestInitRaw;
	const method = (requestInit.method ?? "GET").toUpperCase();
	const resp = await fetch(`${SKYFORGE_PROXY_ROOT}${path}`, {
		credentials: "include",
		...requestInit,
		headers: {
			"Content-Type": "application/json",
			...(requestInit.headers ?? {}),
		},
	});

	// 401 means "not logged in" -> redirect to the runtime-selected login path.
	// 403 means "logged in but forbidden" -> do NOT redirect; show an error instead.
	if (resp.status === 401) {
		const text = await resp.text().catch(() => "");
		if (shouldRedirectOnUnauthorized(path, method, authRedirect)) {
			triggerUnauthorizedRedirect();
		}
		throw new ApiError("unauthorized", resp.status, text);
	}
	if (resp.status === 403) {
		const text = await resp.text().catch(() => "");
		const detail = extractErrorMessage(text);
		throw new ApiError(
			detail ? `forbidden: ${detail}` : "forbidden",
			resp.status,
			text,
		);
	}

	if (!resp.ok) {
		const text = await resp.text().catch(() => "");
		const detail = extractErrorMessage(text);
		throw new ApiError(
			detail
				? `request failed (${resp.status}): ${detail}`
				: `request failed (${resp.status})`,
			resp.status,
			text,
		);
	}

	// Handle 204 No Content
	if (resp.status === 204) {
		return {} as T;
	}

	return (await resp.json()) as T;
}
