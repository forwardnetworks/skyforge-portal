import { usePlatformCapacityOverview } from "./use-platform-capacity-overview";
import { usePlatformCapacityReservationActions } from "./use-platform-capacity-reservation-actions";
import { usePlatformCapacityRuntimePolicy } from "./use-platform-capacity-runtime-policy";

export function usePlatformCapacityPage() {
	const overview = usePlatformCapacityOverview();
	const reservationActions = usePlatformCapacityReservationActions();
	const runtimePolicy = usePlatformCapacityRuntimePolicy();

	return {
		...overview,
		...reservationActions,
		...runtimePolicy,
	};
}

export type PlatformCapacityPageState = ReturnType<
	typeof usePlatformCapacityPage
>;
