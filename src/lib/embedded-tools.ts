import type { UIConfigResponse } from "./api-client";
import { SKYFORGE_API } from "./skyforge-config";

export type EmbeddedToolId =
	| "forward-cluster"
	| "grafana"
	| "prometheus"
	| "netbox"
	| "nautobot"
	| "jira"
	| "rapid7"
	| "elk"
	| "infoblox"
	| "git"
	| "artifacts"
	| "dns"
	| "coder"
	| "api-testing";

export type EmbeddedToolDefinition = {
	id: EmbeddedToolId;
	title: string;
	description: string;
	featureFlag?: keyof NonNullable<UIConfigResponse["features"]>;
	pathStrategy?: "compose" | "resolve";
	resolveUrl: (
		uiConfig: UIConfigResponse,
		options?: { path?: string },
	) => string;
};

function normalizeToolBase(baseUrl: string | undefined, fallback: string): string {
	const raw = String(baseUrl || "").trim();
	const value = raw || fallback;
	return value.endsWith("/") ? value.slice(0, -1) : value;
}

export const EMBEDDED_TOOL_DEFS: Record<
	EmbeddedToolId,
	EmbeddedToolDefinition
> = {
	"forward-cluster": {
		id: "forward-cluster",
		title: "Forward Cluster",
		description: "Embedded access to the in-app Forward cluster.",
		featureFlag: "forwardEnabled",
		pathStrategy: "resolve",
		resolveUrl: (_uiConfig, options) => {
			const params = new URLSearchParams();
			const next = String(options?.path ?? "").trim();
			if (next.startsWith("/")) {
				params.set("next", next);
			}
			const query = params.toString();
			return query ? `/api/forward/session?${query}` : "/api/forward/session";
		},
	},
	grafana: {
		id: "grafana",
		title: "Grafana",
		description: "Embedded platform Grafana observability UI.",
		featureFlag: "forwardGrafanaEnabled",
		resolveUrl: () => "/grafana",
	},
	prometheus: {
		id: "prometheus",
		title: "Prometheus",
		description: "Embedded platform Prometheus observability UI.",
		featureFlag: "forwardPrometheusEnabled",
		resolveUrl: () => "/prometheus",
	},
	netbox: {
		id: "netbox",
		title: "NetBox",
		description: "Embedded NetBox interface.",
		featureFlag: "netboxEnabled",
		resolveUrl: (uiConfig) => {
			const base = normalizeToolBase(uiConfig.netboxBaseUrl, "/netbox");
			return `${base}/oauth/login/oidc/?next=%2F`;
		},
	},
	nautobot: {
		id: "nautobot",
		title: "Nautobot",
		description: "Embedded Nautobot interface.",
		featureFlag: "nautobotEnabled",
		resolveUrl: (uiConfig) => {
			const base = normalizeToolBase(uiConfig.nautobotBaseUrl, "/nautobot");
			return `${base}/login/oidc/?next=%2F`;
		},
	},
	jira: {
		id: "jira",
		title: "Jira",
		description: "Embedded Jira interface.",
		featureFlag: "jiraEnabled",
		resolveUrl: (uiConfig) => uiConfig.jiraBaseUrl || "/jira",
	},
	rapid7: {
		id: "rapid7",
		title: "Rapid7",
		description: "Embedded Rapid7 interface.",
		featureFlag: "rapid7Enabled",
		resolveUrl: (uiConfig) => uiConfig.rapid7BaseUrl || "/rapid7",
	},
	elk: {
		id: "elk",
		title: "ELK",
		description: "Embedded ELK interface.",
		featureFlag: "elkEnabled",
		resolveUrl: (uiConfig) => uiConfig.elkBaseUrl || "/elk",
	},
	infoblox: {
		id: "infoblox",
		title: "Infoblox",
		description: "Embedded Infoblox UI.",
		featureFlag: "infobloxEnabled",
		resolveUrl: (uiConfig) => uiConfig.infobloxBaseUrl || "/infoblox",
	},
	git: {
		id: "git",
		title: "Git",
		description: "Embedded Gitea interface.",
		featureFlag: "giteaEnabled",
		resolveUrl: () => "/git/user/oauth2/oidc",
	},
	artifacts: {
		id: "artifacts",
		title: "Artifacts",
		description: "Embedded object storage browser.",
		resolveUrl: () => "/files/",
	},
	dns: {
		id: "dns",
		title: "DNS",
		description: "Embedded DNS portal.",
		featureFlag: "dnsEnabled",
		resolveUrl: () => `${SKYFORGE_API}/dns/sso?next=/dns/`,
	},
	coder: {
		id: "coder",
		title: "Coder",
		description: "Embedded Coder interface.",
		featureFlag: "coderEnabled",
		resolveUrl: () => "/coder/",
	},
	"api-testing": {
		id: "api-testing",
		title: "API Testing",
		description: "Embedded API testing interface.",
		featureFlag: "yaadeEnabled",
		resolveUrl: () => `${SKYFORGE_API}/yaade/sso`,
	},
};

export function embeddedToolHref(id: EmbeddedToolId): string {
	return `/dashboard/tools/${id}`;
}

export function embeddedToolPath(
	id: EmbeddedToolId,
	options?: { path?: string },
): string {
	const base = embeddedToolHref(id);
	const requestedPath = String(options?.path ?? "").trim();
	if (!requestedPath) return base;
	const safePath = requestedPath.startsWith("/") ? requestedPath : "";
	if (!safePath) return base;
	return `${base}?path=${encodeURIComponent(safePath)}`;
}
