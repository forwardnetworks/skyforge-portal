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
  const resp = await fetch(`${SKYFORGE_PROXY_ROOT}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (resp.status === 401 || resp.status === 403) {
    // Only redirect if we are in a browser environment
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname + (window.location.search ?? "");
      // Prevent redirect loops if already on a login-related page (though unlikely with this logic)
      window.location.href = buildLoginUrl(currentPath);
    }
    throw new ApiError("unauthorized", resp.status);
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