import {
	metricToDeviceType,
	metricToInterfaceType,
	quantile,
} from "@/components/capacity/forward-network-capacity-utils";
import type { LinePoint } from "@/components/capacity/simple-line-chart";
import type { ForwardNetworkCapacityDerivedArgs } from "@/hooks/forward-network-capacity-derived-types";
import {
	postForwardNetworkCapacityDeviceMetricsHistory,
	postForwardNetworkCapacityInterfaceMetricsHistory,
} from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useForwardNetworkCapacityHistory(
	args: ForwardNetworkCapacityDerivedArgs,
) {
	const {
		ownerUserId,
		networkRefId,
		forwardNetworkId,
		windowLabel,
		windowDays,
		ifaceMetric,
		deviceMetric,
		selectedIface,
		selectedDevice,
	} = args;

	const ifaceHistory = useQuery({
		queryKey: [
			"capacityIfaceHistory",
			ownerUserId,
			networkRefId,
			windowLabel,
			ifaceMetric,
			selectedIface?.id ?? "",
		],
		queryFn: async () => {
			if (!selectedIface) return null;
			const typ = metricToInterfaceType(ifaceMetric);
			const resp = await postForwardNetworkCapacityInterfaceMetricsHistory(
				ownerUserId,
				networkRefId,
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
		enabled: Boolean(selectedIface && ownerUserId && forwardNetworkId),
		retry: false,
		staleTime: 10_000,
	});

	const deviceHistory = useQuery({
		queryKey: [
			"capacityDeviceHistory",
			ownerUserId,
			networkRefId,
			windowLabel,
			deviceMetric,
			selectedDevice?.id ?? "",
		],
		queryFn: async () => {
			if (!selectedDevice) return null;
			const typ = metricToDeviceType(deviceMetric);
			const resp = await postForwardNetworkCapacityDeviceMetricsHistory(
				ownerUserId,
				networkRefId,
				{
					type: typ,
					days: windowDays,
					maxSamples: 400,
					devices: [selectedDevice.device],
				},
			);
			return resp.body as any;
		},
		enabled: Boolean(selectedDevice && ownerUserId && forwardNetworkId),
		retry: false,
		staleTime: 10_000,
	});

	const ifacePoints: LinePoint[] = useMemo(() => {
		const body = ifaceHistory.data as any;
		const m = body?.metrics?.[0];
		const data = Array.isArray(m?.data) ? m.data : [];
		return data
			.map((dp: any) => ({
				x: String(dp?.instant ?? ""),
				y: Number(dp?.value ?? Number.NaN),
			}))
			.filter((p: LinePoint) => p.x && Number.isFinite(p.y));
	}, [ifaceHistory.data]);

	const devicePoints: LinePoint[] = useMemo(() => {
		const body = deviceHistory.data as any;
		const m = body?.metrics?.[0];
		const data = Array.isArray(m?.data) ? m.data : [];
		return data
			.map((dp: any) => ({
				x: String(dp?.instant ?? ""),
				y: Number(dp?.value ?? Number.NaN),
			}))
			.filter((p: LinePoint) => p.x && Number.isFinite(p.y));
	}, [deviceHistory.data]);

	const ifaceComputed = useMemo(() => {
		const ys = ifacePoints.map((p) => p.y);
		return {
			p95: quantile(ys, 0.95),
			p99: quantile(ys, 0.99),
			max: ys.length ? Math.max(...ys) : null,
		};
	}, [ifacePoints]);

	const deviceComputed = useMemo(() => {
		const ys = devicePoints.map((p) => p.y);
		return {
			p95: quantile(ys, 0.95),
			p99: quantile(ys, 0.99),
			max: ys.length ? Math.max(...ys) : null,
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
