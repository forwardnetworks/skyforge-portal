import type { PlatformCapacityPageState } from "@/hooks/use-platform-capacity-page";

import { PlatformCapacityAvailabilityTable } from "./platform-capacity-availability-table";
import { PlatformCapacityCostEstimateCards } from "./platform-capacity-cost-estimate-cards";
import { PlatformCapacityDemandTable } from "./platform-capacity-demand-table";
import { PlatformCapacityPoolsTable } from "./platform-capacity-pools-table";
import { PlatformCapacityReservationMetrics } from "./platform-capacity-reservation-metrics";
import {
	PlatformCapacityReservedBlockCard,
	PlatformCapacityReservationsAdminTable,
} from "./platform-capacity-reservation-admin";

export function PlatformCapacityTables({ page }: { page: PlatformCapacityPageState }) {
	const overview = page.overviewQ.data;

	return (
		<>
			<div className="grid gap-4 xl:grid-cols-3">
				<PlatformCapacityPoolsTable pools={page.capacityPools} />
				<PlatformCapacityDemandTable demand={page.demandByClass} />
				<PlatformCapacityAvailabilityTable availability={page.availabilityByClass} />
			</div>

			<PlatformCapacityCostEstimateCards
				estimateActualByClass={page.estimateActualByClass}
				poolCostInputs={page.poolCostInputs}
				overview={overview}
			/>

			<PlatformCapacityReservationMetrics overview={overview} reservationsByPriority={page.reservationsByPriority} />

			<PlatformCapacityReservedBlockCard
				reservedBlockResourceClass={page.reservedBlockResourceClass}
				setReservedBlockResourceClass={page.setReservedBlockResourceClass}
				reservedBlockStartAt={page.reservedBlockStartAt}
				setReservedBlockStartAt={page.setReservedBlockStartAt}
				reservedBlockEndAt={page.reservedBlockEndAt}
				setReservedBlockEndAt={page.setReservedBlockEndAt}
				reservedBlockNotes={page.reservedBlockNotes}
				setReservedBlockNotes={page.setReservedBlockNotes}
				createReservedBlockMutation={page.createReservedBlockMutation}
			/>

			<PlatformCapacityReservationsAdminTable
				reservations={page.reservations}
				updateReservationStatusMutation={page.updateReservationStatusMutation}
			/>
		</>
	);
}
