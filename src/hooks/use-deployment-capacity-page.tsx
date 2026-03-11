import type {
	DeviceRow,
	GroupSummaryRow,
	InterfaceRow,
} from "@/components/capacity/deployment-capacity-types";
import { fmtPct01 } from "@/components/capacity/deployment-capacity-utils";

import { useDeploymentCapacityDerived } from "@/hooks/use-deployment-capacity-derived";
import { useDeploymentCapacityRollups } from "@/hooks/use-deployment-capacity-rollups";
import type {
	CapacityRollupRow,
	DashboardSnapshot,
	DeploymentCapacityInventoryResponse,
	UserScopeDeployment,
} from "@/lib/api-client";
import {
	getDeploymentCapacityInventory,
	getDeploymentCapacitySummary,
	getDeploymentCapacityUnhealthyDevices,
	refreshDeploymentCapacityRollups,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export function useDeploymentCapacityPage(deploymentId: string) {
	const qc = useQueryClient();
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

	const snap = useQuery<DashboardSnapshot | null>({
		queryKey: queryKeys.dashboardSnapshot(),
		queryFn: async () => null,
		initialData: null,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const deployment = useMemo(() => {
		return (snap.data?.deployments ?? []).find(
			(d: UserScopeDeployment) => d.id === deploymentId,
		);
	}, [snap.data?.deployments, deploymentId]);

	const userId = String(deployment?.userId ?? "");
	const forwardNetworkId = String(
		(deployment?.config ?? {})["forwardNetworkId"] ?? "",
	);
	const forwardEnabled = Boolean((deployment?.config ?? {})["forwardEnabled"]);

	const summary = useQuery({
		queryKey: queryKeys.deploymentCapacitySummary(userId, deploymentId),
		queryFn: () => getDeploymentCapacitySummary(userId, deploymentId),
		enabled: Boolean(
			userId && deploymentId && forwardEnabled && forwardNetworkId,
		),
		retry: false,
		staleTime: 30_000,
	});

	const inventory = useQuery<DeploymentCapacityInventoryResponse>({
		queryKey: queryKeys.deploymentCapacityInventory(userId, deploymentId),
		queryFn: () => getDeploymentCapacityInventory(userId, deploymentId),
		enabled: Boolean(
			userId && deploymentId && forwardEnabled && forwardNetworkId,
		),
		retry: false,
		staleTime: 30_000,
	});

	const refresh = useMutation({
		mutationFn: async () => {
			if (!userId) throw new Error("user scope not found");
			return refreshDeploymentCapacityRollups(userId, deploymentId);
		},
		onSuccess: async (resp) => {
			toast.success("Refresh queued", {
				description: `Run ${String(resp.run?.id ?? "")}`.trim(),
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.deploymentCapacitySummary(userId, deploymentId),
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.deploymentCapacityInventory(userId, deploymentId),
			});
			await qc.invalidateQueries({
				// Prefix match for all growth queries for this deployment.
				queryKey: ["deploymentCapacityGrowth", userId, deploymentId],
			});
		},
		onError: (e) =>
			toast.error("Failed to refresh", { description: (e as Error).message }),
	});

	const loadUnhealthyDevices = useMutation({
		mutationFn: async () => {
			return getDeploymentCapacityUnhealthyDevices(userId, deploymentId, {});
		},
		onSuccess: (resp) => setUnhealthyDevices(resp.body),
		onError: (e) =>
			toast.error("Failed to load unhealthy devices", {
				description: (e as Error).message,
			}),
	});

	const windowDays = windowLabel === "24h" ? 1 : windowLabel === "7d" ? 7 : 30;
	const rollups = summary.data?.rollups ?? [];
	const {
		groupingOptions,
		ifaceRows,
		deviceRows,
		ifaceGroupSummary,
		deviceGroupSummary,
		overview,
	} = useDeploymentCapacityRollups({
		inventoryData: inventory.data,
		rollups,
		windowLabel,
		ifaceMetric,
		deviceMetric,
		ifaceFilter,
		deviceFilter,
		tagFilter,
		groupFilter,
		locationFilter,
		vrfFilter,
		groupBy,
	});

	const derived = useDeploymentCapacityDerived({
		userId,
		deploymentId,
		windowLabel,
		windowDays,
		ifaceMetric,
		deviceMetric,
		growthIfaceMetric,
		growthDeviceMetric,
		compareHours,
		selectedIface,
		selectedDevice,
		forwardEnabled,
		forwardNetworkId,
		locationFilter,
		tagFilter,
		groupFilter,
		routingDeviceFilter,
		routingVrfFilter,
		summary,
		inventory,
		rollups,
		ifaceRows,
		deviceRows,
	});

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
		deployment,
		forwardNetworkId,
		forwardEnabled,
		summary,
		inventory,
		refresh,
		loadUnhealthyDevices,
		groupingOptions,
		ifaceRows,
		deviceRows,
		ifaceGroupSummary,
		deviceGroupSummary,
		overview,
		...derived,
	};
}

export type DeploymentCapacityPageState = ReturnType<
	typeof useDeploymentCapacityPage
>;
