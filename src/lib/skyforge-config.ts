export const SKYFORGE_PROXY_ROOT = "";
export const SKYFORGE_API = "/api";

export function buildLoginUrl(next: string): string {
  const safeNext = next.startsWith("/") ? next : "/";
  return `${SKYFORGE_API}/oidc/login?next=${encodeURIComponent(safeNext)}`;
}
