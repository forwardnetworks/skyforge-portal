export const SKYFORGE_PROXY_ROOT = "/api/skyforge";
export const SKYFORGE_API = `${SKYFORGE_PROXY_ROOT}/api`;

export function buildLoginUrl(next: string): string {
  const safeNext = next.startsWith("/") ? next : "/";
  return `${SKYFORGE_API}/oidc/login?next=${encodeURIComponent(safeNext)}`;
}

