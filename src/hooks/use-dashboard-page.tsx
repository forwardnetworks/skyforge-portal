import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getSession, getUserSettings } from "../lib/api-client";
import {
	type AdminPlatformOverviewResponseWithCapacity,
	getAdminPlatformOverview,
} from "../lib/api-client-admin";
import {
	type UserObservabilitySummaryResponse,
	getUserObservabilitySummary,
} from "../lib/api-client-forward-observability";
import {
	type ManagedIntegrationsStatusResponse,
	getManagedIntegrationsStatus,
} from "../lib/api-client-managed-integrations";
import {
	type CurrentPlatformAvailabilityResponse,
	getCurrentPlatformAvailability,
	getCurrentPlatformReservations,
	normalizePlatformReservationRecord,
} from "../lib/api-client-platform";
import {
	type PublicStatusSummaryResponse,
	getPublicStatusSummary,
} from "../lib/api-client-public-status";
import { getToolCatalog } from "../lib/api-client-tool-catalog";
import {
	catalogRouteAllowsAccess,
	indexCatalogRouteAccess,
	lookupCatalogRouteAccess,
} from "../lib/catalog-route-access";
import { queryKeys } from "../lib/query-keys";
import { useStatusSummaryEvents } from "../lib/status-events";
import {
	type ToolCatalogActionEntry,
	type ToolCatalogContentEntry,
	type ToolCatalogTextEntry,
	indexToolLaunches,
} from "../lib/tool-launches";
import {
	type UIExperienceMode,
	normalizeUIExperienceMode,
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
	canAccessPlatformView: boolean;
	adminOverview: AdminPlatformOverviewResponseWithCapacity | undefined;
	statusSummary: PublicStatusSummaryResponse | undefined;
	managedIntegrations: ManagedIntegrationsStatusResponse | undefined;
	observabilitySummary: UserObservabilitySummaryResponse | undefined;
	forwardClusterLaunchHref: string;
	dashboardHeroActions: ToolCatalogActionEntry[];
	dashboardContent: ToolCatalogContentEntry[];
	dashboardNextSteps: ToolCatalogTextEntry[];
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
	const toolCatalogQ = useQuery({
		queryKey: queryKeys.toolCatalog(),
		queryFn: getToolCatalog,
		staleTime: 5 * 60_000,
		retry: false,
		enabled: sessionQ.data?.authenticated === true,
	});

	const session = sessionQ.data;
	const forwardClusterLaunchHref = useMemo(() => {
		return (
			indexToolLaunches(toolCatalogQ.data?.tools)["forward-cluster"]
				?.navigationHref ?? ""
		);
	}, [toolCatalogQ.data?.tools]);
	const dashboardHeroActions = useMemo(
		() =>
			(toolCatalogQ.data?.dashboardHeroActions ?? [])
				.filter((entry) => entry.allowed !== false)
				.sort(
					(left, right) => Number(left.order ?? 0) - Number(right.order ?? 0),
				),
		[toolCatalogQ.data?.dashboardHeroActions],
	);
	const dashboardNextSteps = useMemo(
		() =>
			(toolCatalogQ.data?.dashboardNextSteps ?? [])
				.filter((entry) => entry.allowed !== false)
				.sort(
					(left, right) => Number(left.order ?? 0) - Number(right.order ?? 0),
				),
		[toolCatalogQ.data?.dashboardNextSteps],
	);
	const dashboardContent = useMemo(
		() =>
			(toolCatalogQ.data?.dashboardContent ?? [])
				.filter((entry) => entry.allowed !== false)
				.sort(
					(left, right) => Number(left.order ?? 0) - Number(right.order ?? 0),
				),
		[toolCatalogQ.data?.dashboardContent],
	);
	const canAccessPlatformView = useMemo(() => {
		const route = lookupCatalogRouteAccess(
			indexCatalogRouteAccess(toolCatalogQ.data?.routes),
			"/dashboard/platform",
		);
		if (!route) {
			throw new Error(
				"route /dashboard/platform is missing a catalog route contract",
			);
		}
		return catalogRouteAllowsAccess(route);
	}, [toolCatalogQ.data?.routes]);

	useStatusSummaryEvents(sessionQ.data?.authenticated === true);

	const overviewQ = useQuery({
		queryKey: queryKeys.adminPlatformOverview(),
		queryFn: getAdminPlatformOverview,
		staleTime: 30_000,
		retry: false,
		enabled: canAccessPlatformView,
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
		canAccessPlatformView,
		adminOverview: overviewQ.data,
		statusSummary: statusSummaryQ.data,
		managedIntegrations: managedIntegrationsQ.data,
		observabilitySummary: observabilityQ.data,
		forwardClusterLaunchHref,
		dashboardHeroActions,
		dashboardContent,
		dashboardNextSteps,
		uiExperienceMode: normalizeUIExperienceMode(
			userSettingsQ.data?.uiExperienceMode,
		),
	};
}
