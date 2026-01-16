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
    const next = window.location.pathname + (window.location.search ?? "");
    window.location.href = buildLoginUrl(next);
    throw new ApiError("unauthorized", resp.status);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new ApiError(`request failed (${resp.status})`, resp.status, text);
  }

  return (await resp.json()) as T;
}
