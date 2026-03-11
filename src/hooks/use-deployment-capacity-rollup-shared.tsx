import type {
	DeviceRow,
	InterfaceRow,
} from "@/components/capacity/deployment-capacity-types";
import type {
	CapacityRollupRow,
	DeploymentCapacityInventoryResponse,
} from "@/lib/api-client";

export type DeploymentCapacityRollupArgs = {
	inventoryData?: DeploymentCapacityInventoryResponse;
	rollups: CapacityRollupRow[];
	windowLabel: "24h" | "7d" | "30d";
	ifaceMetric:
		| "util_ingress"
		| "util_egress"
		| "if_error_ingress"
		| "if_error_egress"
		| "if_packet_loss_ingress"
		| "if_packet_loss_egress";
	deviceMetric: "device_cpu" | "device_memory";
	ifaceFilter: string;
	deviceFilter: string;
	tagFilter: string;
	groupFilter: string;
	locationFilter: string;
	vrfFilter: string;
	groupBy: "none" | "location" | "tag" | "group" | "vrf";
};

export function matchesInventoryFilters(args: {
	row:
		| Pick<
				InterfaceRow,
				"locationName" | "tagNames" | "groupNames" | "vrf" | "vrfNames"
		  >
		| Pick<DeviceRow, "locationName" | "tagNames" | "groupNames">;
	locationFilter: string;
	vrfFilter?: string;
	tagFilter: string;
	groupFilter: string;
}) {
	const {
		row,
		locationFilter,
		vrfFilter = "all",
		tagFilter,
		groupFilter,
	} = args;
	if (locationFilter !== "all" && (row.locationName ?? "") !== locationFilter) {
		return false;
	}
	if ("vrf" in row && vrfFilter !== "all") {
		if (row.vrf === vrfFilter || (row.vrfNames ?? []).includes(vrfFilter)) {
			// allowed
		} else {
			return false;
		}
	}
	if (tagFilter !== "all" && !(row.tagNames ?? []).includes(tagFilter)) {
		return false;
	}
	if (groupFilter !== "all" && !(row.groupNames ?? []).includes(groupFilter)) {
		return false;
	}
	return true;
}
