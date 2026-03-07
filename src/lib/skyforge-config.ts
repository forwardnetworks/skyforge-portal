export const SKYFORGE_PROXY_ROOT = "";
export const SKYFORGE_API = "/api";

export type SkyforgeAuthMode = "oidc" | "local";
export type SkyforgeAuthProvider = "okta" | "local";

let runtimeAuthMode: SkyforgeAuthMode | null = null;
let runtimeAuthProvider: SkyforgeAuthProvider | null = null;

export function setRuntimeAuthMode(mode: string | null | undefined): void {
	if (mode === "local" || mode === "oidc") {
		runtimeAuthMode = mode;
		runtimeAuthProvider = mode === "oidc" ? "okta" : "local";
		return;
	}
	runtimeAuthMode = null;
	runtimeAuthProvider = null;
}

export function setRuntimeAuthProvider(provider: string | null | undefined): void {
	if (provider === "local" || provider === "okta") {
		runtimeAuthProvider = provider;
		runtimeAuthMode = provider === "okta" ? "oidc" : "local";
		return;
	}
	runtimeAuthProvider = null;
}

export function getRuntimeAuthMode(): SkyforgeAuthMode | null {
	return runtimeAuthMode;
}

export function getRuntimeAuthProvider(): SkyforgeAuthProvider | null {
	return runtimeAuthProvider;
}

export function buildLocalLoginUrl(next: string): string {
	const safeNext = next.startsWith("/") ? next : "/";
	return `/login/local?next=${encodeURIComponent(safeNext)}`;
}

export function buildLoginUrl(
	next: string,
	mode: SkyforgeAuthMode | null = runtimeAuthMode,
): string {
	const safeNext = next.startsWith("/") ? next : "/";
	if (mode == null) {
		return `${SKYFORGE_API}/reauth?next=${encodeURIComponent(safeNext)}`;
	}
	if (mode === "local") {
		return buildLocalLoginUrl(safeNext);
	}
	return `${SKYFORGE_API}/oidc/login?next=${encodeURIComponent(safeNext)}`;
}
