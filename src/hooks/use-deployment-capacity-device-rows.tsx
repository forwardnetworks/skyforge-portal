import type { DeviceRow } from "@/components/capacity/deployment-capacity-types";
import { useMemo } from "react";
import {
	type DeploymentCapacityRollupArgs,
	matchesInventoryFilters,
} from "./use-deployment-capacity-rollup-shared";

export function useDeploymentCapacityDeviceRows(
	args: DeploymentCapacityRollupArgs,
) {
	const {
		rollups,
		windowLabel,
		deviceMetric,
		deviceFilter,
		locationFilter,
		tagFilter,
		groupFilter,
	} = args;

	return useMemo(() => {
		const query = deviceFilter.trim().toLowerCase();
		const rows = rollups
			.filter(
				(row) =>
					row.objectType === "device" &&
					row.window === windowLabel &&
					row.metric === deviceMetric,
			)
			.map((row) => {
				const details = row.details ?? {};
				return {
					id: `${String(details.deviceName ?? "").trim()}:${row.metric}:${row.window}`,
					device: String(details.deviceName ?? "").trim(),
					metric: row.metric,
					locationName: String(details.locationName ?? "").trim() || undefined,
					tagNames: Array.isArray(details.tagNames)
						? details.tagNames
								.map((value) => String(value ?? "").trim())
								.filter(Boolean)
						: undefined,
					groupNames: Array.isArray(details.groupNames)
						? details.groupNames
								.map((value) => String(value ?? "").trim())
								.filter(Boolean)
						: undefined,
					vendor: String(details.vendor ?? "").trim() || undefined,
					os: String(details.os ?? "").trim() || undefined,
					model: String(details.model ?? "").trim() || undefined,
					p95: row.p95,
					p99: row.p99,
					max: row.max,
					slopePerDay: row.slopePerDay,
					forecastCrossingTs: row.forecastCrossingTs,
					threshold: row.threshold,
					samples: row.samples,
					raw: row,
				} satisfies DeviceRow;
			});
		const filteredByText = query
			? rows.filter(
					(row) =>
						row.device.toLowerCase().includes(query) ||
						(row.vendor || "").toLowerCase().includes(query) ||
						(row.os || "").toLowerCase().includes(query) ||
						(row.model || "").toLowerCase().includes(query),
				)
			: rows;
		const filtered = filteredByText.filter((row) =>
			matchesInventoryFilters({
				row,
				locationFilter,
				tagFilter,
				groupFilter,
			}),
		);
		filtered.sort((a, b) => (b.max ?? 0) - (a.max ?? 0));
		return filtered;
	}, [
		rollups,
		windowLabel,
		deviceMetric,
		deviceFilter,
		locationFilter,
		tagFilter,
		groupFilter,
	]);
}
