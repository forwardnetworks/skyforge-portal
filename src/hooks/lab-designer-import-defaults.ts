export function defaultLabDesignerImportDir(
	source: "user" | "blueprints",
): string {
	return source === "user" ? "kne/designer" : "netlab";
}

export function normalizeLabDesignerImportDir(
	source: "user" | "blueprints",
	dir: string,
): string {
	const trimmed = String(dir ?? "").trim().replace(/^\/+|\/+$/g, "");
	if (source === "user") {
		if (!trimmed || trimmed === "kne") {
			return "kne/designer";
		}
		return trimmed;
	}
	if (
		!trimmed ||
		trimmed === "kne" ||
		trimmed === "blueprints/kne" ||
		trimmed === "blueprints/netlab"
	) {
		return "netlab";
	}
	return trimmed;
}
