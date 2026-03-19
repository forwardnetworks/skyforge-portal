import type { UIExperienceMode } from "./api-client-user-settings";

export type { UIExperienceMode } from "./api-client-user-settings";

export const DEFAULT_UI_EXPERIENCE_MODE: UIExperienceMode = "simple";

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
