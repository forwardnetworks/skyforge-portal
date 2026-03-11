import {
	metricToDeviceType,
	metricToInterfaceType,
	quantile,
} from "@/components/capacity/deployment-capacity-utils";
import type { LinePoint } from "@/components/capacity/simple-line-chart";
import {
	postDeploymentCapacityDeviceMetricsHistory,
	postDeploymentCapacityInterfaceMetricsHistory,
} from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import type { DeploymentCapacityDerivedInput } from "@/hooks/use-deployment-capacity-shared";

export function useDeploymentCapacityHistory(
	input: Pick<
		DeploymentCapacityDerivedInput,
		| "userId"
		| "deploymentId"
		| "windowLabel"
		| "windowDays"
		| "ifaceMetric"
		| "deviceMetric"
		| "selectedIface"
		| "selectedDevice"
		| "forwardEnabled"
		| "forwardNetworkId"
	>,
) {
	const {
		userId,
		deploymentId,
		windowLabel,
		windowDays,
		ifaceMetric,
		deviceMetric,
		selectedIface,
		selectedDevice,
		forwardEnabled,
		forwardNetworkId,
	} = input;

	const ifaceHistory = useQuery({
		queryKey: [
			"capacityIfaceHistory",
			userId,
			deploymentId,
			windowLabel,
			ifaceMetric,
			selectedIface?.id ?? "",
		],
		queryFn: async () => {
			if (!selectedIface) return null;
			const typ = metricToInterfaceType(ifaceMetric);
			const resp = await postDeploymentCapacityInterfaceMetricsHistory(
				userId,
				deploymentId,
				{
					type: typ,
					days: windowDays,
					maxSamples: 400,
					interfaces: [
						{
							deviceName: selectedIface.device,
							interfaceName: selectedIface.iface,
							direction: selectedIface.dir,
						},
					],
				},
			);
			return resp.body as any;
		},
		enabled: Boolean(
			selectedIface &&
				userId &&
				deploymentId &&
				forwardEnabled &&
				forwardNetworkId,
		),
		retry: false,
		staleTime: 10_000,
	});

	const deviceHistory = useQuery({
		queryKey: [
			"capacityDeviceHistory",
			userId,
			deploymentId,
			windowLabel,
			deviceMetric,
			selectedDevice?.id ?? "",
		],
		queryFn: async () => {
			if (!selectedDevice) return null;
			const typ = metricToDeviceType(deviceMetric);
			const resp = await postDeploymentCapacityDeviceMetricsHistory(
				userId,
				deploymentId,
				{
					type: typ,
					days: windowDays,
					maxSamples: 400,
					devices: [selectedDevice.device],
				},
			);
			return resp.body as any;
		},
		enabled: Boolean(
			selectedDevice &&
				userId &&
				deploymentId &&
				forwardEnabled &&
				forwardNetworkId,
		),
		retry: false,
		staleTime: 10_000,
	});

	const ifacePoints: LinePoint[] = useMemo(() => {
		const body = ifaceHistory.data as any;
		const metric = body?.metrics?.[0];
		const data = Array.isArray(metric?.data) ? metric.data : [];
		return data
			.map((dp: any) => ({
				x: String(dp?.instant ?? ""),
				y: Number(dp?.value ?? Number.NaN),
			}))
			.filter((point: LinePoint) => point.x && Number.isFinite(point.y));
	}, [ifaceHistory.data]);

	const devicePoints: LinePoint[] = useMemo(() => {
		const body = deviceHistory.data as any;
		const metric = body?.metrics?.[0];
		const data = Array.isArray(metric?.data) ? metric.data : [];
		return data
			.map((dp: any) => ({
				x: String(dp?.instant ?? ""),
				y: Number(dp?.value ?? Number.NaN),
			}))
			.filter((point: LinePoint) => point.x && Number.isFinite(point.y));
	}, [deviceHistory.data]);

	const ifaceComputed = useMemo(() => {
		const values = ifacePoints.map((point) => point.y);
		return {
			p95: quantile(values, 0.95),
			p99: quantile(values, 0.99),
			max: values.length ? Math.max(...values) : null,
		};
	}, [ifacePoints]);

	const deviceComputed = useMemo(() => {
		const values = devicePoints.map((point) => point.y);
		return {
			p95: quantile(values, 0.95),
			p99: quantile(values, 0.99),
			max: values.length ? Math.max(...values) : null,
		};
	}, [devicePoints]);

	return {
		ifaceHistory,
		deviceHistory,
		ifacePoints,
		devicePoints,
		ifaceComputed,
		deviceComputed,
	};
}
