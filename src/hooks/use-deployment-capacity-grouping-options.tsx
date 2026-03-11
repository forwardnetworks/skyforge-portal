import type { DeploymentCapacityInventoryResponse } from "@/lib/api-client";
import { useMemo } from "react";

export function useDeploymentCapacityGroupingOptions(args: {
	inventoryData?: DeploymentCapacityInventoryResponse;
}) {
	const { inventoryData } = args;

	return useMemo(() => {
		const devices = inventoryData?.devices ?? [];
		const ifaceVrfs = inventoryData?.interfaceVrfs ?? [];
		const tags = new Set<string>();
		const groups = new Set<string>();
		const locations = new Set<string>();
		const vrfs = new Set<string>();
		for (const device of devices) {
			for (const tag of device.tagNames ?? []) {
				const next = String(tag ?? "").trim();
				if (next) tags.add(next);
			}
			for (const group of device.groupNames ?? []) {
				const next = String(group ?? "").trim();
				if (next) groups.add(next);
			}
			const location = String(device.locationName ?? "").trim();
			if (location) locations.add(location);
		}
		for (const row of ifaceVrfs) {
			const vrf = String(row.vrf ?? "").trim();
			if (vrf) vrfs.add(vrf);
		}
		return {
			tags: Array.from(tags).sort(),
			groups: Array.from(groups).sort(),
			locations: Array.from(locations).sort(),
			vrfs: Array.from(vrfs).sort(),
		};
	}, [inventoryData?.devices, inventoryData?.interfaceVrfs]);
}
