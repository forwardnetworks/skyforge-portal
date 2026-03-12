import type {
	AdminPlatformAvailabilityByClass,
	AdminPlatformCapacityPool,
	AdminPlatformDemandByClass,
} from "../lib/api-client";
import { normalizeInteger } from "./platform-capacity-page-shared";

type NormalizedCapacityPool = {
	name: string;
	poolClass: string;
	resourceClass: string;
	nodeCount: number;
	readyNodeCount: number;
	allocatableMilliCpu: number;
	allocatableMemoryBytes: number;
	requestedMilliCpu: number;
	requestedMemoryBytes: number;
	availableMilliCpu: number;
	availableMemoryBytes: number;
};

type NormalizedDemandByClass = {
	resourceClass: string;
	queuedTasks: number;
	runningTasks: number;
	activeDeployments: number;
	requestedReservations: number;
	approvedReservations: number;
	persistentLabs: number;
};

type NormalizedAvailabilityByClass = {
	resourceClass: string;
	estimatedCapacityUnits: number;
	requestedReservations: number;
	approvedReservations: number;
	reservedBlocks: number;
	immediateAvailability: number;
};

export function normalizeCapacityPools(raw: unknown): AdminPlatformCapacityPool[] {
	if (!raw || typeof raw !== "object") {
		return [];
	}

	if (Array.isArray(raw)) {
		return raw
			.map((pool): NormalizedCapacityPool | null => {
				if (typeof pool !== "object" || pool === null) {
					return null;
				}
				const asRecord = pool as Record<string, unknown>;
				return {
					name: String(asRecord.name ?? asRecord.resourceClass ?? ""),
					poolClass: String(asRecord.poolClass ?? ""),
					resourceClass: String(asRecord.resourceClass ?? asRecord.name ?? ""),
					nodeCount: normalizeInteger(asRecord.nodeCount),
					readyNodeCount: normalizeInteger(asRecord.readyNodeCount),
					allocatableMilliCpu: normalizeInteger(asRecord.allocatableMilliCpu),
					allocatableMemoryBytes: normalizeInteger(
						asRecord.allocatableMemoryBytes,
					),
					requestedMilliCpu: normalizeInteger(asRecord.requestedMilliCpu),
					requestedMemoryBytes: normalizeInteger(asRecord.requestedMemoryBytes),
					availableMilliCpu: normalizeInteger(asRecord.availableMilliCpu),
					availableMemoryBytes: normalizeInteger(asRecord.availableMemoryBytes),
				};
			})
			.filter((value): value is NormalizedCapacityPool => value !== null)
			.map((pool): AdminPlatformCapacityPool => pool);
	}

	const entries = Object.entries(raw as Record<string, unknown>);
	return entries
		.map(([key, item]): NormalizedCapacityPool | null => {
			if (typeof item === "object" && item !== null) {
				const asRecord = item as Record<string, unknown>;
				return {
					name: String(asRecord.name ?? asRecord.resourceClass ?? key),
					poolClass: String(asRecord.poolClass ?? ""),
					resourceClass: String(asRecord.resourceClass ?? key),
					nodeCount: normalizeInteger(asRecord.nodeCount),
					readyNodeCount: normalizeInteger(asRecord.readyNodeCount),
					allocatableMilliCpu: normalizeInteger(asRecord.allocatableMilliCpu),
					allocatableMemoryBytes: normalizeInteger(
						asRecord.allocatableMemoryBytes,
					),
					requestedMilliCpu: normalizeInteger(asRecord.requestedMilliCpu),
					requestedMemoryBytes: normalizeInteger(asRecord.requestedMemoryBytes),
					availableMilliCpu: normalizeInteger(asRecord.availableMilliCpu),
					availableMemoryBytes: normalizeInteger(asRecord.availableMemoryBytes),
				};
			}
			return {
				name: key,
				poolClass: "",
				resourceClass: key,
				nodeCount: normalizeInteger(item),
				readyNodeCount: normalizeInteger(item),
				allocatableMilliCpu: normalizeInteger(item),
				allocatableMemoryBytes: normalizeInteger(item),
				requestedMilliCpu: 0,
				requestedMemoryBytes: 0,
				availableMilliCpu: normalizeInteger(item),
				availableMemoryBytes: normalizeInteger(item),
			};
		})
		.filter((value): value is NormalizedCapacityPool => value !== null)
		.map((pool): AdminPlatformCapacityPool => pool);
}

export function normalizeDemandByClass(raw: unknown): AdminPlatformDemandByClass[] {
	if (!raw || typeof raw !== "object") {
		return [];
	}
	if (Array.isArray(raw)) {
		return raw
			.map((item): NormalizedDemandByClass | null => {
				if (typeof item !== "object" || item === null) {
					return null;
				}
				const asRecord = item as Record<string, unknown>;
				const resourceClass = String(
					asRecord.resourceClass ?? asRecord.className ?? "",
				).trim();
				if (!resourceClass) {
					return null;
				}
				return {
					resourceClass,
					queuedTasks: normalizeInteger(asRecord.queuedTasks),
					runningTasks: normalizeInteger(asRecord.runningTasks),
					activeDeployments: normalizeInteger(asRecord.activeDeployments),
					requestedReservations: normalizeInteger(
						asRecord.requestedReservations ??
							asRecord.requested ??
							asRecord.count ??
							asRecord.value,
					),
					approvedReservations: normalizeInteger(asRecord.approvedReservations),
					persistentLabs: normalizeInteger(asRecord.persistentLabs),
				};
			})
			.filter((value): value is NormalizedDemandByClass => value !== null)
			.map((item): AdminPlatformDemandByClass => item);
	}

	return Object.entries(raw as Record<string, unknown>).map(
		([className, entry]): NormalizedDemandByClass => {
			if (typeof entry === "object" && entry !== null) {
				const asRecord = entry as Record<string, unknown>;
				return {
					resourceClass: className,
					queuedTasks: normalizeInteger(asRecord.queuedTasks),
					runningTasks: normalizeInteger(asRecord.runningTasks),
					activeDeployments: normalizeInteger(asRecord.activeDeployments),
					requestedReservations: normalizeInteger(
						asRecord.requestedReservations ?? asRecord.requested ?? asRecord.count,
					),
					approvedReservations: normalizeInteger(asRecord.approvedReservations),
					persistentLabs: normalizeInteger(asRecord.persistentLabs),
				};
			}
			const requestedReservations = normalizeInteger(entry);
			return {
				resourceClass: className,
				queuedTasks: 0,
				runningTasks: 0,
				activeDeployments: 0,
				requestedReservations,
				approvedReservations: 0,
				persistentLabs: 0,
			};
		},
	);
}

export function normalizeAvailabilityByClass(
	raw: unknown,
): AdminPlatformAvailabilityByClass[] {
	if (!raw || typeof raw !== "object") {
		return [];
	}
	if (Array.isArray(raw)) {
		return raw
			.map((item): NormalizedAvailabilityByClass | null => {
				if (typeof item !== "object" || item === null) {
					return null;
				}
				const asRecord = item as Record<string, unknown>;
				const resourceClass = String(
					asRecord.resourceClass ?? asRecord.className ?? "",
				).trim();
				if (!resourceClass) {
					return null;
				}
				return {
					resourceClass,
					estimatedCapacityUnits: normalizeInteger(
						asRecord.estimatedCapacityUnits ?? asRecord.capacityUnits,
					),
					requestedReservations: normalizeInteger(asRecord.requestedReservations),
					approvedReservations: normalizeInteger(asRecord.approvedReservations),
					reservedBlocks: normalizeInteger(asRecord.reservedBlocks),
					immediateAvailability: normalizeInteger(asRecord.immediateAvailability),
				};
			})
			.filter(
				(value): value is NormalizedAvailabilityByClass => value !== null,
			);
	}

	return Object.entries(raw as Record<string, unknown>).map(([className, entry]) => {
		if (typeof entry === "object" && entry !== null) {
			const asRecord = entry as Record<string, unknown>;
			return {
				resourceClass: className,
				estimatedCapacityUnits: normalizeInteger(
					asRecord.estimatedCapacityUnits ?? asRecord.capacityUnits,
				),
				requestedReservations: normalizeInteger(asRecord.requestedReservations),
				approvedReservations: normalizeInteger(asRecord.approvedReservations),
				reservedBlocks: normalizeInteger(asRecord.reservedBlocks),
				immediateAvailability: normalizeInteger(asRecord.immediateAvailability),
			};
		}
		return {
			resourceClass: className,
			estimatedCapacityUnits: normalizeInteger(entry),
			requestedReservations: 0,
			approvedReservations: 0,
			reservedBlocks: 0,
			immediateAvailability: normalizeInteger(entry),
		};
	});
}
