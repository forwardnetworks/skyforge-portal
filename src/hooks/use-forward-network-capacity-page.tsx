import { useForwardNetworkCapacityDerived } from "@/hooks/use-forward-network-capacity-derived";
import { useForwardNetworkCapacityPageData } from "@/hooks/use-forward-network-capacity-page-data";
import { useForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page-state";

export function useForwardNetworkCapacityPage(
	networkRef?: string,
	userId?: string,
) {
	const ownerUserId = String(userId ?? "").trim();
	const networkRefId = String(networkRef ?? "").trim();
	const state = useForwardNetworkCapacityPageState();
	const data = useForwardNetworkCapacityPageData({
		ownerUserId,
		networkRefId,
		windowLabel: state.windowLabel,
		setUnhealthyDevices: state.setUnhealthyDevices,
	});

	const derived = useForwardNetworkCapacityDerived({
		ownerUserId,
		networkRefId,
		forwardNetworkId: data.forwardNetworkId,
		windowLabel: state.windowLabel,
		windowDays: data.windowDays,
		ifaceMetric: state.ifaceMetric,
		deviceMetric: state.deviceMetric,
		growthIfaceMetric: state.growthIfaceMetric,
		growthDeviceMetric: state.growthDeviceMetric,
		compareHours: state.compareHours,
		ifaceFilter: state.ifaceFilter,
		deviceFilter: state.deviceFilter,
		tagFilter: state.tagFilter,
		groupFilter: state.groupFilter,
		locationFilter: state.locationFilter,
		vrfFilter: state.vrfFilter,
		groupBy: state.groupBy,
		routingDeviceFilter: state.routingDeviceFilter,
		routingVrfFilter: state.routingVrfFilter,
		selectedIface: state.selectedIface,
		selectedDevice: state.selectedDevice,
		rollups: data.rollups,
		inventoryData: data.inventory.data,
		ifaceInvIndex: data.ifaceInvIndex,
	});

	return {
		ownerUserId,
		networkRefId,
		...state,
		...data,
		...derived,
	};
}

export type ForwardNetworkCapacityPageState = ReturnType<
	typeof useForwardNetworkCapacityPage
>;
