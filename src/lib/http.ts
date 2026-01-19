import { buildLoginUrl, SKYFORGE_PROXY_ROOT } from "./skyforge-config";

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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const resp = await fetch(`${SKYFORGE_PROXY_ROOT}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  // 401 means "not logged in" (OIDC session missing/expired) -> redirect to login.
  // 403 means "logged in but forbidden" -> do NOT redirect to Dex; show an error instead.
  if (resp.status === 401) {
    const text = await resp.text().catch(() => "");
    // Only auto-redirect for navigation-style GET requests.
    // For mutations (PUT/POST/DELETE), bubble an error so the UI can show a toast
    // and not kick the user out to Dex while they are editing a form.
    if (method === "GET" && typeof window !== "undefined") {
      const currentPath = window.location.pathname + (window.location.search ?? "");
      window.location.href = buildLoginUrl(currentPath);
    }
    throw new ApiError("unauthorized", resp.status, text);
  }
  if (resp.status === 403) {
    const text = await resp.text().catch(() => "");
    throw new ApiError("forbidden", resp.status, text);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new ApiError(`request failed (${resp.status})`, resp.status, text);
  }

  // Handle 204 No Content
  if (resp.status === 204) {
    return {} as T;
  }

  return (await resp.json()) as T;
}
