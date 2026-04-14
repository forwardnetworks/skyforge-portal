import type { StartupConfigData } from "@/components/lab-designer-types";

export function normalizeStartupConfig(
	value: unknown,
): StartupConfigData | undefined {
	if (typeof value === "string") {
		const path = value.trim();
		return path ? { mode: "path", path } : undefined;
	}
	if (!value || typeof value !== "object") return undefined;
	const raw = value as Record<string, unknown>;
	const mode = String(raw.mode ?? "").trim().toLowerCase();
	const path = String(raw.path ?? "").trim();
	const content = String(raw.content ?? "");
	if (mode === "inline") {
		if (!content.trim() && !path) return undefined;
		return {
			mode: "inline",
			path: path || undefined,
			content: content || undefined,
		};
	}
	if (mode === "path" || path) {
		return path ? { mode: "path", path } : undefined;
	}
	return undefined;
}

export function startupConfigPath(
	value: StartupConfigData | undefined,
): string | undefined {
	if (!value) return undefined;
	if (value.mode === "path") {
		const path = String(value.path ?? "").trim();
		return path || undefined;
	}
	const generated = String(value.path ?? "").trim();
	return generated || undefined;
}
