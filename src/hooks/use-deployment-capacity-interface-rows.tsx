import type { InterfaceRow } from "@/components/capacity/deployment-capacity-types";
import { useMemo } from "react";
import {
	type DeploymentCapacityRollupArgs,
	matchesInventoryFilters,
} from "./use-deployment-capacity-rollup-shared";

export function useDeploymentCapacityInterfaceRows(
	args: DeploymentCapacityRollupArgs,
) {
	const {
		rollups,
		windowLabel,
		ifaceMetric,
		ifaceFilter,
		locationFilter,
		vrfFilter,
		tagFilter,
		groupFilter,
	} = args;

	return useMemo(() => {
		const query = ifaceFilter.trim().toLowerCase();
		const rows = rollups
			.filter(
				(row) =>
					row.objectType === "interface" &&
					row.window === windowLabel &&
					row.metric === ifaceMetric,
			)
			.map((row) => {
				const details = row.details ?? {};
				const device = String(details.deviceName ?? "").trim();
				const iface = String(details.interfaceName ?? "").trim();
				const dir = String(details.direction ?? "").trim();
				const vrf = String(details.vrf ?? "").trim() || undefined;
				const vrfNames = Array.isArray(details.vrfNames)
					? details.vrfNames
							.map((value) => String(value ?? "").trim())
							.filter(Boolean)
					: undefined;
				const locationName =
					String(details.locationName ?? "").trim() || undefined;
				const tagNames = Array.isArray(details.tagNames)
					? details.tagNames
							.map((value) => String(value ?? "").trim())
							.filter(Boolean)
					: undefined;
				const groupNames = Array.isArray(details.groupNames)
					? details.groupNames
							.map((value) => String(value ?? "").trim())
							.filter(Boolean)
					: undefined;
				return {
					id: `${device}:${iface}:${dir}:${row.metric}:${row.window}`,
					device,
					iface,
					dir,
					vrf,
					vrfNames,
					locationName,
					tagNames,
					groupNames,
					speedMbps: (details.speedMbps as number | undefined) ?? null,
					admin: String(details.adminStatus ?? "").trim() || undefined,
					oper: String(details.operStatus ?? "").trim() || undefined,
					p95: row.p95,
					p99: row.p99,
					max: row.max,
					slopePerDay: row.slopePerDay,
					forecastCrossingTs: row.forecastCrossingTs,
					threshold: row.threshold,
					samples: row.samples,
					raw: row,
				} satisfies InterfaceRow;
			});
		const filteredByText = query
			? rows.filter(
					(row) =>
						row.device.toLowerCase().includes(query) ||
						row.iface.toLowerCase().includes(query) ||
						(row.dir || "").toLowerCase().includes(query),
				)
			: rows;
		const filtered = filteredByText.filter((row) =>
			matchesInventoryFilters({
				row,
				locationFilter,
				vrfFilter,
				tagFilter,
				groupFilter,
			}),
		);
		filtered.sort((a, b) => (b.max ?? 0) - (a.max ?? 0));
		return filtered;
	}, [
		rollups,
		windowLabel,
		ifaceMetric,
		ifaceFilter,
		locationFilter,
		vrfFilter,
		tagFilter,
		groupFilter,
	]);
}
