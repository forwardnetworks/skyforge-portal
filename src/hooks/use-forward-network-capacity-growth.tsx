import type {
	DeviceGrowthRow,
	InterfaceGrowthRow,
} from "@/components/capacity/forward-network-capacity-types";
import type { ForwardNetworkCapacityDerivedArgs } from "@/hooks/forward-network-capacity-derived-types";
import { getForwardNetworkCapacityGrowth } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useForwardNetworkCapacityGrowth(
	args: ForwardNetworkCapacityDerivedArgs,
) {
	const {
		ownerUserId,
		networkRefId,
		forwardNetworkId,
		windowLabel,
		growthIfaceMetric,
		growthDeviceMetric,
		compareHours,
		locationFilter,
		tagFilter,
		groupFilter,
	} = args;

	const ifaceGrowth = useQuery({
		queryKey: queryKeys.forwardNetworkCapacityGrowth(
			ownerUserId,
			networkRefId,
			windowLabel,
			growthIfaceMetric,
			compareHours,
			"interface",
		),
		queryFn: () =>
			getForwardNetworkCapacityGrowth(ownerUserId, networkRefId, {
				metric: growthIfaceMetric,
				window: windowLabel,
				objectType: "interface",
				compareHours,
				limit: 50,
			}),
		enabled: Boolean(ownerUserId && networkRefId && forwardNetworkId),
		retry: false,
		staleTime: 30_000,
	});

	const deviceGrowth = useQuery({
		queryKey: queryKeys.forwardNetworkCapacityGrowth(
			ownerUserId,
			networkRefId,
			windowLabel,
			growthDeviceMetric,
			compareHours,
			"device",
		),
		queryFn: () =>
			getForwardNetworkCapacityGrowth(ownerUserId, networkRefId, {
				metric: growthDeviceMetric,
				window: windowLabel,
				objectType: "device",
				compareHours,
				limit: 50,
			}),
		enabled: Boolean(ownerUserId && networkRefId && forwardNetworkId),
		retry: false,
		staleTime: 30_000,
	});

	const ifaceGrowthRows: InterfaceGrowthRow[] = useMemo(() => {
		const rows = ifaceGrowth.data?.rows ?? [];
		const mapped = rows.map((r: any) => {
			const d = (r?.now?.details ?? {}) as any;
			const device = String(d["deviceName"] ?? r.objectId ?? "").trim();
			const iface = String(d["interfaceName"] ?? "").trim();
			const dir = String(d["direction"] ?? "").trim();
			const locationName = String(d["locationName"] ?? "").trim() || undefined;
			const tagNames = Array.isArray(d["tagNames"])
				? (d["tagNames"] as unknown[])
						.map((x) => String(x ?? "").trim())
						.filter(Boolean)
				: undefined;
			const groupNames = Array.isArray(d["groupNames"])
				? (d["groupNames"] as unknown[])
						.map((x) => String(x ?? "").trim())
						.filter(Boolean)
				: undefined;
			return {
				id: String(r?.objectId ?? `${device}:${iface}:${dir}`),
				device,
				iface,
				dir,
				locationName,
				tagNames,
				groupNames,
				speedMbps: (d["speedMbps"] as number | undefined) ?? null,
				nowP95: r?.now?.p95,
				prevP95: r?.prev?.p95 ?? null,
				deltaP95: r?.deltaP95 ?? null,
				deltaP95Gbps: r?.deltaP95Gbps ?? null,
				nowMax: r?.now?.max,
				prevMax: r?.prev?.max ?? null,
				deltaMax: r?.deltaMax ?? null,
				nowForecast: r?.now?.forecastCrossingTs ?? undefined,
				raw: r,
			} satisfies InterfaceGrowthRow;
		});
		return mapped.filter(
			(r) =>
				(locationFilter === "all" ||
					(r.locationName ?? "") === locationFilter) &&
				(tagFilter === "all" || (r.tagNames ?? []).includes(tagFilter)) &&
				(groupFilter === "all" || (r.groupNames ?? []).includes(groupFilter)),
		);
	}, [ifaceGrowth.data?.rows, locationFilter, tagFilter, groupFilter]);

	const deviceGrowthRows: DeviceGrowthRow[] = useMemo(() => {
		const rows = deviceGrowth.data?.rows ?? [];
		const mapped = rows.map((r: any) => {
			const d = (r?.now?.details ?? {}) as any;
			const device = String(d["deviceName"] ?? r.objectId ?? "").trim();
			const locationName = String(d["locationName"] ?? "").trim() || undefined;
			const tagNames = Array.isArray(d["tagNames"])
				? (d["tagNames"] as unknown[])
						.map((x) => String(x ?? "").trim())
						.filter(Boolean)
				: undefined;
			const groupNames = Array.isArray(d["groupNames"])
				? (d["groupNames"] as unknown[])
						.map((x) => String(x ?? "").trim())
						.filter(Boolean)
				: undefined;
			return {
				id: String(r?.objectId ?? device),
				device,
				locationName,
				tagNames,
				groupNames,
				vendor: String(d["vendor"] ?? "").trim() || undefined,
				os: String(d["os"] ?? "").trim() || undefined,
				model: String(d["model"] ?? "").trim() || undefined,
				nowP95: r?.now?.p95,
				prevP95: r?.prev?.p95 ?? null,
				deltaP95: r?.deltaP95 ?? null,
				nowMax: r?.now?.max,
				prevMax: r?.prev?.max ?? null,
				deltaMax: r?.deltaMax ?? null,
				nowForecast: r?.now?.forecastCrossingTs ?? undefined,
				raw: r,
			} satisfies DeviceGrowthRow;
		});
		return mapped.filter(
			(r) =>
				(locationFilter === "all" ||
					(r.locationName ?? "") === locationFilter) &&
				(tagFilter === "all" || (r.tagNames ?? []).includes(tagFilter)) &&
				(groupFilter === "all" || (r.groupNames ?? []).includes(groupFilter)),
		);
	}, [deviceGrowth.data?.rows, locationFilter, tagFilter, groupFilter]);

	return {
		ifaceGrowth,
		deviceGrowth,
		ifaceGrowthRows,
		deviceGrowthRows,
	};
}
