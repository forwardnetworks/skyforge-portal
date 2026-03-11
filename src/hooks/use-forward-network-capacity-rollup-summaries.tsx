import type {
	DeviceRow,
	GroupSummaryRow,
	InterfaceRow,
} from "@/components/capacity/forward-network-capacity-types";
import type { ForwardNetworkCapacityDerivedArgs } from "@/hooks/forward-network-capacity-derived-types";
import { useMemo } from "react";

export function useForwardNetworkCapacityRollupSummaries({
	groupBy,
	ifaceMetric,
	rollups,
	inventoryData,
	ifaceRows,
	deviceRows,
}: Pick<
	ForwardNetworkCapacityDerivedArgs,
	"groupBy" | "ifaceMetric" | "rollups" | "inventoryData"
> & {
	ifaceRows: InterfaceRow[];
	deviceRows: DeviceRow[];
}) {
	const ifaceGroupSummary: GroupSummaryRow[] = useMemo(() => {
		if (groupBy === "none") return [];
		const thr = 0.85;
		const m = new Map<string, GroupSummaryRow>();
		const devicesByGroup = new Map<string, Set<string>>();
		const add = (key: string, r: InterfaceRow) => {
			const cur =
				m.get(key) ??
				({
					group: key,
					count: 0,
					hotCount: 0,
					sumSpeedGbps: 0,
					sumP95Gbps: 0,
					sumMaxGbps: 0,
					p95Count: 0,
				} satisfies GroupSummaryRow);
			cur.count += 1;
			if (!devicesByGroup.has(key)) devicesByGroup.set(key, new Set<string>());
			devicesByGroup.get(key)?.add(r.device);
			const maxV = r.max ?? 0;
			const p95 = r.p95 ?? undefined;
			cur.maxMax = Math.max(cur.maxMax ?? 0, maxV);
			if (p95 !== undefined) {
				cur.maxP95 = Math.max(cur.maxP95 ?? 0, p95);
				if (ifaceMetric.startsWith("util_")) {
					const speed = Number(r.speedMbps ?? 0);
					if (speed > 0) {
						cur.maxP95Gbps = Math.max(
							cur.maxP95Gbps ?? 0,
							(p95 * speed) / 1000,
						);
					}
				}
			}
			if (ifaceMetric.startsWith("util_")) {
				const speed = Number(r.speedMbps ?? 0);
				if (speed > 0) {
					cur.sumSpeedGbps = (cur.sumSpeedGbps ?? 0) + speed / 1000;
					if (p95 !== undefined && Number.isFinite(p95)) {
						cur.sumP95Gbps = (cur.sumP95Gbps ?? 0) + (p95 * speed) / 1000;
						cur.p95Count = (cur.p95Count ?? 0) + 1;
					}
					if (r.max !== undefined && r.max !== null && Number.isFinite(r.max)) {
						cur.sumMaxGbps =
							(cur.sumMaxGbps ?? 0) + (Number(r.max) * speed) / 1000;
					}
				}
				if (r.forecastCrossingTs) {
					const ts = r.forecastCrossingTs;
					if (!cur.soonestForecast) cur.soonestForecast = ts;
					else if (Date.parse(ts) < Date.parse(cur.soonestForecast))
						cur.soonestForecast = ts;
				}
			}
			if (ifaceMetric.startsWith("util_") && maxV >= (r.threshold ?? thr))
				cur.hotCount += 1;
			m.set(key, cur);
		};
		for (const r of ifaceRows) {
			if (groupBy === "location") add(r.locationName ?? "unknown", r);
			else if (groupBy === "tag")
				for (const t of r.tagNames?.length ? r.tagNames : ["untagged"])
					add(t, r);
			else if (groupBy === "group")
				for (const g of r.groupNames?.length ? r.groupNames : ["ungrouped"])
					add(g, r);
			else if (groupBy === "vrf") add(r.vrf ?? r.vrfNames?.[0] ?? "unknown", r);
		}
		const out = Array.from(m.values());
		if (groupBy === "vrf") {
			const rs = inventoryData?.routeScale ?? [];
			const bgp = inventoryData?.bgpNeighbors ?? [];
			for (const row of out) {
				const devs = devicesByGroup.get(row.group) ?? new Set<string>();
				let v4 = 0;
				let v6 = 0;
				let bn = 0;
				let be = 0;
				for (const r of rs) {
					if (r.vrf !== row.group || !devs.has(r.deviceName)) continue;
					v4 += Number(r.ipv4Routes ?? 0);
					v6 += Number(r.ipv6Routes ?? 0);
				}
				for (const n of bgp) {
					if (n.vrf !== row.group || !devs.has(n.deviceName)) continue;
					bn += 1;
					if (
						String(n.sessionState ?? "")
							.toUpperCase()
							.includes("ESTABLISHED")
					)
						be += 1;
				}
				row.ipv4RoutesSum = v4;
				row.ipv6RoutesSum = v6;
				row.bgpNeighbors = bn;
				row.bgpEstablished = be;
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

	const deviceGroupSummary: GroupSummaryRow[] = useMemo(() => {
		if (groupBy === "none") return [];
		const thr = 0.85;
		const m = new Map<string, GroupSummaryRow>();
		const add = (key: string, r: DeviceRow) => {
			const cur = m.get(key) ?? { group: key, count: 0, hotCount: 0 };
			cur.count += 1;
			cur.maxMax = Math.max(cur.maxMax ?? 0, r.max ?? 0);
			if (r.p95 !== undefined) cur.maxP95 = Math.max(cur.maxP95 ?? 0, r.p95);
			if ((r.max ?? 0) >= (r.threshold ?? thr)) cur.hotCount += 1;
			m.set(key, cur);
		};
		for (const r of deviceRows) {
			if (groupBy === "location") add(r.locationName ?? "unknown", r);
			else if (groupBy === "tag")
				for (const t of r.tagNames?.length ? r.tagNames : ["untagged"])
					add(t, r);
			else if (groupBy === "group")
				for (const g of r.groupNames?.length ? r.groupNames : ["ungrouped"])
					add(g, r);
		}
		return Array.from(m.values()).sort(
			(a, b) => (b.maxP95 ?? 0) - (a.maxP95 ?? 0),
		);
	}, [deviceRows, groupBy]);

	const overview = useMemo(() => {
		const util = rollups.filter((r) => r.metric.startsWith("util_"));
		const above = util.filter((r) => (r.max ?? 0) >= 0.85).length;
		const soonest = util
			.map((r) => ({ ts: r.forecastCrossingTs ?? "", r }))
			.filter((x) => x.ts)
			.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts))[0]?.r;
		return { above, soonest };
	}, [rollups]);

	return { ifaceGroupSummary, deviceGroupSummary, overview };
}
