import type {
	DeviceRow,
	InterfaceRow,
} from "@/components/capacity/forward-network-capacity-types";
import type { ForwardNetworkCapacityDerivedArgs } from "@/hooks/forward-network-capacity-derived-types";
import { useMemo } from "react";

export function useForwardNetworkCapacityRollupRows(
	args: ForwardNetworkCapacityDerivedArgs,
) {
	const {
		rollups,
		windowLabel,
		ifaceMetric,
		deviceMetric,
		ifaceFilter,
		deviceFilter,
		locationFilter,
		vrfFilter,
		tagFilter,
		groupFilter,
		ifaceInvIndex,
	} = args;

	const ifaceRows: InterfaceRow[] = useMemo(() => {
		const q = ifaceFilter.trim().toLowerCase();
		const rows = rollups
			.filter(
				(r) =>
					r.objectType === "interface" &&
					r.window === windowLabel &&
					r.metric === ifaceMetric,
			)
			.map((r) => {
				const d = r.details ?? {};
				const device = String(d["deviceName"] ?? "").trim();
				const iface = String(d["interfaceName"] ?? "").trim();
				const dir = String(d["direction"] ?? "").trim();
				const vrf = String(d["vrf"] ?? "").trim() || undefined;
				const vrfNames = Array.isArray(d["vrfNames"])
					? (d["vrfNames"] as unknown[])
							.map((x) => String(x ?? "").trim())
							.filter(Boolean)
					: undefined;
				const locationName =
					String(d["locationName"] ?? "").trim() || undefined;
				const tagNames = Array.isArray(d["tagNames"])
					? (d["tagNames"] as unknown[])
							.map((x) => String(x ?? "").trim())
							.filter(Boolean)
					: undefined;
				const groupNames = Array.isArray(d["groupNames"])
					? (d["groupNames"] as unknown[])
							.map((x) => String(x ?? "").trim())
							.filter(Boolean)
					: undefined;
				const inv = ifaceInvIndex.get(`${device}|${iface}`);
				return {
					id: `${device}:${iface}:${dir}:${r.metric}:${r.window}`,
					device,
					iface,
					dir,
					aggregateId: inv?.aggregateId,
					isAggregate: inv?.interfaceType === "IF_AGGREGATE",
					vrf,
					vrfNames,
					locationName,
					tagNames,
					groupNames,
					speedMbps: (d["speedMbps"] as number | undefined) ?? null,
					admin: String(d["adminStatus"] ?? "").trim() || undefined,
					oper: String(d["operStatus"] ?? "").trim() || undefined,
					p95: r.p95,
					p99: r.p99,
					max: r.max,
					slopePerDay: r.slopePerDay,
					forecastCrossingTs: r.forecastCrossingTs,
					threshold: r.threshold,
					samples: r.samples,
					raw: r,
				};
			});
		const filteredByText = q
			? rows.filter(
					(r) =>
						r.device.toLowerCase().includes(q) ||
						r.iface.toLowerCase().includes(q) ||
						(r.dir || "").toLowerCase().includes(q),
				)
			: rows;
		const filtered = filteredByText.filter((r) => {
			if (locationFilter !== "all" && (r.locationName ?? "") !== locationFilter)
				return false;
			if (vrfFilter !== "all") {
				const v = vrfFilter;
				if (r.vrf !== v && !(r.vrfNames ?? []).includes(v)) return false;
			}
			if (tagFilter !== "all" && !(r.tagNames ?? []).includes(tagFilter))
				return false;
			if (groupFilter !== "all" && !(r.groupNames ?? []).includes(groupFilter))
				return false;
			return true;
		});
		filtered.sort((a, b) => (b.max ?? 0) - (a.max ?? 0));
		return filtered;
	}, [
		rollups,
		windowLabel,
		ifaceMetric,
		ifaceFilter,
		locationFilter,
		vrfFilter,
		tagFilter,
		groupFilter,
		ifaceInvIndex,
	]);

	const deviceRows: DeviceRow[] = useMemo(() => {
		const q = deviceFilter.trim().toLowerCase();
		const rows = rollups
			.filter(
				(r) =>
					r.objectType === "device" &&
					r.window === windowLabel &&
					r.metric === deviceMetric,
			)
			.map((r) => {
				const d = r.details ?? {};
				const device = String(d["deviceName"] ?? "").trim();
				const locationName =
					String(d["locationName"] ?? "").trim() || undefined;
				const tagNames = Array.isArray(d["tagNames"])
					? (d["tagNames"] as unknown[])
							.map((x) => String(x ?? "").trim())
							.filter(Boolean)
					: undefined;
				const groupNames = Array.isArray(d["groupNames"])
					? (d["groupNames"] as unknown[])
							.map((x) => String(x ?? "").trim())
							.filter(Boolean)
					: undefined;
				return {
					id: `${device}:${r.metric}:${r.window}`,
					device,
					metric: r.metric,
					locationName,
					tagNames,
					groupNames,
					vendor: String(d["vendor"] ?? "").trim() || undefined,
					os: String(d["os"] ?? "").trim() || undefined,
					model: String(d["model"] ?? "").trim() || undefined,
					p95: r.p95,
					p99: r.p99,
					max: r.max,
					slopePerDay: r.slopePerDay,
					forecastCrossingTs: r.forecastCrossingTs,
					threshold: r.threshold,
					samples: r.samples,
					raw: r,
				};
			});
		const filteredByText = q
			? rows.filter(
					(r) =>
						r.device.toLowerCase().includes(q) ||
						(r.vendor || "").toLowerCase().includes(q) ||
						(r.os || "").toLowerCase().includes(q) ||
						(r.model || "").toLowerCase().includes(q),
				)
			: rows;
		const filtered = filteredByText.filter((r) => {
			if (locationFilter !== "all" && (r.locationName ?? "") !== locationFilter)
				return false;
			if (tagFilter !== "all" && !(r.tagNames ?? []).includes(tagFilter))
				return false;
			if (groupFilter !== "all" && !(r.groupNames ?? []).includes(groupFilter))
				return false;
			return true;
		});
		filtered.sort((a, b) => (b.max ?? 0) - (a.max ?? 0));
		return filtered;
	}, [
		rollups,
		windowLabel,
		deviceMetric,
		deviceFilter,
		locationFilter,
		tagFilter,
		groupFilter,
	]);

	return { ifaceRows, deviceRows };
}
