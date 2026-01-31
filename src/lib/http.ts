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

function extractErrorMessage(bodyText: string): string {
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
	init?: RequestInit,
): Promise<T> {
	const method = (init?.method ?? "GET").toUpperCase();
	const resp = await fetch(`${SKYFORGE_PROXY_ROOT}${path}`, {
		credentials: "include",
		...init,
		headers: {
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
	});

	// 401 means "not logged in" (OIDC session missing/expired) -> redirect to login.
	// 403 means "logged in but forbidden" -> do NOT redirect to Dex; show an error instead.
	if (resp.status === 401) {
		const text = await resp.text().catch(() => "");
		// Only auto-redirect for navigation-style GET requests.
		// For mutations (PUT/POST/DELETE), bubble an error so the UI can show a toast
		// and not kick the user out to Dex while they are editing a form.
		if (method === "GET" && typeof window !== "undefined") {
			const currentPath =
				window.location.pathname + (window.location.search ?? "");
			window.location.href = buildLoginUrl(currentPath);
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
