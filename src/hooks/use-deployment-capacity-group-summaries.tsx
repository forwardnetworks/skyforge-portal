import type {
	DeviceRow,
	GroupSummaryRow,
	InterfaceRow,
} from "@/components/capacity/deployment-capacity-types";
import type { DeploymentCapacityInventoryResponse } from "@/lib/api-client";
import { useMemo } from "react";

export function useDeploymentCapacityInterfaceGroupSummary(args: {
	ifaceRows: InterfaceRow[];
	groupBy: "none" | "location" | "tag" | "group" | "vrf";
	ifaceMetric:
		| "util_ingress"
		| "util_egress"
		| "if_error_ingress"
		| "if_error_egress"
		| "if_packet_loss_ingress"
		| "if_packet_loss_egress";
	inventoryData?: DeploymentCapacityInventoryResponse;
}) {
	const { ifaceRows, groupBy, ifaceMetric, inventoryData } = args;

	return useMemo(() => {
		if (groupBy === "none") return [];
		const threshold = 0.85;
		const summaries = new Map<string, GroupSummaryRow>();
		const devicesByGroup = new Map<string, Set<string>>();
		const add = (key: string, row: InterfaceRow) => {
			const current =
				summaries.get(key) ??
				({
					group: key,
					count: 0,
					hotCount: 0,
					sumSpeedGbps: 0,
					sumP95Gbps: 0,
					sumMaxGbps: 0,
					p95Count: 0,
				} satisfies GroupSummaryRow);
			current.count += 1;
			if (!devicesByGroup.has(key)) devicesByGroup.set(key, new Set<string>());
			devicesByGroup.get(key)?.add(row.device);
			const maxValue = row.max ?? 0;
			const p95 = row.p95 ?? undefined;
			current.maxMax = Math.max(current.maxMax ?? 0, maxValue);
			if (p95 !== undefined) {
				current.maxP95 = Math.max(current.maxP95 ?? 0, p95);
				if (ifaceMetric.startsWith("util_")) {
					const speed = Number(row.speedMbps ?? 0);
					if (speed > 0) {
						current.maxP95Gbps = Math.max(
							current.maxP95Gbps ?? 0,
							(p95 * speed) / 1000,
						);
					}
				}
			}
			if (ifaceMetric.startsWith("util_")) {
				const speed = Number(row.speedMbps ?? 0);
				if (speed > 0) {
					current.sumSpeedGbps = (current.sumSpeedGbps ?? 0) + speed / 1000;
					if (p95 !== undefined && Number.isFinite(p95)) {
						current.sumP95Gbps =
							(current.sumP95Gbps ?? 0) + (p95 * speed) / 1000;
						current.p95Count = (current.p95Count ?? 0) + 1;
					}
					if (
						row.max !== undefined &&
						row.max !== null &&
						Number.isFinite(row.max)
					) {
						current.sumMaxGbps =
							(current.sumMaxGbps ?? 0) + (Number(row.max) * speed) / 1000;
					}
				}
				if (row.forecastCrossingTs) {
					if (!current.soonestForecast) {
						current.soonestForecast = row.forecastCrossingTs;
					} else if (
						Date.parse(row.forecastCrossingTs) <
						Date.parse(current.soonestForecast)
					) {
						current.soonestForecast = row.forecastCrossingTs;
					}
				}
			}
			if (
				ifaceMetric.startsWith("util_") &&
				maxValue >= (row.threshold ?? threshold)
			) {
				current.hotCount += 1;
			}
			summaries.set(key, current);
		};

		for (const row of ifaceRows) {
			if (groupBy === "location") add(row.locationName ?? "unknown", row);
			else if (groupBy === "tag") {
				for (const tag of row.tagNames?.length ? row.tagNames : ["untagged"]) {
					add(tag, row);
				}
			} else if (groupBy === "group") {
				for (const group of row.groupNames?.length
					? row.groupNames
					: ["ungrouped"]) {
					add(group, row);
				}
			} else if (groupBy === "vrf") {
				add(row.vrf ?? row.vrfNames?.[0] ?? "unknown", row);
			}
		}

		const out = Array.from(summaries.values());
		if (groupBy === "vrf") {
			const routeScale = inventoryData?.routeScale ?? [];
			const bgpNeighbors = inventoryData?.bgpNeighbors ?? [];
			for (const row of out) {
				const devices = devicesByGroup.get(row.group) ?? new Set<string>();
				let ipv4 = 0;
				let ipv6 = 0;
				let bgpCount = 0;
				let established = 0;
				for (const route of routeScale) {
					if (route.vrf !== row.group || !devices.has(route.deviceName))
						continue;
					ipv4 += Number(route.ipv4Routes ?? 0);
					ipv6 += Number(route.ipv6Routes ?? 0);
				}
				for (const neighbor of bgpNeighbors) {
					if (neighbor.vrf !== row.group || !devices.has(neighbor.deviceName)) {
						continue;
					}
					bgpCount += 1;
					if (
						String(neighbor.sessionState ?? "")
							.toUpperCase()
							.includes("ESTABLISHED")
					) {
						established += 1;
					}
				}
				row.ipv4RoutesSum = ipv4;
				row.ipv6RoutesSum = ipv6;
				row.bgpNeighbors = bgpCount;
				row.bgpEstablished = established;
			}
		}
		out.sort(
			(a, b) =>
				(b.maxP95Gbps ?? b.maxP95 ?? 0) - (a.maxP95Gbps ?? a.maxP95 ?? 0),
		);
		return out;
	}, [
		ifaceRows,
		groupBy,
		ifaceMetric,
		inventoryData?.routeScale,
		inventoryData?.bgpNeighbors,
	]);
}

export function useDeploymentCapacityDeviceGroupSummary(args: {
	deviceRows: DeviceRow[];
	groupBy: "none" | "location" | "tag" | "group" | "vrf";
}) {
	const { deviceRows, groupBy } = args;

	return useMemo(() => {
		if (groupBy === "none") return [];
		const threshold = 0.85;
		const summaries = new Map<string, GroupSummaryRow>();
		const add = (key: string, row: DeviceRow) => {
			const current = summaries.get(key) ?? {
				group: key,
				count: 0,
				hotCount: 0,
			};
			current.count += 1;
			current.maxMax = Math.max(current.maxMax ?? 0, row.max ?? 0);
			if (row.p95 !== undefined) {
				current.maxP95 = Math.max(current.maxP95 ?? 0, row.p95);
			}
			if ((row.max ?? 0) >= (row.threshold ?? threshold)) current.hotCount += 1;
			summaries.set(key, current);
		};
		for (const row of deviceRows) {
			if (groupBy === "location") add(row.locationName ?? "unknown", row);
			else if (groupBy === "tag") {
				for (const tag of row.tagNames?.length ? row.tagNames : ["untagged"]) {
					add(tag, row);
				}
			} else if (groupBy === "group") {
				for (const group of row.groupNames?.length
					? row.groupNames
					: ["ungrouped"]) {
					add(group, row);
				}
			}
		}
		const out = Array.from(summaries.values());
		out.sort((a, b) => (b.maxP95 ?? 0) - (a.maxP95 ?? 0));
		return out;
	}, [deviceRows, groupBy]);
}
