export type ToolNavigationSection = {
	id: string;
	label: string;
	icon: string;
	order: number;
	defaultExpanded: boolean;
};

export type ToolNavigationEntry = {
	id: string;
	label: string;
	navigationSection: string;
	navigationOrder: number;
	navigationIcon: string;
	navigationHref: string;
	experience: string;
	displayMode?: string;
	featureFlag?: string;
	adminOnly?: boolean;
	allowed?: boolean;
};

export type ToolRouteAccessEntry = {
	path: string;
	experience: string;
	adminOnly?: boolean;
	allowed?: boolean;
};

export type ToolLaunchpadEntry = {
	id: string;
	title: string;
	description: string;
	href: string;
	icon: string;
	order: number;
	allowed?: boolean;
};

export type ToolCatalogActionEntry = {
	id: string;
	label: string;
	href: string;
	icon?: string;
	variant?: string;
	order: number;
	allowed?: boolean;
};

export type ToolCatalogTextEntry = {
	id: string;
	text: string;
	order: number;
	allowed?: boolean;
};

export type ToolLaunchEntry = {
	id: string;
	title: string;
	description?: string;
	category?: string;
	experience: string;
	navigationSection: string;
	navigationLabel: string;
	navigationOrder: number;
	navigationIcon: string;
	navigationHref: string;
	navigationMode?: string;
	launchMode?: string;
	authMode?: string;
	contentUrl?: string;
	embedMode?: string;
	embedLoadTimeoutSecs?: number;
	embedFallbackMode?: string;
	supportsWake?: boolean;
	requiredCapabilities?: string[];
	allowed?: boolean;
};

export type ToolLaunchMap = Record<string, ToolLaunchEntry>;
export type ToolNavigationEntryMap = Record<string, ToolNavigationEntry>;
export type ToolRouteAccessMap = Record<string, ToolRouteAccessEntry>;

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

export function indexToolNavigationEntries(
	entries?: ToolNavigationEntry[] | null,
): ToolNavigationEntryMap {
	const out: ToolNavigationEntryMap = {};
	for (const entry of entries ?? []) {
		const id = String(entry?.id ?? "").trim();
		if (!id) continue;
		out[id] = entry;
	}
	return out;
}

export function indexToolRouteAccessEntries(
	routes?: ToolRouteAccessEntry[] | null,
): ToolRouteAccessMap {
	const out: ToolRouteAccessMap = {};
	for (const route of routes ?? []) {
		const path = String(route?.path ?? "").trim();
		if (!path) continue;
		out[path] = route;
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

export function toolEmbedLoadTimeoutMs(tool?: ToolLaunchEntry | null): number {
	const secs = Number(tool?.embedLoadTimeoutSecs ?? 0);
	if (!Number.isFinite(secs) || secs <= 0) return 0;
	return Math.round(secs * 1000);
}

export function toolAllowsEmbedFallbackToNewTab(
	tool?: ToolLaunchEntry | null,
): boolean {
	return String(tool?.embedFallbackMode ?? "").trim() === "new_tab";
}

export function forwardNetworkSessionHref(networkID: string): string {
	const id = String(networkID ?? "").trim();
	if (!id) return "";
	return `/api/forward/networks/${encodeURIComponent(id)}/session`;
}

export function isDirectToolLaunch(tool?: ToolLaunchEntry | null): boolean {
	return String(tool?.navigationMode ?? "").trim() === "direct";
}

export function opensToolInNewTab(tool?: ToolLaunchEntry | null): boolean {
	return String(tool?.launchMode ?? "").trim() === "new_tab";
}
