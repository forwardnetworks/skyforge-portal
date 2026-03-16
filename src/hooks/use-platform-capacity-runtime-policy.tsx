import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	getAdminPlatformRuntimePolicy,
	putAdminPlatformRuntimePolicy,
	type PutAdminPlatformRuntimePolicyRequest,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

const RESERVE_MIN = 0;
const RESERVE_MAX = 50;

function clampReserve(value: number): number {
	if (!Number.isFinite(value)) {
		return RESERVE_MIN;
	}
	return Math.max(RESERVE_MIN, Math.min(RESERVE_MAX, Math.floor(value)));
}

export function usePlatformCapacityRuntimePolicy() {
	const queryClient = useQueryClient();
	const runtimePolicyQ = useQuery({
		queryKey: queryKeys.adminPlatformRuntimePolicy(),
		queryFn: getAdminPlatformRuntimePolicy,
		staleTime: 15_000,
		retry: false,
	});

	const [failOnInsufficientResources, setFailOnInsufficientResources] =
		useState(true);
	const [compatibilityPreflight, setCompatibilityPreflight] = useState(true);
	const [capacityReserveCpuPercent, setCapacityReserveCpuPercent] = useState(10);
	const [capacityReserveMemoryPercent, setCapacityReserveMemoryPercent] =
		useState(10);

	useEffect(() => {
		const policy = runtimePolicyQ.data;
		if (!policy) {
			return;
		}
		setFailOnInsufficientResources(!!policy.failOnInsufficientResources);
		setCompatibilityPreflight(!!policy.compatibilityPreflight);
		setCapacityReserveCpuPercent(clampReserve(policy.capacityReserveCpuPercent));
		setCapacityReserveMemoryPercent(
			clampReserve(policy.capacityReserveMemoryPercent),
		);
	}, [runtimePolicyQ.data]);

	const saveRuntimePolicyMutation = useMutation({
		mutationFn: async () => {
			const body: PutAdminPlatformRuntimePolicyRequest = {
				failOnInsufficientResources,
				compatibilityPreflight,
				capacityReserveCpuPercent: clampReserve(capacityReserveCpuPercent),
				capacityReserveMemoryPercent: clampReserve(
					capacityReserveMemoryPercent,
				),
			};
			return putAdminPlatformRuntimePolicy(body);
		},
		onSuccess: async () => {
			toast.success("Runtime policy updated");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformRuntimePolicy(),
			});
		},
		onError: (error) => {
			toast.error("Failed to update runtime policy", {
				description: error instanceof Error ? error.message : String(error),
			});
		},
	});

	const resetRuntimePolicyFromServer = () => {
		const policy = runtimePolicyQ.data;
		if (!policy) {
			return;
		}
		setFailOnInsufficientResources(!!policy.failOnInsufficientResources);
		setCompatibilityPreflight(!!policy.compatibilityPreflight);
		setCapacityReserveCpuPercent(clampReserve(policy.capacityReserveCpuPercent));
		setCapacityReserveMemoryPercent(
			clampReserve(policy.capacityReserveMemoryPercent),
		);
	};

	return {
		runtimePolicyQ,
		failOnInsufficientResources,
		setFailOnInsufficientResources,
		compatibilityPreflight,
		setCompatibilityPreflight,
		capacityReserveCpuPercent,
		setCapacityReserveCpuPercent,
		capacityReserveMemoryPercent,
		setCapacityReserveMemoryPercent,
		saveRuntimePolicyMutation,
		resetRuntimePolicyFromServer,
		reserveMin: RESERVE_MIN,
		reserveMax: RESERVE_MAX,
	};
}
