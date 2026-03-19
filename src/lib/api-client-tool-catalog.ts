import { apiFetch } from "./http";
import type {
	ToolLaunchEntry,
	ToolLaunchpadEntry,
	ToolNavigationEntry,
	ToolNavigationSection,
	ToolRouteAccessEntry,
} from "./tool-launches";

export type ToolCatalogResponse = {
	sections?: ToolNavigationSection[];
	entries?: ToolNavigationEntry[];
	routes?: ToolRouteAccessEntry[];
	launchpad?: ToolLaunchpadEntry[];
	tools?: ToolLaunchEntry[];
};

export async function getToolCatalog(): Promise<ToolCatalogResponse> {
	return apiFetch<ToolCatalogResponse>("/api/tooling/catalog");
}
