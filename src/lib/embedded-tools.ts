import type { UIConfigResponse } from "./api-client";
import { SKYFORGE_API } from "./skyforge-config";

export type EmbeddedToolId =
	| "forward-cluster"
	| "netbox"
	| "nautobot"
	| "jira"
	| "rapid7"
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

export const EMBEDDED_TOOL_DEFS: Record<EmbeddedToolId, EmbeddedToolDefinition> = {
	"forward-cluster": {
		id: "forward-cluster",
		title: "Forward Cluster",
		description: "Embedded access to the in-app Forward cluster.",
		featureFlag: "forwardEnabled",
		resolveUrl: () => FORWARD_CLUSTER_URL,
	},
	netbox: {
		id: "netbox",
		title: "NetBox",
		description: "Embedded NetBox workspace.",
		featureFlag: "netboxEnabled",
		resolveUrl: (uiConfig) => uiConfig.netboxBaseUrl || "/netbox/",
	},
	nautobot: {
		id: "nautobot",
		title: "Nautobot",
		description: "Embedded Nautobot workspace.",
		featureFlag: "nautobotEnabled",
		resolveUrl: (uiConfig) => uiConfig.nautobotBaseUrl || "/nautobot/",
	},
	jira: {
		id: "jira",
		title: "Jira",
		description: "Embedded Jira workspace.",
		featureFlag: "jiraEnabled",
		resolveUrl: (uiConfig) => uiConfig.jiraBaseUrl || "/jira",
	},
	rapid7: {
		id: "rapid7",
		title: "Rapid7",
		description: "Embedded Rapid7 workspace.",
		featureFlag: "rapid7Enabled",
		resolveUrl: (uiConfig) => uiConfig.rapid7BaseUrl || "/rapid7",
	},
	git: {
		id: "git",
		title: "Git",
		description: "Embedded Gitea workspace.",
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
		description: "Embedded Coder workspace.",
		featureFlag: "coderEnabled",
		resolveUrl: () => "/coder/",
	},
	"api-testing": {
		id: "api-testing",
		title: "API Testing",
		description: "Embedded API testing workspace.",
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
