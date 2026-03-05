export const SKYFORGE_PROXY_ROOT = "";
export const SKYFORGE_API = "/api";

export type SkyforgeAuthMode = "oidc" | "password";

let runtimeAuthMode: SkyforgeAuthMode | null = null;

export function setRuntimeAuthMode(mode: string | null | undefined): void {
	if (mode === "password" || mode === "oidc") {
		runtimeAuthMode = mode;
		return;
	}
	runtimeAuthMode = null;
}

export function getRuntimeAuthMode(): SkyforgeAuthMode | null {
	return runtimeAuthMode;
}

export function buildLoginUrl(
	next: string,
	mode: SkyforgeAuthMode | null = runtimeAuthMode,
): string {
	const safeNext = next.startsWith("/") ? next : "/";
	if (mode == null) {
		return `${SKYFORGE_API}/reauth?next=${encodeURIComponent(safeNext)}`;
	}
	if (mode === "password") {
		return `/status?signin=1&next=${encodeURIComponent(safeNext)}`;
	}
	return `${SKYFORGE_API}/oidc/login?next=${encodeURIComponent(safeNext)}`;
}
