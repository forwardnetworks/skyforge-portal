import { apiFetch } from "./http";
import type {
	ToolCatalogActionEntry,
	ToolCatalogContentEntry,
	ToolCatalogTextEntry,
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
	dashboardHeroActions?: ToolCatalogActionEntry[];
	dashboardContent?: ToolCatalogContentEntry[];
	dashboardNextSteps?: ToolCatalogTextEntry[];
	tools?: ToolLaunchEntry[];
};

export async function getToolCatalog(): Promise<ToolCatalogResponse> {
	return apiFetch<ToolCatalogResponse>("/api/tooling/catalog");
}
