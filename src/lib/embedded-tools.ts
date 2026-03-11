import type { UIConfigResponse } from "./api-client";
import { SKYFORGE_API } from "./skyforge-config";

export type EmbeddedToolId =
	| "forward-cluster"
	| "forward-grafana"
	| "forward-prometheus"
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
	resolveUrl: (uiConfig: UIConfigResponse) => string;
};

const FORWARD_CLUSTER_URL = "https://skyforge-fwd.local.forwardnetworks.com";

export const EMBEDDED_TOOL_DEFS: Record<
	EmbeddedToolId,
	EmbeddedToolDefinition
> = {
	"forward-cluster": {
		id: "forward-cluster",
		title: "Forward Cluster",
		description: "Embedded access to the in-app Forward cluster.",
		featureFlag: "forwardEnabled",
		resolveUrl: () => FORWARD_CLUSTER_URL,
	},
	"forward-grafana": {
		id: "forward-grafana",
		title: "Forward Grafana",
		description: "Embedded Forward Grafana observability UI.",
		featureFlag: "forwardEnabled",
		resolveUrl: () => "/grafana",
	},
	"forward-prometheus": {
		id: "forward-prometheus",
		title: "Forward Prometheus",
		description: "Embedded Forward Prometheus observability UI.",
		featureFlag: "forwardEnabled",
		resolveUrl: () => "/prometheus",
	},
	netbox: {
		id: "netbox",
		title: "NetBox",
		description: "Embedded NetBox interface.",
		featureFlag: "netboxEnabled",
		resolveUrl: (uiConfig) => uiConfig.netboxBaseUrl || "/netbox/",
	},
	nautobot: {
		id: "nautobot",
		title: "Nautobot",
		description: "Embedded Nautobot interface.",
		featureFlag: "nautobotEnabled",
		resolveUrl: (uiConfig) => uiConfig.nautobotBaseUrl || "/nautobot/",
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
		resolveUrl: () => "/api/gitea/public",
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
