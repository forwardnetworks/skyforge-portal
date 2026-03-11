import { type SkyforgeAuthMode, buildLoginUrl } from "./skyforge-config";

export const CODER_NEXT_PATH = "/coder/";

export function buildToolLaunchUrl(
	nextPath: string,
	options?: {
		authMode?: SkyforgeAuthMode | null;
		authenticated?: boolean;
	},
): string {
	if (options?.authenticated) {
		return nextPath;
	}
	return buildLoginUrl(nextPath, options?.authMode ?? null);
}

export function buildCoderLaunchUrl(options?: {
	authMode?: SkyforgeAuthMode | null;
	authenticated?: boolean;
}): string {
	return buildToolLaunchUrl(CODER_NEXT_PATH, options);
}
