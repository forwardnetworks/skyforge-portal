export function defaultLabDesignerImportDir(
	source: "user" | "blueprints",
): string {
	return source === "user" ? "kne/designer" : "kne";
}

export function normalizeLabDesignerImportDir(
	source: "user" | "blueprints",
	dir: string,
): string {
	const trimmed = String(dir ?? "").trim().replace(/^\/+|\/+$/g, "");
	if (source === "user") {
		if (
			!trimmed ||
			trimmed === "kne" ||
			trimmed === "netlab" ||
			trimmed === "blueprints/netlab"
		) {
			return "kne/designer";
		}
		return trimmed;
	}
	if (
		!trimmed ||
		trimmed === "netlab" ||
		trimmed === "kne/designer" ||
		trimmed === "blueprints/kne" ||
		trimmed === "blueprints/netlab"
	) {
		return "kne";
	}
	return trimmed;
}
