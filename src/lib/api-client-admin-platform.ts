import type { operations, components } from "./openapi.gen";

import { apiFetch } from "./http";

export type AdminPlatformOverviewResponse =
	operations["GET:skyforge.GetAdminPlatformOverview"]["responses"][200]["content"]["application/json"];

export type AdminPlatformCapacityPool = {
	name?: string;
	poolClass?: string;
	resourceClass?: string;
	nodeCount?: number;
	readyNodeCount?: number;
	allocatableMilliCpu?: number;
	allocatableMemoryBytes?: number;
	requestedMilliCpu?: number;
	requestedMemoryBytes?: number;
	availableMilliCpu?: number;
	availableMemoryBytes?: number;
	[key: string]: unknown;
};

export type AdminPlatformDemandByClass = {
	resourceClass: string;
	queuedTasks?: number;
	runningTasks?: number;
	activeDeployments?: number;
	requestedReservations?: number;
	approvedReservations?: number;
	persistentLabs?: number;
	[key: string]: unknown;
};

export type AdminPlatformAvailabilityByClass = {
	resourceClass: string;
	estimatedCapacityUnits?: number;
	requestedReservations?: number;
	approvedReservations?: number;
	reservedBlocks?: number;
	immediateAvailability?: number;
	[key: string]: unknown;
};

export type AdminPlatformEstimateActualByClass = {
	resourceClass: string;
	activeDeployments?: number;
	measuredDeployments?: number;
	estimatedMilliCpu?: number;
	actualRequestedMilliCpu?: number;
	driftMilliCpu?: number;
	estimatedMemoryBytes?: number;
	actualRequestedMemoryBytes?: number;
	driftMemoryBytes?: number;
	[key: string]: unknown;
};

export type AdminPlatformPoolCostInput = {
	name?: string;
	provider?: string | null;
	nodeCount?: number;
	readyNodeCount?: number;
	instanceTypes?: Record<string, number>;
	monthlyNodeCostCents?: number;
	estimatedMonthlyCostCents?: number;
	[key: string]: unknown;
};

export type AdminPlatformMarginalCostByClass = {
	resourceClass: string;
	cloudCapacityUnits?: number;
	blendedCapacityUnits?: number;
	cloudMonthlyCostCents?: number;
	blendedMonthlyCostCents?: number;
	cloudUnitCostCents?: number;
	blendedUnitCostCents?: number;
	[key: string]: unknown;
};

export type AdminPlatformInfraSlice = {
	nodeCount?: number;
	readyNodeCount?: number;
	allocatableMilliCpu?: number;
	allocatableMemoryBytes?: number;
	availableMilliCpu?: number;
	availableMemoryBytes?: number;
	estimatedMonthlyCostCents?: number;
	providerCount?: number;
	mode?: string | null;
	[key: string]: unknown;
};

export type AdminPlatformInfraComparison = {
	cloud?: AdminPlatformInfraSlice;
	onPrem?: AdminPlatformInfraSlice;
	total?: AdminPlatformInfraSlice;
	recommended?: string | null;
	summary?: string | null;
	[key: string]: unknown;
};

export type AdminPlatformWarning = {
	code?: string;
	severity?: string;
	summary?: string;
	recommendedAction?: string;
	[key: string]: unknown;
};

export type AdminPlatformOverviewResponseWithCapacity =
	AdminPlatformOverviewResponse & {
		capacityPools?: AdminPlatformCapacityPool[] | Record<string, unknown>[] | null;
		capacityPoolInventory?: AdminPlatformCapacityPool[] | Record<string, unknown>[] | null;
		pools?: AdminPlatformCapacityPool[] | Record<string, unknown>[] | null;
		demandByClass?:
			| Record<string, number>
			| AdminPlatformDemandByClass[]
			| Record<string, AdminPlatformDemandByClass>
			| null;
		demandByResourceClass?:
			| Record<string, number>
			| AdminPlatformDemandByClass[]
			| Record<string, AdminPlatformDemandByClass>
			| null;
		resourceDemandByClass?:
			| Record<string, number>
			| AdminPlatformDemandByClass[]
			| Record<string, AdminPlatformDemandByClass>
			| null;
		availabilityByClass?:
			| Record<string, number>
			| AdminPlatformAvailabilityByClass[]
			| Record<string, AdminPlatformAvailabilityByClass>
			| null;
		availabilityByResourceClass?:
			| Record<string, number>
			| AdminPlatformAvailabilityByClass[]
			| Record<string, AdminPlatformAvailabilityByClass>
			| null;
		estimateActualByClass?:
			| Record<string, number>
			| AdminPlatformEstimateActualByClass[]
			| Record<string, AdminPlatformEstimateActualByClass>
			| null;
		marginalCostByClass?:
			| AdminPlatformMarginalCostByClass[]
			| Record<string, AdminPlatformMarginalCostByClass>
			| null;
		poolCostInputs?: AdminPlatformPoolCostInput[] | Record<string, unknown>[] | null;
		infraComparison?: AdminPlatformInfraComparison | null;
		baselineMonthlyCostCents?: number;
		warnings?: AdminPlatformWarning[] | null;
	};

export async function getAdminPlatformOverview(): Promise<AdminPlatformOverviewResponseWithCapacity> {
	return apiFetch<AdminPlatformOverviewResponseWithCapacity>(
		"/api/admin/platform/overview",
	);
}

export type AdminPlatformReservationsResponse =
	operations["GET:skyforge.ListAdminPlatformReservations"]["responses"][200]["content"]["application/json"];

export type AdminPlatformReservationLifecycleResponse =
	operations["GET:skyforge.GetAdminPlatformReservationLifecycle"]["responses"][200]["content"]["application/json"];

export async function getAdminPlatformReservations(): Promise<AdminPlatformReservationsResponse> {
	return apiFetch<AdminPlatformReservationsResponse>(
		"/api/admin/platform/reservations",
	);
}

export async function getAdminPlatformReservationLifecycle(
	id: string,
): Promise<AdminPlatformReservationLifecycleResponse> {
	return apiFetch<AdminPlatformReservationLifecycleResponse>(
		`/api/admin/platform/reservations/${encodeURIComponent(id)}/lifecycle`,
	);
}

export type CreateAdminPlatformReservationRequest = NonNullable<
	operations["POST:skyforge.CreateAdminPlatformReservation"]["requestBody"]
>["content"]["application/json"];

export type CreateAdminPlatformReservationResponse =
	components["schemas"]["platform.ReservationRecord"];

export async function createAdminPlatformReservation(
	body: CreateAdminPlatformReservationRequest,
): Promise<CreateAdminPlatformReservationResponse> {
	return apiFetch<CreateAdminPlatformReservationResponse>(
		"/api/admin/platform/reservations",
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export type AdminPlatformUserPolicyResponse =
	operations["GET:skyforge.GetAdminPlatformUserPolicy"]["responses"][200]["content"]["application/json"];

export type PutAdminPlatformUserProfilesRequest = NonNullable<
	operations["PUT:skyforge.PutAdminPlatformUserProfiles"]["requestBody"]
>["content"]["application/json"];

export type PutAdminPlatformUserQuotaRequest = NonNullable<
	operations["PUT:skyforge.PutAdminPlatformUserQuota"]["requestBody"]
>["content"]["application/json"];

export async function getAdminPlatformUserPolicy(
	username: string,
): Promise<AdminPlatformUserPolicyResponse> {
	return apiFetch<AdminPlatformUserPolicyResponse>(
		`/api/admin/platform/users/${encodeURIComponent(username)}/policy`,
	);
}

export async function putAdminPlatformUserProfiles(
	username: string,
	body: PutAdminPlatformUserProfilesRequest,
): Promise<AdminPlatformUserPolicyResponse> {
	return apiFetch<AdminPlatformUserPolicyResponse>(
		`/api/admin/platform/users/${encodeURIComponent(username)}/profiles`,
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export async function putAdminPlatformUserQuota(
	username: string,
	body: PutAdminPlatformUserQuotaRequest,
): Promise<AdminPlatformUserPolicyResponse> {
	return apiFetch<AdminPlatformUserPolicyResponse>(
		`/api/admin/platform/users/${encodeURIComponent(username)}/quota`,
		{
			method: "PUT",
			body: JSON.stringify(body),
		},
	);
}

export type AdminForwardTenantResetRunsResponse =
	operations["GET:skyforge.ListAdminForwardTenantRebuildRuns"]["responses"][200]["content"]["application/json"];
export type AdminForwardTenantResetRun =
	AdminForwardTenantResetRunsResponse["runs"][number];
export type RequestAdminForwardTenantRebuildRequest = NonNullable<
	operations["POST:skyforge.RequestAdminForwardTenantRebuild"]["requestBody"]
>["content"]["application/json"];

export async function getAdminForwardTenantRebuildRuns(
	username: string,
): Promise<AdminForwardTenantResetRunsResponse> {
	return apiFetch<AdminForwardTenantResetRunsResponse>(
		`/api/admin/forward/orgs/${encodeURIComponent(username)}/rebuild/runs`,
	);
}

export async function requestAdminForwardTenantRebuild(
	username: string,
	body: RequestAdminForwardTenantRebuildRequest,
): Promise<AdminForwardTenantResetRun> {
	return apiFetch<AdminForwardTenantResetRun>(
		`/api/admin/forward/orgs/${encodeURIComponent(username)}/rebuild`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}

export type UpdateAdminPlatformReservationStatusRequest = {
	status: "approved" | "rejected" | "cancelled";
};

export type UpdateAdminPlatformReservationStatusResponse =
	components["schemas"]["platform.ReservationRecord"];

export async function updateAdminPlatformReservationStatus(
	id: string,
	body: UpdateAdminPlatformReservationStatusRequest,
): Promise<UpdateAdminPlatformReservationStatusResponse> {
	return apiFetch<UpdateAdminPlatformReservationStatusResponse>(
		`/api/admin/platform/reservations/${encodeURIComponent(id)}/status`,
		{
			method: "POST",
			body: JSON.stringify(body),
		},
	);
}
