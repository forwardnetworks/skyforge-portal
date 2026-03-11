import type {
	DeviceGrowthRow,
	InterfaceGrowthRow,
} from "@/components/capacity/deployment-capacity-types";
import { getDeploymentCapacityGrowth } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { DeploymentCapacityDerivedInput } from "@/hooks/use-deployment-capacity-shared";

export function useDeploymentCapacityGrowth(
	input: Pick<
		DeploymentCapacityDerivedInput,
		| "userId"
		| "deploymentId"
		| "windowLabel"
		| "growthIfaceMetric"
		| "growthDeviceMetric"
		| "compareHours"
		| "forwardEnabled"
		| "forwardNetworkId"
		| "locationFilter"
		| "tagFilter"
		| "groupFilter"
	>,
) {
	const {
		userId,
		deploymentId,
		windowLabel,
		growthIfaceMetric,
		growthDeviceMetric,
		compareHours,
		forwardEnabled,
		forwardNetworkId,
		locationFilter,
		tagFilter,
		groupFilter,
	} = input;

	const ifaceGrowth = useQuery({
		queryKey: queryKeys.deploymentCapacityGrowth(
			userId,
			deploymentId,
			windowLabel,
			growthIfaceMetric,
			compareHours,
			"interface",
		),
		queryFn: () =>
			getDeploymentCapacityGrowth(userId, deploymentId, {
				metric: growthIfaceMetric,
				window: windowLabel,
				objectType: "interface",
				compareHours,
				limit: 50,
			}),
		enabled: Boolean(
			userId && deploymentId && forwardEnabled && forwardNetworkId,
		),
		retry: false,
		staleTime: 30_000,
	});

	const deviceGrowth = useQuery({
		queryKey: queryKeys.deploymentCapacityGrowth(
			userId,
			deploymentId,
			windowLabel,
			growthDeviceMetric,
			compareHours,
			"device",
		),
		queryFn: () =>
			getDeploymentCapacityGrowth(userId, deploymentId, {
				metric: growthDeviceMetric,
				window: windowLabel,
				objectType: "device",
				compareHours,
				limit: 50,
			}),
		enabled: Boolean(
			userId && deploymentId && forwardEnabled && forwardNetworkId,
		),
		retry: false,
		staleTime: 30_000,
	});

	const ifaceGrowthRows: InterfaceGrowthRow[] = useMemo(() => {
		const rows = ifaceGrowth.data?.rows ?? [];
		const mapped = rows.map((row: any) => {
			const details = (row?.now?.details ?? {}) as any;
			const device = String(details["deviceName"] ?? row.objectId ?? "").trim();
			const iface = String(details["interfaceName"] ?? "").trim();
			const dir = String(details["direction"] ?? "").trim();
			const locationName =
				String(details["locationName"] ?? "").trim() || undefined;
			const tagNames = Array.isArray(details["tagNames"])
				? (details["tagNames"] as unknown[])
						.map((value) => String(value ?? "").trim())
						.filter(Boolean)
				: undefined;
			const groupNames = Array.isArray(details["groupNames"])
				? (details["groupNames"] as unknown[])
						.map((value) => String(value ?? "").trim())
						.filter(Boolean)
				: undefined;
			const id = String(row?.objectId ?? `${device}:${iface}:${dir}`);
			return {
				id,
				device,
				iface,
				dir,
				locationName,
				tagNames,
				groupNames,
				speedMbps: (details["speedMbps"] as number | undefined) ?? null,
				nowP95: row?.now?.p95,
				prevP95: row?.prev?.p95 ?? null,
				deltaP95: row?.deltaP95 ?? null,
				deltaP95Gbps: row?.deltaP95Gbps ?? null,
				nowMax: row?.now?.max,
				prevMax: row?.prev?.max ?? null,
				deltaMax: row?.deltaMax ?? null,
				nowForecast: row?.now?.forecastCrossingTs ?? undefined,
				raw: row,
			} satisfies InterfaceGrowthRow;
		});
		return mapped.filter((row) => {
			if (
				locationFilter !== "all" &&
				(row.locationName ?? "") !== locationFilter
			)
				return false;
			if (tagFilter !== "all" && !(row.tagNames ?? []).includes(tagFilter))
				return false;
			if (
				groupFilter !== "all" &&
				!(row.groupNames ?? []).includes(groupFilter)
			)
				return false;
			return true;
		});
	}, [ifaceGrowth.data?.rows, locationFilter, tagFilter, groupFilter]);

	const deviceGrowthRows: DeviceGrowthRow[] = useMemo(() => {
		const rows = deviceGrowth.data?.rows ?? [];
		const mapped = rows.map((row: any) => {
			const details = (row?.now?.details ?? {}) as any;
			const device = String(details["deviceName"] ?? row.objectId ?? "").trim();
			const locationName =
				String(details["locationName"] ?? "").trim() || undefined;
			const tagNames = Array.isArray(details["tagNames"])
				? (details["tagNames"] as unknown[])
						.map((value) => String(value ?? "").trim())
						.filter(Boolean)
				: undefined;
			const groupNames = Array.isArray(details["groupNames"])
				? (details["groupNames"] as unknown[])
						.map((value) => String(value ?? "").trim())
						.filter(Boolean)
				: undefined;
			const id = String(row?.objectId ?? device);
			return {
				id,
				device,
				locationName,
				tagNames,
				groupNames,
				vendor: String(details["vendor"] ?? "").trim() || undefined,
				os: String(details["os"] ?? "").trim() || undefined,
				model: String(details["model"] ?? "").trim() || undefined,
				nowP95: row?.now?.p95,
				prevP95: row?.prev?.p95 ?? null,
				deltaP95: row?.deltaP95 ?? null,
				nowMax: row?.now?.max,
				prevMax: row?.prev?.max ?? null,
				deltaMax: row?.deltaMax ?? null,
				nowForecast: row?.now?.forecastCrossingTs ?? undefined,
				raw: row,
			} satisfies DeviceGrowthRow;
		});
		return mapped.filter((row) => {
			if (
				locationFilter !== "all" &&
				(row.locationName ?? "") !== locationFilter
			)
				return false;
			if (tagFilter !== "all" && !(row.tagNames ?? []).includes(tagFilter))
				return false;
			if (
				groupFilter !== "all" &&
				!(row.groupNames ?? []).includes(groupFilter)
			)
				return false;
			return true;
		});
	}, [deviceGrowth.data?.rows, locationFilter, tagFilter, groupFilter]);

	return { ifaceGrowth, deviceGrowth, ifaceGrowthRows, deviceGrowthRows };
}
