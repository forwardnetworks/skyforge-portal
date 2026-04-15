import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
	getAdminPlatformOverview,
	getAdminPlatformReservations,
	normalizePlatformReservationRecord,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import {
	bumpCount,
	getPriorityTier,
	normalizeAvailabilityByClass,
	normalizeCapacityPools,
	normalizeDemandByClass,
	normalizeEstimateActualByClass,
	normalizePoolCostInputs,
} from "./platform-capacity-page-normalize";

export function usePlatformCapacityOverview() {
	const overviewQ = useQuery({
		queryKey: queryKeys.adminPlatformOverview(),
		queryFn: getAdminPlatformOverview,
		staleTime: 60_000,
		refetchInterval: 60_000,
		retry: false,
	});

	const reservationsQ = useQuery({
		queryKey: queryKeys.adminPlatformReservations(),
		queryFn: getAdminPlatformReservations,
		staleTime: 60_000,
		refetchInterval: 60_000,
		retry: false,
	});

	const reservations = useMemo(
		() =>
			(reservationsQ.data?.reservations ?? []).map((record) =>
				normalizePlatformReservationRecord(record),
			),
		[reservationsQ.data],
	);

	const capacityPools = useMemo(() => {
		const overview = overviewQ.data;
		return normalizeCapacityPools(
			overview?.capacityPools ??
				overview?.capacityPoolInventory ??
				overview?.pools ??
				[],
		);
	}, [overviewQ.data]);

	const demandByClass = useMemo(() => {
		const overview = overviewQ.data;
		return normalizeDemandByClass(
			overview?.demandByClass ??
				overview?.demandByResourceClass ??
				overview?.resourceDemandByClass ??
				{},
		);
	}, [overviewQ.data]);

	const availabilityByClass = useMemo(() => {
		const overview = overviewQ.data;
		return normalizeAvailabilityByClass(
			overview?.availabilityByClass ??
				overview?.availabilityByResourceClass ??
				{},
		);
	}, [overviewQ.data]);

	const estimateActualByClass = useMemo(() => {
		const overview = overviewQ.data;
		return normalizeEstimateActualByClass(overview?.estimateActualByClass ?? []);
	}, [overviewQ.data]);

	const poolCostInputs = useMemo(() => {
		const overview = overviewQ.data;
		return normalizePoolCostInputs(overview?.poolCostInputs ?? []);
	}, [overviewQ.data]);

	const baselineMonthlyCostCents = useMemo(
		() => overviewQ.data?.baselineMonthlyCostCents ?? 0,
		[overviewQ.data],
	);

	const reservationsByPriority = useMemo(() => {
		const tally: Record<string, number> = {};
		for (const reservation of reservations) {
			bumpCount(tally, getPriorityTier(reservation));
		}
		return tally;
	}, [reservations]);

	const curatedDemoReservations = useMemo(
		() => reservations.filter((reservation) => reservation.isCuratedDemo).length,
		[reservations],
	);

	const adminOverrideReservations = useMemo(
		() => reservations.filter((reservation) => reservation.adminOverride).length,
		[reservations],
	);

	return {
		overviewQ,
		reservationsQ,
		reservations,
		capacityPools,
		demandByClass,
		availabilityByClass,
		estimateActualByClass,
		poolCostInputs,
		baselineMonthlyCostCents,
		reservationsByPriority,
		curatedDemoReservations,
		adminOverrideReservations,
	};
}
