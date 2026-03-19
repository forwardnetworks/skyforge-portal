import { apiFetch } from "./http";
import type { ToolLaunchEntry } from "./tool-launches";

export type ToolCatalogResponse = {
	tools?: ToolLaunchEntry[];
};

export async function getToolCatalog(): Promise<ToolCatalogResponse> {
	return apiFetch<ToolCatalogResponse>("/api/tooling/catalog");
}
