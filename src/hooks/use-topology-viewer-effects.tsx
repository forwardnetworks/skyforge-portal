import { useTopologyViewerMenusAndFetchEffects } from "./use-topology-viewer-effects-menus-fetch";
import { useTopologyViewerPersistAndDeepLinkEffects } from "./use-topology-viewer-effects-persist-deeplink";
import { useTopologyViewerStatsStreamEffects } from "./use-topology-viewer-effects-stats-stream";
import type { UseTopologyViewerEffectsArgs } from "./use-topology-viewer-effects-types";

export function useTopologyViewerEffects(args: UseTopologyViewerEffectsArgs) {
	useTopologyViewerPersistAndDeepLinkEffects(args);
	useTopologyViewerMenusAndFetchEffects(args);
	useTopologyViewerStatsStreamEffects(args);
}
