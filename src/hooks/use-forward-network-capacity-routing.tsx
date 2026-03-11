import type { VrfSummaryRow } from "@/components/capacity/forward-network-capacity-types";
import type { ForwardNetworkCapacityDerivedArgs } from "@/hooks/forward-network-capacity-derived-types";
import { useMemo } from "react";

export function useForwardNetworkCapacityRouting(
	args: ForwardNetworkCapacityDerivedArgs,
) {
	const {
		inventoryData,
		routingDeviceFilter,
		routingVrfFilter,
		rollups,
		windowLabel,
	} = args;

	const routingOptions = useMemo(() => {
		const devs = new Set<string>();
		const vrfs = new Set<string>();
		for (const r of inventoryData?.routeScale ?? []) {
			const d = String(r.deviceName ?? "").trim();
			const v = String(r.vrf ?? "").trim();
			if (d) devs.add(d);
			if (v) vrfs.add(v);
		}
		for (const r of inventoryData?.bgpNeighbors ?? []) {
			const d = String(r.deviceName ?? "").trim();
			const v = String(r.vrf ?? "").trim();
			if (d) devs.add(d);
			if (v) vrfs.add(v);
		}
		return { devices: Array.from(devs).sort(), vrfs: Array.from(vrfs).sort() };
	}, [inventoryData?.routeScale, inventoryData?.bgpNeighbors]);

	const filteredRouteScale = useMemo(
		() =>
			(inventoryData?.routeScale ?? []).filter(
				(r) =>
					(routingDeviceFilter === "all" ||
						r.deviceName === routingDeviceFilter) &&
					(routingVrfFilter === "all" || r.vrf === routingVrfFilter),
			),
		[inventoryData?.routeScale, routingDeviceFilter, routingVrfFilter],
	);

	const filteredBgpNeighbors = useMemo(
		() =>
			(inventoryData?.bgpNeighbors ?? []).filter(
				(r) =>
					(routingDeviceFilter === "all" ||
						r.deviceName === routingDeviceFilter) &&
					(routingVrfFilter === "all" || r.vrf === routingVrfFilter),
			),
		[inventoryData?.bgpNeighbors, routingDeviceFilter, routingVrfFilter],
	);

	const filteredHardwareTcam = useMemo(
		() =>
			(inventoryData?.hardwareTcam ?? []).filter(
				(r) =>
					routingDeviceFilter === "all" || r.deviceName === routingDeviceFilter,
			),
		[inventoryData?.hardwareTcam, routingDeviceFilter],
	);

	const vrfSummaryRows: VrfSummaryRow[] = useMemo(() => {
		const m = new Map<string, VrfSummaryRow>();
		const keyOf = (d: string, v: string) => `${d}||${v}`;
		for (const r of inventoryData?.routeScale ?? []) {
			const d = String(r.deviceName ?? "").trim();
			const v = String(r.vrf ?? "").trim();
			if (!d || !v) continue;
			const key = keyOf(d, v);
			const cur =
				m.get(key) ??
				({
					id: key,
					deviceName: d,
					vrf: v,
					ipv4Routes: 0,
					ipv6Routes: 0,
					bgpNeighbors: 0,
					bgpEstablished: 0,
				} satisfies VrfSummaryRow);
			cur.ipv4Routes = Number(r.ipv4Routes ?? 0);
			cur.ipv6Routes = Number(r.ipv6Routes ?? 0);
			m.set(key, cur);
		}
		for (const n of inventoryData?.bgpNeighbors ?? []) {
			const d = String(n.deviceName ?? "").trim();
			const v = String(n.vrf ?? "").trim();
			if (!d || !v) continue;
			const key = keyOf(d, v);
			const cur =
				m.get(key) ??
				({
					id: key,
					deviceName: d,
					vrf: v,
					ipv4Routes: 0,
					ipv6Routes: 0,
					bgpNeighbors: 0,
					bgpEstablished: 0,
				} satisfies VrfSummaryRow);
			cur.bgpNeighbors += 1;
			if (
				String(n.sessionState ?? "")
					.toUpperCase()
					.includes("ESTABLISHED")
			) {
				cur.bgpEstablished += 1;
			}
			m.set(key, cur);
		}
		for (const rr of rollups) {
			if (
				rr.objectType !== "interface" ||
				rr.window !== windowLabel ||
				!rr.metric.startsWith("util_")
			) {
				continue;
			}
			const d = rr.details ?? {};
			const device = String(d["deviceName"] ?? "").trim();
			const vrf = String(d["vrf"] ?? "").trim();
			if (!device || !vrf) continue;
			const key = keyOf(device, vrf);
			const cur =
				m.get(key) ??
				({
					id: key,
					deviceName: device,
					vrf,
					ipv4Routes: 0,
					ipv6Routes: 0,
					bgpNeighbors: 0,
					bgpEstablished: 0,
				} satisfies VrfSummaryRow);
			cur.maxIfaceMax = Math.max(cur.maxIfaceMax ?? 0, rr.max ?? 0);
			if (rr.p95 !== undefined && rr.p95 !== null) {
				cur.maxIfaceP95 = Math.max(cur.maxIfaceP95 ?? 0, rr.p95 ?? 0);
			}
			const f = rr.forecastCrossingTs ?? "";
			if (f) {
				if (!cur.soonestForecast) cur.soonestForecast = f;
				else if (Date.parse(f) < Date.parse(cur.soonestForecast)) {
					cur.soonestForecast = f;
				}
			}
			m.set(key, cur);
		}
		const out = Array.from(m.values());
		out.sort((a, b) => (b.maxIfaceMax ?? 0) - (a.maxIfaceMax ?? 0));
		return out;
	}, [
		inventoryData?.routeScale,
		inventoryData?.bgpNeighbors,
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
