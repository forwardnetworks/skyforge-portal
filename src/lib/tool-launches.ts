export type ToolLaunchEntry = {
	id: string;
	title: string;
	description?: string;
	category?: string;
	navigationHref: string;
	navigationMode?: string;
	launchMode?: string;
	authMode?: string;
	contentUrl?: string;
	supportsWake?: boolean;
};

export type ToolLaunchMap = Record<string, ToolLaunchEntry>;

export function toolRouteHref(id: string): string {
	return `/dashboard/tools/${encodeURIComponent(String(id ?? "").trim())}`;
}

export function toolRoutePath(id: string, options?: { path?: string }): string {
	const base = toolRouteHref(id);
	const requestedPath = String(options?.path ?? "").trim();
	if (!requestedPath || !requestedPath.startsWith("/")) {
		return base;
	}
	return `${base}?path=${encodeURIComponent(requestedPath)}`;
}

export function indexToolLaunches(
	tools?: ToolLaunchEntry[] | null,
): ToolLaunchMap {
	const out: ToolLaunchMap = {};
	for (const tool of tools ?? []) {
		const id = String(tool?.id ?? "").trim();
		if (!id) continue;
		out[id] = tool;
	}
	return out;
}

export function composeToolContentUrl(base: string, path: string): string {
	const normalizedBase = String(base ?? "").trim();
	if (!normalizedBase) return "";
	const normalizedPath = String(path ?? "").trim();
	if (!normalizedPath || !normalizedPath.startsWith("/")) return normalizedBase;
	try {
		const baseURL = new URL(normalizedBase, window.location.origin);
		const next = new URL(normalizedPath, baseURL);
		if (/^https?:\/\//i.test(normalizedBase)) return next.toString();
		return `${next.pathname}${next.search}${next.hash}`;
	} catch {
		return normalizedBase;
	}
}

export function buildForwardSessionHref(nextPath?: string): string {
	const params = new URLSearchParams();
	const next = String(nextPath ?? "").trim();
	if (next.startsWith("/")) {
		params.set("next", next);
	}
	const query = params.toString();
	return query ? `/api/forward/session?${query}` : "/api/forward/session";
}

export function isDirectToolLaunch(tool?: ToolLaunchEntry | null): boolean {
	return String(tool?.navigationMode ?? "").trim() === "direct";
}

export function opensToolInNewTab(tool?: ToolLaunchEntry | null): boolean {
	return String(tool?.launchMode ?? "").trim() === "new_tab";
}
