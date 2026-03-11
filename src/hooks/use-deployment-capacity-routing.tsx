import type { VrfSummaryRow } from "@/components/capacity/deployment-capacity-types";
import { useMemo } from "react";

import type { DeploymentCapacityDerivedInput } from "@/hooks/use-deployment-capacity-shared";

export function useDeploymentCapacityRouting(
	input: Pick<
		DeploymentCapacityDerivedInput,
		| "inventory"
		| "rollups"
		| "windowLabel"
		| "routingDeviceFilter"
		| "routingVrfFilter"
	>,
) {
	const {
		inventory,
		rollups,
		windowLabel,
		routingDeviceFilter,
		routingVrfFilter,
	} = input;

	const routingOptions = useMemo(() => {
		const devices = new Set<string>();
		const vrfs = new Set<string>();
		for (const row of inventory.data?.routeScale ?? []) {
			const device = String(row.deviceName ?? "").trim();
			const vrf = String(row.vrf ?? "").trim();
			if (device) devices.add(device);
			if (vrf) vrfs.add(vrf);
		}
		for (const row of inventory.data?.bgpNeighbors ?? []) {
			const device = String(row.deviceName ?? "").trim();
			const vrf = String(row.vrf ?? "").trim();
			if (device) devices.add(device);
			if (vrf) vrfs.add(vrf);
		}
		return {
			devices: Array.from(devices).sort(),
			vrfs: Array.from(vrfs).sort(),
		};
	}, [inventory.data?.routeScale, inventory.data?.bgpNeighbors]);

	const filteredRouteScale = useMemo(() => {
		const rows = (inventory.data?.routeScale ?? []) as any[];
		return rows.filter((row: any) => {
			if (
				routingDeviceFilter !== "all" &&
				row.deviceName !== routingDeviceFilter
			) {
				return false;
			}
			if (routingVrfFilter !== "all" && row.vrf !== routingVrfFilter) {
				return false;
			}
			return true;
		});
	}, [inventory.data?.routeScale, routingDeviceFilter, routingVrfFilter]);

	const filteredBgpNeighbors = useMemo(() => {
		const rows = (inventory.data?.bgpNeighbors ?? []) as any[];
		return rows.filter((row: any) => {
			if (
				routingDeviceFilter !== "all" &&
				row.deviceName !== routingDeviceFilter
			) {
				return false;
			}
			if (routingVrfFilter !== "all" && row.vrf !== routingVrfFilter) {
				return false;
			}
			return true;
		});
	}, [inventory.data?.bgpNeighbors, routingDeviceFilter, routingVrfFilter]);

	const filteredHardwareTcam = useMemo(() => {
		const rows = (inventory.data?.hardwareTcam ?? []) as any[];
		return rows.filter((row: any) => {
			if (
				routingDeviceFilter !== "all" &&
				row.deviceName !== routingDeviceFilter
			) {
				return false;
			}
			return true;
		});
	}, [inventory.data?.hardwareTcam, routingDeviceFilter]);

	const vrfSummaryRows: VrfSummaryRow[] = useMemo(() => {
		const summaryByVrf = new Map<string, VrfSummaryRow>();
		const keyOf = (device: string, vrf: string) => `${device}||${vrf}`;

		for (const row of inventory.data?.routeScale ?? []) {
			const device = String(row.deviceName ?? "").trim();
			const vrf = String(row.vrf ?? "").trim();
			if (!device || !vrf) continue;
			const key = keyOf(device, vrf);
			const current =
				summaryByVrf.get(key) ??
				({
					id: key,
					deviceName: device,
					vrf,
					ipv4Routes: 0,
					ipv6Routes: 0,
					bgpNeighbors: 0,
					bgpEstablished: 0,
				} satisfies VrfSummaryRow);
			current.ipv4Routes = Number(row.ipv4Routes ?? 0);
			current.ipv6Routes = Number(row.ipv6Routes ?? 0);
			summaryByVrf.set(key, current);
		}

		for (const neighbor of inventory.data?.bgpNeighbors ?? []) {
			const device = String(neighbor.deviceName ?? "").trim();
			const vrf = String(neighbor.vrf ?? "").trim();
			if (!device || !vrf) continue;
			const key = keyOf(device, vrf);
			const current =
				summaryByVrf.get(key) ??
				({
					id: key,
					deviceName: device,
					vrf,
					ipv4Routes: 0,
					ipv6Routes: 0,
					bgpNeighbors: 0,
					bgpEstablished: 0,
				} satisfies VrfSummaryRow);
			current.bgpNeighbors += 1;
			const state = String(neighbor.sessionState ?? "").toUpperCase();
			if (state.includes("ESTABLISHED")) current.bgpEstablished += 1;
			summaryByVrf.set(key, current);
		}

		for (const rollup of rollups) {
			if (
				rollup.objectType !== "interface" ||
				rollup.window !== windowLabel ||
				!rollup.metric.startsWith("util_")
			) {
				continue;
			}
			const details = rollup.details ?? {};
			const device = String(details["deviceName"] ?? "").trim();
			const vrf = String(details["vrf"] ?? "").trim();
			if (!device || !vrf) continue;
			const key = keyOf(device, vrf);
			const current =
				summaryByVrf.get(key) ??
				({
					id: key,
					deviceName: device,
					vrf,
					ipv4Routes: 0,
					ipv6Routes: 0,
					bgpNeighbors: 0,
					bgpEstablished: 0,
				} satisfies VrfSummaryRow);
			current.maxIfaceMax = Math.max(current.maxIfaceMax ?? 0, rollup.max ?? 0);
			if (rollup.p95 !== undefined && rollup.p95 !== null) {
				current.maxIfaceP95 = Math.max(
					current.maxIfaceP95 ?? 0,
					rollup.p95 ?? 0,
				);
			}
			const forecast = rollup.forecastCrossingTs ?? "";
			if (forecast) {
				if (!current.soonestForecast) current.soonestForecast = forecast;
				else if (Date.parse(forecast) < Date.parse(current.soonestForecast)) {
					current.soonestForecast = forecast;
				}
			}
			summaryByVrf.set(key, current);
		}

		const output = Array.from(summaryByVrf.values());
		output.sort(
			(left, right) => (right.maxIfaceMax ?? 0) - (left.maxIfaceMax ?? 0),
		);
		return output;
	}, [
		inventory.data?.routeScale,
		inventory.data?.bgpNeighbors,
		rollups,
		windowLabel,
	]);

	return {
		routingOptions,
		filteredRouteScale,
		filteredBgpNeighbors,
		filteredHardwareTcam,
		vrfSummaryRows,
	};
}
