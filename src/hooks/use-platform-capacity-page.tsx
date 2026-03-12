import { usePlatformCapacityOverview } from "./use-platform-capacity-overview";
import { usePlatformCapacityReservationActions } from "./use-platform-capacity-reservation-actions";

export function usePlatformCapacityPage() {
	const overview = usePlatformCapacityOverview();
	const reservationActions = usePlatformCapacityReservationActions();

	return {
		...overview,
		...reservationActions,
	};
}

export type PlatformCapacityPageState = ReturnType<
	typeof usePlatformCapacityPage
>;
