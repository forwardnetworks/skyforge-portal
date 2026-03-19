import { apiFetch } from "./http";
import type {
	ToolCatalogActionEntry,
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
	dashboardNextSteps?: ToolCatalogTextEntry[];
	tools?: ToolLaunchEntry[];
};

export async function getToolCatalog(): Promise<ToolCatalogResponse> {
	return apiFetch<ToolCatalogResponse>("/api/tooling/catalog");
}
