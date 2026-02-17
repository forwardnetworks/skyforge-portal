export type TemplateSourceUI = "user" | "blueprints" | "external";

export function parseTemplateSourceUI(
	source: string | undefined | null,
): TemplateSourceUI {
	switch (String(source ?? "").trim()) {
		case "blueprints":
		case "external":
		case "user":
			return source as TemplateSourceUI;
		default:
			return "user";
	}
}

export function toTemplateSourceBackend(source: TemplateSourceUI): string {
	return source;
}
