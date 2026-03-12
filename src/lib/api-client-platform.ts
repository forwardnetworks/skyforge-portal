import { apiFetch } from "./http";
import type { components, operations } from "./openapi.gen";

export type CurrentPlatformPolicyResponse =
	operations["GET:skyforge.GetCurrentPlatformPolicy"]["responses"][200]["content"]["application/json"];

export type CurrentPlatformAvailabilityResponse =
	operations["GET:skyforge.GetCurrentPlatformAvailability"]["responses"][200]["content"]["application/json"] & {
		infraComparison?: PlatformInfraComparison | null;
		warnings?: PlatformWarning[] | null;
	};

export type CurrentPlatformReservationsResponse =
	operations["GET:skyforge.ListCurrentPlatformReservations"]["responses"][200]["content"]["application/json"];

export type CurrentPlatformReservationPreflightResponse =
	operations["POST:skyforge.PreflightCurrentPlatformReservation"]["responses"][200]["content"]["application/json"];

export type CurrentPlatformReservationLifecycleResponse =
	operations["GET:skyforge.GetCurrentPlatformReservationLifecycle"]["responses"][200]["content"]["application/json"];

export type PlatformReservationRecord =
	components["schemas"]["platform.ReservationRecord"];

export type PlatformWarning = {
	code?: string;
	severity?: string;
	summary?: string;
	recommendedAction?: string;
};

export type PlatformInfraSlice = {
	nodeCount?: number;
	readyNodeCount?: number;
	allocatableMilliCpu?: number;
	allocatableMemoryBytes?: number;
	availableMilliCpu?: number;
	availableMemoryBytes?: number;
	estimatedMonthlyCostCents?: number;
	providerCount?: number;
	mode?: string | null;
};

export type PlatformInfraComparison = {
	cloud?: PlatformInfraSlice | null;
	onPrem?: PlatformInfraSlice | null;
	total?: PlatformInfraSlice | null;
	recommended?: string | null;
	summary?: string | null;
};

type PlatformReservationCompat = PlatformReservationRecord & {
	priorityTier?: string;
	adminOverride?: boolean;
	isCuratedDemo?: boolean;
};

export type PlatformReservationView = PlatformReservationCompat & {
	priorityTier: string;
	adminOverride: boolean;
};

export type CreateCurrentPlatformReservationRequest = NonNullable<
	operations["POST:skyforge.CreateCurrentPlatformReservation"]["requestBody"]
>["content"]["application/json"];

export type PreflightCurrentPlatformReservationRequest = NonNullable<
	operations["POST:skyforge.PreflightCurrentPlatformReservation"]["requestBody"]
>["content"]["application/json"];

export type ExtendedCreateCurrentPlatformReservationRequest =
	CreateCurrentPlatformReservationRequest & {
		priorityTier?: string;
		adminOverride?: boolean;
	};

function parseBooleanish(value: string | boolean | undefined): boolean {
	if (typeof value === "boolean") return value;
	if (typeof value !== "string") return false;
	if (!value) return false;

	const normalized = value.trim().toLowerCase();
	return ["1", "true", "yes", "on", "y", "t"].includes(normalized);
}

export function normalizePlatformReservationPriorityTier(
	record: PlatformReservationCompat,
): string {
	const metadata = record.metadata ?? {};
	const fallback =
		record.priorityTier ||
		metadata.priorityTier ||
		metadata["priority"] ||
		metadata.priority_tier ||
		"standard";
	return String(fallback || "standard");
}

export function normalizePlatformReservationAdminOverride(
	record: PlatformReservationCompat,
): boolean {
	if (typeof record.adminOverride === "boolean") return record.adminOverride;
	const metadata = record.metadata ?? {};
	const fromMetadata =
		metadata.adminOverride ??
		metadata.admin_override ??
		metadata.AdminOverride ??
		metadata["admin-override"];
	return parseBooleanish(fromMetadata);
}

export function normalizePlatformReservationRecord(
	record: PlatformReservationRecord,
): PlatformReservationView {
	const compat = record as PlatformReservationCompat;
	const priorityTier = normalizePlatformReservationPriorityTier(compat).toLowerCase();
	const metadata = compat.metadata ?? {};
	const adminOverride =
		normalizePlatformReservationAdminOverride(compat);
	const isCuratedDemoFromMetadata =
		metadata.isCuratedDemo === "true" ||
		metadata.curatedDemo === "true" ||
		metadata.reservationType === "curated-demo" ||
		priorityTier === "curated-demo" ||
		metadata.priorityTier === "curated-demo" ||
		compat.resourceClass === "demo-foundry";
	const isCuratedDemo =
		compat.isCuratedDemo ??
		isCuratedDemoFromMetadata;

	return {
		...compat,
		priorityTier,
		adminOverride,
		isCuratedDemo: Boolean(isCuratedDemo),
	};
}

export async function getCurrentPlatformPolicy(): Promise<CurrentPlatformPolicyResponse> {
	return apiFetch<CurrentPlatformPolicyResponse>("/api/platform/policy");
}

export async function getCurrentPlatformAvailability(): Promise<CurrentPlatformAvailabilityResponse> {
	return apiFetch<CurrentPlatformAvailabilityResponse>("/api/platform/availability");
}

export async function getCurrentPlatformReservations(): Promise<CurrentPlatformReservationsResponse> {
	return apiFetch<CurrentPlatformReservationsResponse>("/api/platform/reservations");
}

export async function getCurrentPlatformReservationLifecycle(
	id: string,
): Promise<CurrentPlatformReservationLifecycleResponse> {
	return apiFetch<CurrentPlatformReservationLifecycleResponse>(
		`/api/platform/reservations/${encodeURIComponent(id)}/lifecycle`,
	);
}

export async function preflightCurrentPlatformReservation(
	body: PreflightCurrentPlatformReservationRequest,
): Promise<CurrentPlatformReservationPreflightResponse> {
	return apiFetch<CurrentPlatformReservationPreflightResponse>(
		"/api/platform/reservation-preflight",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export async function createCurrentPlatformReservation(
	body: ExtendedCreateCurrentPlatformReservationRequest,
): Promise<PlatformReservationRecord> {
	return apiFetch<PlatformReservationRecord>("/api/platform/reservations", {
		method: "POST",
		body: JSON.stringify(body),
	});
}

export async function cancelCurrentPlatformReservation(
	id: string,
): Promise<PlatformReservationRecord> {
	return apiFetch<PlatformReservationRecord>(
		`/api/platform/reservations/${encodeURIComponent(id)}/cancel`,
		{
			method: "POST",
			body: "{}",
		},
	);
}
