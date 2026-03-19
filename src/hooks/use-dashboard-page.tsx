import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSession, getUserSettings } from "../lib/api-client";
import {
	getAdminPlatformOverview,
	type AdminPlatformOverviewResponseWithCapacity,
} from "../lib/api-client-admin";
import {
	getUserObservabilitySummary,
	type UserObservabilitySummaryResponse,
} from "../lib/api-client-forward-observability";
import {
	getPublicStatusSummary,
	type PublicStatusSummaryResponse,
} from "../lib/api-client-public-status";
import {
	getCurrentPlatformAvailability,
	type CurrentPlatformAvailabilityResponse,
	getCurrentPlatformReservations,
	normalizePlatformReservationRecord,
} from "../lib/api-client-platform";
import {
	getManagedIntegrationsStatus,
	type ManagedIntegrationsStatusResponse,
} from "../lib/api-client-managed-integrations";
import { queryKeys } from "../lib/query-keys";
import { sessionIsAdmin } from "../lib/rbac";
import { useStatusSummaryEvents } from "../lib/status-events";
import {
	normalizeUIExperienceMode,
	type UIExperienceMode,
} from "../lib/ui-experience";

export type ReservationTotals = {
	status: string;
	count: number;
};

export type DashboardPageState = {
	session: Awaited<ReturnType<typeof getSession>> | undefined;
	platformAvailability: CurrentPlatformAvailabilityResponse | undefined;
	reservations: ReturnType<typeof normalizePlatformReservationRecord>[];
	reservationTotals: ReservationTotals[];
	isAdmin: boolean;
	adminOverview: AdminPlatformOverviewResponseWithCapacity | undefined;
	statusSummary: PublicStatusSummaryResponse | undefined;
	managedIntegrations: ManagedIntegrationsStatusResponse | undefined;
	observabilitySummary: UserObservabilitySummaryResponse | undefined;
	uiExperienceMode: UIExperienceMode;
};

export function useDashboardPage(): DashboardPageState {
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});

	const availabilityQ = useQuery({
		queryKey: queryKeys.currentPlatformAvailability(),
		queryFn: getCurrentPlatformAvailability,
		staleTime: 30_000,
		retry: false,
		enabled: sessionQ.isSuccess,
	});

	const reservationsQ = useQuery({
		queryKey: queryKeys.userPlatformReservations(),
		queryFn: getCurrentPlatformReservations,
		staleTime: 30_000,
		retry: false,
		enabled: sessionQ.isSuccess,
	});

	const session = sessionQ.data;
	const isAdmin = sessionIsAdmin(session);

	useStatusSummaryEvents(sessionQ.data?.authenticated === true);

	const overviewQ = useQuery({
		queryKey: queryKeys.adminPlatformOverview(),
		queryFn: getAdminPlatformOverview,
		staleTime: 30_000,
		retry: false,
		enabled: isAdmin,
	});
	const statusSummaryQ = useQuery({
		queryKey: queryKeys.statusSummary(),
		queryFn: getPublicStatusSummary,
		staleTime: 15_000,
		retry: false,
		enabled: sessionQ.data?.authenticated === true,
	});
	const observabilityQ = useQuery({
		queryKey: queryKeys.userObservabilitySummary(),
		queryFn: getUserObservabilitySummary,
		staleTime: 30_000,
		retry: false,
		enabled: sessionQ.data?.authenticated === true,
	});
	const managedIntegrationsQ = useQuery({
		queryKey: queryKeys.managedIntegrationsStatus(),
		queryFn: getManagedIntegrationsStatus,
		staleTime: 30_000,
		retry: false,
		enabled: sessionQ.data?.authenticated === true,
	});
	const userSettingsQ = useQuery({
		queryKey: queryKeys.userSettings(),
		queryFn: getUserSettings,
		staleTime: 30_000,
		retry: false,
		enabled: sessionQ.data?.authenticated === true,
	});

	const reservations = useMemo(() => {
		return (reservationsQ.data?.reservations ?? []).map((record) =>
			normalizePlatformReservationRecord(record),
		);
	}, [reservationsQ.data]);

	const reservationTotals = useMemo(() => {
		const counts = new Map<string, number>();
		for (const reservation of reservations) {
			const status = (reservation.status ?? "pending").toLowerCase();
			counts.set(status, (counts.get(status) ?? 0) + 1);
		}
		return Array.from(counts.entries()).map(([status, count]) => ({
			status,
			count,
		}));
	}, [reservations]);

	return {
		session,
		platformAvailability: availabilityQ.data,
		reservations,
		reservationTotals,
		isAdmin,
		adminOverview: overviewQ.data,
		statusSummary: statusSummaryQ.data,
		managedIntegrations: managedIntegrationsQ.data,
		observabilitySummary: observabilityQ.data,
		uiExperienceMode: normalizeUIExperienceMode(
			userSettingsQ.data?.uiExperienceMode,
		),
	};
}
