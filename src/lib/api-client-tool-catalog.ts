import { apiFetch } from "./http";
import type { ToolLaunchEntry, ToolNavigationSection } from "./tool-launches";

export type ToolCatalogResponse = {
	sections?: ToolNavigationSection[];
	tools?: ToolLaunchEntry[];
};

export async function getToolCatalog(): Promise<ToolCatalogResponse> {
	return apiFetch<ToolCatalogResponse>("/api/tooling/catalog");
}
