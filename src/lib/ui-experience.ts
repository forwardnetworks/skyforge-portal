import type { EmbeddedToolId } from "./embedded-tools";
import type { UIExperienceMode } from "./api-client-user-settings";

export type { UIExperienceMode } from "./api-client-user-settings";

export const DEFAULT_UI_EXPERIENCE_MODE: UIExperienceMode = "simple";

const advancedPathPrefixes = [
	"/dashboard/observability",
	"/dashboard/labs/designer",
	"/dashboard/forward-analytics",
	"/dashboard/servicenow",
	"/dashboard/teams",
	"/dashboard/config-changes",
	"/dashboard/platform",
	"/dashboard/deployments/new",
	"/dashboard/deployments/composite",
	"/dashboard/s3",
	"/dashboard/infoblox",
	"/dashboard/tools/",
	"/admin/",
	"/webhooks",
	"/syslog",
	"/snmp",
];

export function normalizeUIExperienceMode(
	value: string | null | undefined,
): UIExperienceMode {
	return String(value ?? "")
		.trim()
		.toLowerCase() === "advanced"
		? "advanced"
		: DEFAULT_UI_EXPERIENCE_MODE;
}

export function isSimpleUIExperienceMode(
	value: string | null | undefined,
): boolean {
	return normalizeUIExperienceMode(value) === "simple";
}

export function isAdvancedOnlyPathname(
	pathname: string,
	options?: { tool?: EmbeddedToolId | string | null },
): boolean {
	if (options?.tool) {
		return true;
	}
	return advancedPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}
