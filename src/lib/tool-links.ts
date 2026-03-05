import { buildLoginUrl } from "./skyforge-config";

export const CODER_NEXT_PATH = "/coder/";

export function buildCoderLaunchUrl(): string {
	return buildLoginUrl(CODER_NEXT_PATH);
}
