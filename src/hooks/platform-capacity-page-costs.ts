import type {
	AdminPlatformEstimateActualByClass,
	AdminPlatformPoolCostInput,
} from "../lib/api-client";
import { normalizeInteger } from "./platform-capacity-page-shared";

type NormalizedEstimateActualByClass = {
	resourceClass: string;
	activeDeployments: number;
	measuredDeployments: number;
	estimatedMilliCpu: number;
	actualRequestedMilliCpu: number;
	driftMilliCpu: number;
	estimatedMemoryBytes: number;
	actualRequestedMemoryBytes: number;
	driftMemoryBytes: number;
};

type NormalizedPoolCostInput = {
	name: string;
	provider?: string;
	nodeCount: number;
	readyNodeCount: number;
	instanceTypes: Record<string, number>;
	monthlyNodeCostCents: number;
	estimatedMonthlyCostCents: number;
};

export function normalizeEstimateActualByClass(
	raw: unknown,
): AdminPlatformEstimateActualByClass[] {
	if (!raw || typeof raw !== "object") {
		return [];
	}
	if (Array.isArray(raw)) {
		return raw
			.map((item): NormalizedEstimateActualByClass | null => {
				if (typeof item !== "object" || item === null) {
					return null;
				}
				const asRecord = item as Record<string, unknown>;
				const resourceClass = String(asRecord.resourceClass ?? "").trim();
				if (!resourceClass) {
					return null;
				}
				const estimatedMilliCpu = normalizeInteger(asRecord.estimatedMilliCpu);
				const actualMilliCpu = normalizeInteger(asRecord.actualRequestedMilliCpu);
				const estimatedMemory = normalizeInteger(asRecord.estimatedMemoryBytes);
				const actualMemory = normalizeInteger(asRecord.actualRequestedMemoryBytes);
				return {
					resourceClass,
					activeDeployments: normalizeInteger(asRecord.activeDeployments),
					measuredDeployments: normalizeInteger(asRecord.measuredDeployments),
					estimatedMilliCpu,
					actualRequestedMilliCpu: actualMilliCpu,
					driftMilliCpu: actualMilliCpu - estimatedMilliCpu,
					estimatedMemoryBytes: estimatedMemory,
					actualRequestedMemoryBytes: actualMemory,
					driftMemoryBytes: actualMemory - estimatedMemory,
				};
			})
			.filter((value): value is NormalizedEstimateActualByClass => value !== null)
			.map((item): AdminPlatformEstimateActualByClass => item);
	}
	return Object.entries(raw as Record<string, unknown>)
		.map(([className, entry]) => {
			const asRecord = typeof entry === "object" && entry !== null
				? (entry as Record<string, unknown>)
				: {};
			const estimatedMilliCpu = normalizeInteger(asRecord.estimatedMilliCpu);
			const actualMilliCpu = normalizeInteger(asRecord.actualRequestedMilliCpu);
			const estimatedMemory = normalizeInteger(asRecord.estimatedMemoryBytes);
			const actualMemory = normalizeInteger(asRecord.actualRequestedMemoryBytes);
			return {
				resourceClass: className,
				activeDeployments: normalizeInteger(asRecord.activeDeployments),
				measuredDeployments: normalizeInteger(asRecord.measuredDeployments),
				estimatedMilliCpu,
				actualRequestedMilliCpu: actualMilliCpu,
				driftMilliCpu: actualMilliCpu - estimatedMilliCpu,
				estimatedMemoryBytes: estimatedMemory,
				actualRequestedMemoryBytes: actualMemory,
				driftMemoryBytes: actualMemory - estimatedMemory,
			};
		})
		.map((item): AdminPlatformEstimateActualByClass => item);
}

export function normalizePoolCostInputs(raw: unknown): AdminPlatformPoolCostInput[] {
	if (!raw) {
		return [];
	}
	if (Array.isArray(raw)) {
		return raw
			.map((item): NormalizedPoolCostInput | null => {
				if (typeof item !== "object" || item === null) {
					return null;
				}
				return normalizePoolCostInputRecord(item as Record<string, unknown>);
			})
			.filter((value): value is NormalizedPoolCostInput => value !== null)
			.map((pool): AdminPlatformPoolCostInput => pool);
	}
	return Object.entries(raw as Record<string, unknown>)
		.map(([, entry]) =>
			normalizePoolCostInputRecord(
				typeof entry === "object" && entry !== null
					? (entry as Record<string, unknown>)
					: {},
			),
		)
		.map((pool): AdminPlatformPoolCostInput => pool);
}

function normalizePoolCostInputRecord(
	record: Record<string, unknown>,
): NormalizedPoolCostInput {
	const name = String(record.name ?? record.poolName ?? record.resourceClass ?? "default");
	const provider = record.provider ? String(record.provider) : undefined;
	const nodeCount = normalizeInteger(record.nodeCount);
	const readyNodeCount = normalizeInteger(record.readyNodeCount);
	const monthlyCost = normalizeInteger(
		record.estimatedMonthlyCostCents ?? record.monthlyNodeCostCents ?? 0,
	);
	const instanceTypes: Record<string, number> = {};
	if (record.instanceTypes && typeof record.instanceTypes === "object") {
		for (const [key, value] of Object.entries(
			record.instanceTypes as Record<string, unknown>,
		)) {
			instanceTypes[key] = normalizeInteger(value ?? 0);
		}
	}
	return {
		name,
		provider,
		nodeCount,
		readyNodeCount,
		instanceTypes,
		monthlyNodeCostCents: normalizeInteger(record.monthlyNodeCostCents),
		estimatedMonthlyCostCents: monthlyCost,
	};
}
