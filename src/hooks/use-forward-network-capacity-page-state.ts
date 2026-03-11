import type {
	DeviceRow,
	InterfaceRow,
} from "@/components/capacity/forward-network-capacity-types";
import { useState } from "react";

export function useForwardNetworkCapacityPageState() {
	const [windowLabel, setWindowLabel] = useState<"24h" | "7d" | "30d">("24h");
	const [ifaceMetric, setIfaceMetric] = useState<
		| "util_ingress"
		| "util_egress"
		| "if_error_ingress"
		| "if_error_egress"
		| "if_packet_loss_ingress"
		| "if_packet_loss_egress"
	>("util_ingress");
	const [deviceMetric, setDeviceMetric] = useState<
		"device_cpu" | "device_memory"
	>("device_cpu");
	const [ifaceFilter, setIfaceFilter] = useState("");
	const [deviceFilter, setDeviceFilter] = useState("");
	const [tagFilter, setTagFilter] = useState("all");
	const [groupFilter, setGroupFilter] = useState("all");
	const [locationFilter, setLocationFilter] = useState("all");
	const [vrfFilter, setVrfFilter] = useState("all");
	const [groupBy, setGroupBy] = useState<
		"none" | "location" | "tag" | "group" | "vrf"
	>("none");
	const [compareHours, setCompareHours] = useState<number>(24 * 7);
	const [growthIfaceMetric, setGrowthIfaceMetric] = useState<
		"util_ingress" | "util_egress"
	>("util_ingress");
	const [growthDeviceMetric, setGrowthDeviceMetric] = useState<
		"device_cpu" | "device_memory"
	>("device_cpu");
	const [selectedIface, setSelectedIface] = useState<InterfaceRow | null>(null);
	const [selectedDevice, setSelectedDevice] = useState<DeviceRow | null>(null);
	const [unhealthyDevices, setUnhealthyDevices] = useState<unknown>(null);
	const [pickIfaceOpen, setPickIfaceOpen] = useState(false);
	const [pickIfaceQuery, setPickIfaceQuery] = useState("");
	const [pickDeviceOpen, setPickDeviceOpen] = useState(false);
	const [pickDeviceQuery, setPickDeviceQuery] = useState("");
	const [routingDeviceFilter, setRoutingDeviceFilter] = useState("all");
	const [routingVrfFilter, setRoutingVrfFilter] = useState("all");
	const [tcamDialogOpen, setTcamDialogOpen] = useState(false);
	const [tcamDialogText, setTcamDialogText] = useState("");
	const [planFilter, setPlanFilter] = useState("");

	return {
		windowLabel,
		setWindowLabel,
		ifaceMetric,
		setIfaceMetric,
		deviceMetric,
		setDeviceMetric,
		ifaceFilter,
		setIfaceFilter,
		deviceFilter,
		setDeviceFilter,
		tagFilter,
		setTagFilter,
		groupFilter,
		setGroupFilter,
		locationFilter,
		setLocationFilter,
		vrfFilter,
		setVrfFilter,
		groupBy,
		setGroupBy,
		compareHours,
		setCompareHours,
		growthIfaceMetric,
		setGrowthIfaceMetric,
		growthDeviceMetric,
		setGrowthDeviceMetric,
		selectedIface,
		setSelectedIface,
		selectedDevice,
		setSelectedDevice,
		unhealthyDevices,
		setUnhealthyDevices,
		pickIfaceOpen,
		setPickIfaceOpen,
		pickIfaceQuery,
		setPickIfaceQuery,
		pickDeviceOpen,
		setPickDeviceOpen,
		pickDeviceQuery,
		setPickDeviceQuery,
		routingDeviceFilter,
		setRoutingDeviceFilter,
		routingVrfFilter,
		setRoutingVrfFilter,
		tcamDialogOpen,
		setTcamDialogOpen,
		tcamDialogText,
		setTcamDialogText,
		planFilter,
		setPlanFilter,
	};
}
