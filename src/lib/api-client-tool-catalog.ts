import { apiFetch } from "./http";
import type {
	ToolLaunchEntry,
	ToolNavigationEntry,
	ToolNavigationSection,
	ToolRouteAccessEntry,
} from "./tool-launches";

export type ToolCatalogResponse = {
	sections?: ToolNavigationSection[];
	entries?: ToolNavigationEntry[];
	routes?: ToolRouteAccessEntry[];
	tools?: ToolLaunchEntry[];
};

export async function getToolCatalog(): Promise<ToolCatalogResponse> {
	return apiFetch<ToolCatalogResponse>("/api/tooling/catalog");
}
