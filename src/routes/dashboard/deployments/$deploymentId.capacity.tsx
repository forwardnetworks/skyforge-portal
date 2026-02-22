import {
	type LinePoint,
	SimpleLineChart,
} from "@/components/capacity/simple-line-chart";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryKeys } from "@/lib/query-keys";
import {
	type CapacityRollupRow,
	type DashboardSnapshot,
	type DeploymentCapacityInventoryResponse,
	type WorkspaceDeployment,
	getDeploymentCapacityGrowth,
	getDeploymentCapacityInventory,
	getDeploymentCapacitySummary,
	getDeploymentCapacityUnhealthyDevices,
	postDeploymentCapacityDeviceMetricsHistory,
	postDeploymentCapacityInterfaceMetricsHistory,
	refreshDeploymentCapacityRollups,
} from "@/lib/skyforge-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute(
	"/dashboard/deployments/$deploymentId/capacity",
)({
	component: DeploymentCapacityPage,
});

function jsonPretty(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function downloadText(filename: string, contentType: string, content: string) {
	const blob = new Blob([content], { type: contentType });
	const url = URL.createObjectURL(blob);
	try {
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
	} finally {
		URL.revokeObjectURL(url);
	}
}

function csvEscape(value: unknown): string {
	const s = value === null || value === undefined ? "" : String(value);
	if (
		s.includes('"') ||
		s.includes(",") ||
		s.includes("\n") ||
		s.includes("\r")
	) {
		return `"${s.replaceAll('"', '""')}"`;
	}
	return s;
}

function toCSV(headers: string[], rows: Array<Array<unknown>>): string {
	const lines = [headers.map(csvEscape).join(",")];
	for (const r of rows) lines.push(r.map(csvEscape).join(","));
	return lines.join("\n") + "\n";
}

function parseRFC3339(s: string | undefined): Date | null {
	if (!s) return null;
	const t = Date.parse(s);
	return Number.isFinite(t) ? new Date(t) : null;
}

function fmtPct01(v: number | undefined): string {
	if (v === undefined) return "—";
	if (!Number.isFinite(v)) return "—";
	return `${(v * 100).toFixed(1)}%`;
}

function fmtNum(v: number | undefined, digits = 3): string {
	if (v === undefined) return "—";
	if (!Number.isFinite(v)) return "—";
	return v.toFixed(digits);
}

function fmtSpeedMbps(speedMbps: number | null | undefined): string {
	const n = Number(speedMbps ?? 0);
	if (!Number.isFinite(n) || n <= 0) return "—";
	if (n >= 100_000) return `${(n / 1000).toFixed(0)}G`;
	if (n >= 10_000) return `${(n / 1000).toFixed(0)}G`;
	if (n >= 1000) return `${(n / 1000).toFixed(1)}G`;
	return `${n}M`;
}

function quantile(values: number[], q: number): number | null {
	if (!values.length) return null;
	const cp = [...values]
		.filter((v) => Number.isFinite(v))
		.sort((a, b) => a - b);
	if (!cp.length) return null;
	if (q <= 0) return cp[0]!;
	if (q >= 1) return cp[cp.length - 1]!;
	const pos = q * (cp.length - 1);
	const lo = Math.floor(pos);
	const hi = Math.ceil(pos);
	if (lo === hi) return cp[lo]!;
	const frac = pos - lo;
	return cp[lo]! * (1 - frac) + cp[hi]! * frac;
}

function metricToInterfaceType(
	metric: string,
): "UTILIZATION" | "ERROR" | "PACKET_LOSS" {
	if (metric.startsWith("util_")) return "UTILIZATION";
	if (metric.includes("packet_loss")) return "PACKET_LOSS";
	return "ERROR";
}

function metricToDeviceType(metric: string): "CPU" | "MEMORY" {
	if (metric.includes("memory")) return "MEMORY";
	return "CPU";
}

type InterfaceRow = {
	id: string;
	device: string;
	iface: string;
	dir: string;
	vrf?: string;
	vrfNames?: string[];
	locationName?: string;
	tagNames?: string[];
	groupNames?: string[];
	speedMbps?: number | null;
	admin?: string;
	oper?: string;
	p95?: number;
	p99?: number;
	max?: number;
	slopePerDay?: number;
	forecastCrossingTs?: string;
	threshold?: number;
	samples: number;
	raw?: CapacityRollupRow;
};

type DeviceRow = {
	id: string;
	device: string;
	metric: string;
	locationName?: string;
	tagNames?: string[];
	groupNames?: string[];
	vendor?: string;
	os?: string;
	model?: string;
	p95?: number;
	p99?: number;
	max?: number;
	slopePerDay?: number;
	forecastCrossingTs?: string;
	threshold?: number;
	samples: number;
	raw?: CapacityRollupRow;
};

type GroupSummaryRow = {
	group: string;
	count: number;
	hotCount: number;
	maxP95?: number;
	maxP95Gbps?: number;
	maxMax?: number;
	sumSpeedGbps?: number;
	sumP95Gbps?: number;
	sumMaxGbps?: number;
	p95Count?: number;
	soonestForecast?: string;
	ipv4RoutesSum?: number;
	ipv6RoutesSum?: number;
	bgpNeighbors?: number;
	bgpEstablished?: number;
};

type InterfaceGrowthRow = {
	id: string;
	device: string;
	iface: string;
	dir: string;
	locationName?: string;
	tagNames?: string[];
	groupNames?: string[];
	speedMbps?: number | null;
	nowP95?: number;
	prevP95?: number | null;
	deltaP95?: number | null;
	deltaP95Gbps?: number | null;
	nowMax?: number;
	prevMax?: number | null;
	deltaMax?: number | null;
	nowForecast?: string;
	raw: unknown;
};

type DeviceGrowthRow = {
	id: string;
	device: string;
	locationName?: string;
	tagNames?: string[];
	groupNames?: string[];
	vendor?: string;
	os?: string;
	model?: string;
	nowP95?: number;
	prevP95?: number | null;
	deltaP95?: number | null;
	nowMax?: number;
	prevMax?: number | null;
	deltaMax?: number | null;
	nowForecast?: string;
	raw: unknown;
};

type VrfSummaryRow = {
	id: string;
	deviceName: string;
	vrf: string;
	ipv4Routes: number;
	ipv6Routes: number;
	bgpNeighbors: number;
	bgpEstablished: number;
	maxIfaceMax?: number;
	maxIfaceP95?: number;
	soonestForecast?: string;
};

function DeploymentCapacityPage() {
	const { deploymentId } = Route.useParams();
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
			(d: WorkspaceDeployment) => d.id === deploymentId,
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
				queryKey: queryKeys.deploymentCapacitySummary(
					userId,
					deploymentId,
				),
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.deploymentCapacityInventory(
					userId,
					deploymentId,
				),
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
			return getDeploymentCapacityUnhealthyDevices(
				userId,
				deploymentId,
				{},
			);
		},
		onSuccess: (resp) => setUnhealthyDevices(resp.body),
		onError: (e) =>
			toast.error("Failed to load unhealthy devices", {
				description: (e as Error).message,
			}),
	});

	const groupingOptions = useMemo(() => {
		const devices = inventory.data?.devices ?? [];
		const ifaceVrfs = inventory.data?.interfaceVrfs ?? [];
		const tags = new Set<string>();
		const groups = new Set<string>();
		const locations = new Set<string>();
		const vrfs = new Set<string>();
		for (const d of devices) {
			for (const t of d.tagNames ?? []) {
				const tt = String(t ?? "").trim();
				if (tt) tags.add(tt);
			}
			for (const g of d.groupNames ?? []) {
				const gg = String(g ?? "").trim();
				if (gg) groups.add(gg);
			}
			const loc = String(d.locationName ?? "").trim();
			if (loc) locations.add(loc);
		}
		for (const r of ifaceVrfs) {
			const v = String(r.vrf ?? "").trim();
			if (v) vrfs.add(v);
		}
		return {
			tags: Array.from(tags).sort(),
			groups: Array.from(groups).sort(),
			locations: Array.from(locations).sort(),
			vrfs: Array.from(vrfs).sort(),
		};
	}, [inventory.data?.devices, inventory.data?.interfaceVrfs]);

	const windowDays = windowLabel === "24h" ? 1 : windowLabel === "7d" ? 7 : 30;

	const rollups = summary.data?.rollups ?? [];

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
				const id = `${device}:${iface}:${dir}:${r.metric}:${r.window}`;
				return {
					id,
					device,
					iface,
					dir,
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
			? rows.filter((r) => {
					return (
						r.device.toLowerCase().includes(q) ||
						r.iface.toLowerCase().includes(q) ||
						(r.dir || "").toLowerCase().includes(q)
					);
				})
			: rows;
		const filtered = filteredByText.filter((r) => {
			if (
				locationFilter !== "all" &&
				(r.locationName ?? "") !== locationFilter
			) {
				return false;
			}
			if (vrfFilter !== "all") {
				const v = vrfFilter;
				if (r.vrf === v) {
					// ok
				} else if ((r.vrfNames ?? []).includes(v)) {
					// ok
				} else {
					return false;
				}
			}
			if (tagFilter !== "all" && !(r.tagNames ?? []).includes(tagFilter)) {
				return false;
			}
			if (
				groupFilter !== "all" &&
				!(r.groupNames ?? []).includes(groupFilter)
			) {
				return false;
			}
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
				const id = `${device}:${r.metric}:${r.window}`;
				return {
					id,
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
			? rows.filter((r) => {
					return (
						r.device.toLowerCase().includes(q) ||
						(r.vendor || "").toLowerCase().includes(q) ||
						(r.os || "").toLowerCase().includes(q) ||
						(r.model || "").toLowerCase().includes(q)
					);
				})
			: rows;
		const filtered = filteredByText.filter((r) => {
			if (
				locationFilter !== "all" &&
				(r.locationName ?? "") !== locationFilter
			) {
				return false;
			}
			if (tagFilter !== "all" && !(r.tagNames ?? []).includes(tagFilter)) {
				return false;
			}
			if (
				groupFilter !== "all" &&
				!(r.groupNames ?? []).includes(groupFilter)
			) {
				return false;
			}
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
			devicesByGroup.get(key)!.add(r.device);
			const maxV = r.max ?? 0;
			const p95 = r.p95 ?? undefined;
			cur.maxMax = Math.max(cur.maxMax ?? 0, maxV);
			if (p95 !== undefined) {
				cur.maxP95 = Math.max(cur.maxP95 ?? 0, p95);
				if (ifaceMetric.startsWith("util_")) {
					const speed = Number(r.speedMbps ?? 0);
					if (speed > 0) {
						const gbps = (p95 * speed) / 1000;
						cur.maxP95Gbps = Math.max(cur.maxP95Gbps ?? 0, gbps);
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
					else if (Date.parse(ts) < Date.parse(cur.soonestForecast)) {
						cur.soonestForecast = ts;
					}
				}
			}
			const hot = ifaceMetric.startsWith("util_")
				? maxV >= (r.threshold ?? thr)
				: false;
			if (hot) cur.hotCount += 1;
			m.set(key, cur);
		};
		for (const r of ifaceRows) {
			if (groupBy === "location") {
				add(r.locationName ?? "unknown", r);
			} else if (groupBy === "tag") {
				const tags = r.tagNames?.length ? r.tagNames : ["untagged"];
				for (const t of tags) add(t, r);
			} else if (groupBy === "group") {
				const groups = r.groupNames?.length ? r.groupNames : ["ungrouped"];
				for (const g of groups) add(g, r);
			} else if (groupBy === "vrf") {
				const vrf = r.vrf ?? r.vrfNames?.[0] ?? "unknown";
				add(vrf, r);
			}
		}
		const out = Array.from(m.values());

		if (groupBy === "vrf") {
			const rs = inventory.data?.routeScale ?? [];
			const bgp = inventory.data?.bgpNeighbors ?? [];
			for (const row of out) {
				const devs = devicesByGroup.get(row.group) ?? new Set<string>();
				let v4 = 0;
				let v6 = 0;
				let bn = 0;
				let be = 0;
				for (const r of rs) {
					if (r.vrf !== row.group) continue;
					if (!devs.has(r.deviceName)) continue;
					v4 += Number(r.ipv4Routes ?? 0);
					v6 += Number(r.ipv6Routes ?? 0);
				}
				for (const n of bgp) {
					if (n.vrf !== row.group) continue;
					if (!devs.has(n.deviceName)) continue;
					bn += 1;
					const st = String(n.sessionState ?? "").toUpperCase();
					if (st.includes("ESTABLISHED")) be += 1;
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
		inventory.data?.routeScale,
		inventory.data?.bgpNeighbors,
	]);

	const deviceGroupSummary: GroupSummaryRow[] = useMemo(() => {
		if (groupBy === "none") return [];
		const thr = 0.85;
		const m = new Map<string, GroupSummaryRow>();
		const add = (key: string, r: DeviceRow) => {
			const cur = m.get(key) ?? { group: key, count: 0, hotCount: 0 };
			cur.count += 1;
			const maxV = r.max ?? 0;
			const p95 = r.p95 ?? undefined;
			cur.maxMax = Math.max(cur.maxMax ?? 0, maxV);
			if (p95 !== undefined) cur.maxP95 = Math.max(cur.maxP95 ?? 0, p95);
			const hot = maxV >= (r.threshold ?? thr);
			if (hot) cur.hotCount += 1;
			m.set(key, cur);
		};
		for (const r of deviceRows) {
			if (groupBy === "location") {
				add(r.locationName ?? "unknown", r);
			} else if (groupBy === "tag") {
				const tags = r.tagNames?.length ? r.tagNames : ["untagged"];
				for (const t of tags) add(t, r);
			} else if (groupBy === "group") {
				const groups = r.groupNames?.length ? r.groupNames : ["ungrouped"];
				for (const g of groups) add(g, r);
			}
		}
		const out = Array.from(m.values());
		out.sort((a, b) => (b.maxP95 ?? 0) - (a.maxP95 ?? 0));
		return out;
	}, [deviceRows, groupBy]);

	const overview = useMemo(() => {
		const util = rollups.filter((r) => r.metric.startsWith("util_"));
		const threshold = 0.85;
		const above = util.filter((r) => (r.max ?? 0) >= threshold).length;
		const soonest = util
			.map((r) => ({ ts: r.forecastCrossingTs ?? "", r }))
			.filter((x) => x.ts)
			.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts))[0]?.r;
		return { above, soonest };
	}, [rollups]);

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

	const ifaceColumns: Array<DataTableColumn<InterfaceRow>> = useMemo(
		() => [
			{
				id: "device",
				header: "Device",
				cell: (r) => <span className="font-mono text-xs">{r.device}</span>,
				width: 200,
			},
			{
				id: "iface",
				header: "Interface",
				cell: (r) => <span className="font-mono text-xs">{r.iface}</span>,
				width: 220,
			},
			{
				id: "dir",
				header: "Dir",
				cell: (r) => <span className="text-xs">{r.dir || "—"}</span>,
				width: 90,
			},
			{
				id: "vrf",
				header: "VRF",
				cell: (r) => {
					const v = r.vrf ?? r.vrfNames?.[0] ?? "";
					if (!v)
						return <span className="text-muted-foreground text-xs">—</span>;
					const n = (r.vrfNames ?? []).length;
					return (
						<div className="text-xs">
							<div className="font-mono">{v}</div>
							{n > 1 ? (
								<div className="text-muted-foreground">{n} vrfs</div>
							) : null}
						</div>
					);
				},
				width: 160,
			},
			{
				id: "speed",
				header: "Speed",
				cell: (r) => (
					<span className="text-xs">{fmtSpeedMbps(r.speedMbps ?? null)}</span>
				),
				width: 90,
				align: "right",
			},
			{
				id: "state",
				header: "State",
				cell: (r) => (
					<span className="text-xs text-muted-foreground">
						{[r.admin, r.oper].filter(Boolean).join(" / ") || "—"}
					</span>
				),
				width: 140,
			},
			{
				id: "p95",
				header: "p95",
				align: "right",
				cell: (r) =>
					ifaceMetric.startsWith("util_") ? fmtPct01(r.p95) : fmtNum(r.p95),
				width: 90,
			},
			...(ifaceMetric.startsWith("util_")
				? ([
						{
							id: "p95Gbps",
							header: "p95 (Gbps)",
							align: "right",
							cell: (r: InterfaceRow) => {
								const speed = Number(r.speedMbps ?? 0);
								const p95 = Number(r.p95 ?? Number.NaN);
								if (!speed || !Number.isFinite(p95))
									return (
										<span className="text-muted-foreground text-xs">—</span>
									);
								const gbps = (p95 * speed) / 1000;
								return <span className="text-xs">{gbps.toFixed(2)}</span>;
							},
							width: 110,
						},
					] as Array<DataTableColumn<InterfaceRow>>)
				: []),
			{
				id: "max",
				header: "Max",
				align: "right",
				cell: (r) => {
					const v = ifaceMetric.startsWith("util_")
						? fmtPct01(r.max)
						: fmtNum(r.max);
					const thr =
						r.threshold ?? (ifaceMetric.startsWith("util_") ? 0.85 : undefined);
					const hot = thr !== undefined && (r.max ?? 0) >= thr;
					return (
						<span className={hot ? "text-destructive font-medium" : ""}>
							{v}
						</span>
					);
				},
				width: 90,
			},
			...(ifaceMetric.startsWith("util_")
				? ([
						{
							id: "maxGbps",
							header: "Max (Gbps)",
							align: "right",
							cell: (r: InterfaceRow) => {
								const speed = Number(r.speedMbps ?? 0);
								const maxV = Number(r.max ?? Number.NaN);
								if (!speed || !Number.isFinite(maxV))
									return (
										<span className="text-muted-foreground text-xs">—</span>
									);
								const gbps = (maxV * speed) / 1000;
								return <span className="text-xs">{gbps.toFixed(2)}</span>;
							},
							width: 110,
						},
						{
							id: "headroom85",
							header: "Headroom@85 (Gbps)",
							align: "right",
							cell: (r: InterfaceRow) => {
								const speed = Number(r.speedMbps ?? 0);
								const p95 = Number(r.p95 ?? Number.NaN);
								const thr = Number(r.threshold ?? 0.85);
								if (!speed || !Number.isFinite(p95) || !Number.isFinite(thr))
									return (
										<span className="text-muted-foreground text-xs">—</span>
									);
								const headroom = Math.max(0, (thr - p95) * speed) / 1000;
								return <span className="text-xs">{headroom.toFixed(2)}</span>;
							},
							width: 150,
						},
						{
							id: "days85",
							header: "Days@85",
							align: "right",
							cell: (r: InterfaceRow) => {
								if (!r.forecastCrossingTs)
									return (
										<span className="text-muted-foreground text-xs">—</span>
									);
								const dt = parseRFC3339(r.forecastCrossingTs);
								if (!dt)
									return (
										<span className="text-muted-foreground text-xs">—</span>
									);
								const days = Math.round(
									(dt.getTime() - Date.now()) / (24 * 3600 * 1000),
								);
								return <span className="text-xs">{days}</span>;
							},
							width: 90,
						},
					] as Array<DataTableColumn<InterfaceRow>>)
				: []),
			{
				id: "slope",
				header: "Slope/d",
				align: "right",
				cell: (r) =>
					ifaceMetric.startsWith("util_")
						? fmtPct01(r.slopePerDay)
						: fmtNum(r.slopePerDay),
				width: 100,
			},
			{
				id: "forecast",
				header: "Forecast",
				cell: (r) => {
					if (!r.forecastCrossingTs)
						return <span className="text-muted-foreground text-xs">—</span>;
					const dt = parseRFC3339(r.forecastCrossingTs);
					const days = dt
						? Math.round((dt.getTime() - Date.now()) / (24 * 3600 * 1000))
						: null;
					return (
						<div className="text-xs">
							<div className="font-mono">
								{r.forecastCrossingTs.slice(0, 10)}
							</div>
							{days !== null ? (
								<div className="text-muted-foreground">{days}d</div>
							) : null}
						</div>
					);
				},
				width: 120,
			},
			{
				id: "samples",
				header: "N",
				align: "right",
				cell: (r) => <span className="text-xs">{r.samples || 0}</span>,
				width: 70,
			},
		],
		[ifaceMetric],
	);

	const deviceColumns: Array<DataTableColumn<DeviceRow>> = useMemo(
		() => [
			{
				id: "device",
				header: "Device",
				cell: (r) => <span className="font-mono text-xs">{r.device}</span>,
				width: 240,
			},
			{
				id: "meta",
				header: "Meta",
				cell: (r) => (
					<div className="text-xs text-muted-foreground">
						<div>{[r.vendor, r.os].filter(Boolean).join(" • ") || "—"}</div>
						<div className="font-mono">{r.model || ""}</div>
					</div>
				),
				width: 240,
			},
			{
				id: "p95",
				header: "p95",
				align: "right",
				cell: (r) => fmtPct01(r.p95),
				width: 90,
			},
			{
				id: "max",
				header: "Max",
				align: "right",
				cell: (r) => {
					const thr = r.threshold ?? 0.85;
					const hot = (r.max ?? 0) >= thr;
					return (
						<span className={hot ? "text-destructive font-medium" : ""}>
							{fmtPct01(r.max)}
						</span>
					);
				},
				width: 90,
			},
			{
				id: "slope",
				header: "Slope/d",
				align: "right",
				cell: (r) => fmtPct01(r.slopePerDay),
				width: 100,
			},
			{
				id: "forecast",
				header: "Forecast",
				cell: (r) => {
					if (!r.forecastCrossingTs)
						return <span className="text-muted-foreground text-xs">—</span>;
					const dt = parseRFC3339(r.forecastCrossingTs);
					const days = dt
						? Math.round((dt.getTime() - Date.now()) / (24 * 3600 * 1000))
						: null;
					return (
						<div className="text-xs">
							<div className="font-mono">
								{r.forecastCrossingTs.slice(0, 10)}
							</div>
							{days !== null ? (
								<div className="text-muted-foreground">{days}d</div>
							) : null}
						</div>
					);
				},
				width: 120,
			},
			{
				id: "samples",
				header: "N",
				align: "right",
				cell: (r) => <span className="text-xs">{r.samples || 0}</span>,
				width: 70,
			},
		],
		[],
	);

	const ifaceGrowth = useQuery({
		queryKey: queryKeys.deploymentCapacityGrowth(
			userId,
			deploymentId,
			windowLabel,
			growthIfaceMetric,
			compareHours,
			"interface",
		),
		queryFn: () =>
			getDeploymentCapacityGrowth(userId, deploymentId, {
				metric: growthIfaceMetric,
				window: windowLabel,
				objectType: "interface",
				compareHours,
				limit: 50,
			}),
		enabled: Boolean(
			userId && deploymentId && forwardEnabled && forwardNetworkId,
		),
		retry: false,
		staleTime: 30_000,
	});

	const deviceGrowth = useQuery({
		queryKey: queryKeys.deploymentCapacityGrowth(
			userId,
			deploymentId,
			windowLabel,
			growthDeviceMetric,
			compareHours,
			"device",
		),
		queryFn: () =>
			getDeploymentCapacityGrowth(userId, deploymentId, {
				metric: growthDeviceMetric,
				window: windowLabel,
				objectType: "device",
				compareHours,
				limit: 50,
			}),
		enabled: Boolean(
			userId && deploymentId && forwardEnabled && forwardNetworkId,
		),
		retry: false,
		staleTime: 30_000,
	});

	const ifaceGrowthRows: InterfaceGrowthRow[] = useMemo(() => {
		const rows = ifaceGrowth.data?.rows ?? [];
		const mapped = rows.map((r: any) => {
			const d = (r?.now?.details ?? {}) as any;
			const device = String(d["deviceName"] ?? r.objectId ?? "").trim();
			const iface = String(d["interfaceName"] ?? "").trim();
			const dir = String(d["direction"] ?? "").trim();
			const locationName = String(d["locationName"] ?? "").trim() || undefined;
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
			const id = String(r?.objectId ?? `${device}:${iface}:${dir}`);
			return {
				id,
				device,
				iface,
				dir,
				locationName,
				tagNames,
				groupNames,
				speedMbps: (d["speedMbps"] as number | undefined) ?? null,
				nowP95: r?.now?.p95,
				prevP95: r?.prev?.p95 ?? null,
				deltaP95: r?.deltaP95 ?? null,
				deltaP95Gbps: r?.deltaP95Gbps ?? null,
				nowMax: r?.now?.max,
				prevMax: r?.prev?.max ?? null,
				deltaMax: r?.deltaMax ?? null,
				nowForecast: r?.now?.forecastCrossingTs ?? undefined,
				raw: r,
			} satisfies InterfaceGrowthRow;
		});
		const filtered = mapped.filter((r) => {
			if (locationFilter !== "all" && (r.locationName ?? "") !== locationFilter)
				return false;
			if (tagFilter !== "all" && !(r.tagNames ?? []).includes(tagFilter))
				return false;
			if (groupFilter !== "all" && !(r.groupNames ?? []).includes(groupFilter))
				return false;
			return true;
		});
		return filtered;
	}, [ifaceGrowth.data?.rows, locationFilter, tagFilter, groupFilter]);

	const deviceGrowthRows: DeviceGrowthRow[] = useMemo(() => {
		const rows = deviceGrowth.data?.rows ?? [];
		const mapped = rows.map((r: any) => {
			const d = (r?.now?.details ?? {}) as any;
			const device = String(d["deviceName"] ?? r.objectId ?? "").trim();
			const locationName = String(d["locationName"] ?? "").trim() || undefined;
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
			const id = String(r?.objectId ?? device);
			return {
				id,
				device,
				locationName,
				tagNames,
				groupNames,
				vendor: String(d["vendor"] ?? "").trim() || undefined,
				os: String(d["os"] ?? "").trim() || undefined,
				model: String(d["model"] ?? "").trim() || undefined,
				nowP95: r?.now?.p95,
				prevP95: r?.prev?.p95 ?? null,
				deltaP95: r?.deltaP95 ?? null,
				nowMax: r?.now?.max,
				prevMax: r?.prev?.max ?? null,
				deltaMax: r?.deltaMax ?? null,
				nowForecast: r?.now?.forecastCrossingTs ?? undefined,
				raw: r,
			} satisfies DeviceGrowthRow;
		});
		const filtered = mapped.filter((r) => {
			if (locationFilter !== "all" && (r.locationName ?? "") !== locationFilter)
				return false;
			if (tagFilter !== "all" && !(r.tagNames ?? []).includes(tagFilter))
				return false;
			if (groupFilter !== "all" && !(r.groupNames ?? []).includes(groupFilter))
				return false;
			return true;
		});
		return filtered;
	}, [deviceGrowth.data?.rows, locationFilter, tagFilter, groupFilter]);

	const routingOptions = useMemo(() => {
		const devs = new Set<string>();
		const vrfs = new Set<string>();
		for (const r of inventory.data?.routeScale ?? []) {
			const d = String(r.deviceName ?? "").trim();
			const v = String(r.vrf ?? "").trim();
			if (d) devs.add(d);
			if (v) vrfs.add(v);
		}
		for (const r of inventory.data?.bgpNeighbors ?? []) {
			const d = String(r.deviceName ?? "").trim();
			const v = String(r.vrf ?? "").trim();
			if (d) devs.add(d);
			if (v) vrfs.add(v);
		}
		return { devices: Array.from(devs).sort(), vrfs: Array.from(vrfs).sort() };
	}, [inventory.data?.routeScale, inventory.data?.bgpNeighbors]);

	const filteredRouteScale = useMemo(() => {
		const rows = inventory.data?.routeScale ?? [];
		return rows.filter((r) => {
			if (routingDeviceFilter !== "all" && r.deviceName !== routingDeviceFilter)
				return false;
			if (routingVrfFilter !== "all" && r.vrf !== routingVrfFilter)
				return false;
			return true;
		});
	}, [inventory.data?.routeScale, routingDeviceFilter, routingVrfFilter]);

	const filteredBgpNeighbors = useMemo(() => {
		const rows = inventory.data?.bgpNeighbors ?? [];
		return rows.filter((r) => {
			if (routingDeviceFilter !== "all" && r.deviceName !== routingDeviceFilter)
				return false;
			if (routingVrfFilter !== "all" && r.vrf !== routingVrfFilter)
				return false;
			return true;
		});
	}, [inventory.data?.bgpNeighbors, routingDeviceFilter, routingVrfFilter]);

	const filteredHardwareTcam = useMemo(() => {
		const rows = inventory.data?.hardwareTcam ?? [];
		return rows.filter((r) => {
			if (routingDeviceFilter !== "all" && r.deviceName !== routingDeviceFilter)
				return false;
			return true;
		});
	}, [inventory.data?.hardwareTcam, routingDeviceFilter]);

	const vrfSummaryRows: VrfSummaryRow[] = useMemo(() => {
		const m = new Map<string, VrfSummaryRow>();
		const keyOf = (d: string, v: string) => `${d}||${v}`;
		for (const r of inventory.data?.routeScale ?? []) {
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
		for (const n of inventory.data?.bgpNeighbors ?? []) {
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
			const state = String(n.sessionState ?? "").toUpperCase();
			if (state.includes("ESTABLISHED")) cur.bgpEstablished += 1;
			m.set(key, cur);
		}
		// Join interface rollups (util) for this window to highlight where VRFs have hotspots.
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
				else if (Date.parse(f) < Date.parse(cur.soonestForecast))
					cur.soonestForecast = f;
			}
			m.set(key, cur);
		}
		const out = Array.from(m.values());
		out.sort((a, b) => (b.maxIfaceMax ?? 0) - (a.maxIfaceMax ?? 0));
		return out;
	}, [
		inventory.data?.routeScale,
		inventory.data?.bgpNeighbors,
		rollups,
		windowLabel,
	]);

	if (!deployment) {
		return (
			<div className="space-y-6 p-6">
				<div className="flex items-center gap-3">
					<Link
						to="/dashboard/deployments/$deploymentId"
						params={{ deploymentId }}
						className={buttonVariants({
							variant: "outline",
							size: "icon",
							className: "h-9 w-9",
						})}
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<h1 className="text-2xl font-bold tracking-tight">Capacity</h1>
				</div>
				<Card>
					<CardContent className="pt-6 text-sm text-muted-foreground">
						Deployment not found.
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6 pb-20">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-3">
					<Link
						to="/dashboard/deployments/$deploymentId"
						params={{ deploymentId }}
						className={buttonVariants({
							variant: "outline",
							size: "icon",
							className: "h-9 w-9",
						})}
						title="Back to deployment"
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<div>
						<h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<TrendingUp className="h-5 w-5" /> Capacity
						</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Deployment: <span className="font-medium">{deployment.name}</span>
						</p>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={windowLabel}
						onValueChange={(v) => setWindowLabel(v as any)}
					>
						<SelectTrigger className="w-[110px]">
							<SelectValue placeholder="Window" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="24h">24h</SelectItem>
							<SelectItem value="7d">7d</SelectItem>
							<SelectItem value="30d">30d</SelectItem>
						</SelectContent>
					</Select>

					<Select value={locationFilter} onValueChange={setLocationFilter}>
						<SelectTrigger className="w-[190px]">
							<SelectValue placeholder="Location" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All locations</SelectItem>
							{groupingOptions.locations.map((loc) => (
								<SelectItem key={loc} value={loc}>
									{loc}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={vrfFilter} onValueChange={setVrfFilter}>
						<SelectTrigger className="w-[170px]">
							<SelectValue placeholder="VRF" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All VRFs</SelectItem>
							{groupingOptions.vrfs.map((v) => (
								<SelectItem key={v} value={v}>
									{v}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={tagFilter} onValueChange={setTagFilter}>
						<SelectTrigger className="w-[170px]">
							<SelectValue placeholder="Tag" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All tags</SelectItem>
							{groupingOptions.tags.map((t) => (
								<SelectItem key={t} value={t}>
									{t}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={groupFilter} onValueChange={setGroupFilter}>
						<SelectTrigger className="w-[170px]">
							<SelectValue placeholder="Group" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All groups</SelectItem>
							{groupingOptions.groups.map((g) => (
								<SelectItem key={g} value={g}>
									{g}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="Group by" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">No grouping</SelectItem>
							<SelectItem value="location">Location</SelectItem>
							<SelectItem value="tag">Tag</SelectItem>
							<SelectItem value="group">Group</SelectItem>
							<SelectItem value="vrf">VRF</SelectItem>
						</SelectContent>
					</Select>

					<Button
						variant="outline"
						onClick={() => refresh.mutate()}
						disabled={refresh.isPending || !forwardEnabled || !forwardNetworkId}
						title={
							!forwardEnabled || !forwardNetworkId
								? "Enable Forward and run sync first"
								: "Enqueue a background rollup task"
						}
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						{refresh.isPending ? "Queueing…" : "Refresh"}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">As Of</CardTitle>
					</CardHeader>
					<CardContent className="text-sm">
						<div className="font-mono text-xs">
							{summary.data?.asOf ?? inventory.data?.asOf ?? "—"}
						</div>
						<div className="mt-2 flex items-center gap-2">
							{summary.data?.stale ? (
								<Badge variant="destructive">Stale</Badge>
							) : (
								<Badge variant="secondary">Fresh</Badge>
							)}
							<Badge variant="outline" className="font-mono text-xs">
								{forwardNetworkId || "no-forward"}
							</Badge>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Hot Interfaces</CardTitle>
					</CardHeader>
					<CardContent className="text-sm">
						<div className="text-2xl font-semibold">{overview.above}</div>
						<div className="text-xs text-muted-foreground mt-1">
							util_* max &gt;= 85%
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Soonest Saturation</CardTitle>
					</CardHeader>
					<CardContent className="text-sm">
						{overview.soonest?.forecastCrossingTs ? (
							<div className="space-y-1">
								<div className="font-mono text-xs">
									{overview.soonest.forecastCrossingTs}
								</div>
								<div className="text-xs text-muted-foreground">
									{String(overview.soonest.details?.["deviceName"] ?? "")}{" "}
									{String(overview.soonest.details?.["interfaceName"] ?? "")}{" "}
									{String(overview.soonest.details?.["direction"] ?? "")}
								</div>
							</div>
						) : (
							<div className="text-muted-foreground text-sm">—</div>
						)}
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="interfaces" className="space-y-4">
				<TabsList>
					<TabsTrigger value="interfaces">Interfaces</TabsTrigger>
					<TabsTrigger value="devices">Devices</TabsTrigger>
					<TabsTrigger value="growth">Growth</TabsTrigger>
					<TabsTrigger value="routing">Routing/BGP</TabsTrigger>
					<TabsTrigger value="health">Health</TabsTrigger>
					<TabsTrigger value="raw">Raw</TabsTrigger>
				</TabsList>

				<TabsContent value="interfaces" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<CardTitle className="text-base">Interface Capacity</CardTitle>
							<div className="flex flex-col gap-2 md:flex-row md:items-center">
								<Input
									placeholder="Filter (device / interface)…"
									value={ifaceFilter}
									onChange={(e) => setIfaceFilter(e.target.value)}
									className="w-[260px]"
								/>
								<Select
									value={ifaceMetric}
									onValueChange={(v) => setIfaceMetric(v as any)}
								>
									<SelectTrigger className="w-[240px]">
										<SelectValue placeholder="Metric" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="util_ingress">
											Utilization (ingress)
										</SelectItem>
										<SelectItem value="util_egress">
											Utilization (egress)
										</SelectItem>
										<SelectItem value="if_error_ingress">
											Errors (ingress)
										</SelectItem>
										<SelectItem value="if_error_egress">
											Errors (egress)
										</SelectItem>
										<SelectItem value="if_packet_loss_ingress">
											Packet loss (ingress)
										</SelectItem>
										<SelectItem value="if_packet_loss_egress">
											Packet loss (egress)
										</SelectItem>
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									onClick={() => {
										const headers = [
											"device",
											"interface",
											"direction",
											"window",
											"metric",
											"speedMbps",
											"adminStatus",
											"operStatus",
											"p95",
											"p99",
											"max",
											"slopePerDay",
											"forecastCrossingTs",
											"samples",
										];
										const rows = ifaceRows.map((r) => [
											r.device,
											r.iface,
											r.dir,
											windowLabel,
											ifaceMetric,
											r.speedMbps ?? "",
											r.admin ?? "",
											r.oper ?? "",
											r.p95 ?? "",
											r.p99 ?? "",
											r.max ?? "",
											r.slopePerDay ?? "",
											r.forecastCrossingTs ?? "",
											r.samples ?? 0,
										]);
										downloadText(
											`capacity_interfaces_${deploymentId}_${windowLabel}_${ifaceMetric}.csv`,
											"text/csv",
											toCSV(headers, rows),
										);
									}}
									disabled={ifaceRows.length === 0}
								>
									Export CSV
								</Button>
								<Button
									variant="outline"
									onClick={() => setPickIfaceOpen(true)}
									disabled={inventory.isLoading || inventory.isError}
									title="Pick any interface from NQE inventory and load trend from Forward perf history"
								>
									Pick interface
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{groupBy !== "none" ? (
								<div className="space-y-2">
									<div className="text-xs text-muted-foreground">
										Group summary ({groupBy})
									</div>
									<DataTable
										columns={
											ifaceMetric.startsWith("util_")
												? ([
														{
															id: "group",
															header: "Group",
															cell: (r) => (
																<span className="font-mono text-xs">
																	{r.group}
																</span>
															),
															width: 220,
														},
														...(groupBy === "vrf"
															? ([
																	{
																		id: "routes",
																		header: "Routes (v4/v6)",
																		align: "right",
																		cell: (r: GroupSummaryRow) => (
																			<span className="text-xs tabular-nums">
																				{Number(r.ipv4RoutesSum ?? 0)}/
																				{Number(r.ipv6RoutesSum ?? 0)}
																			</span>
																		),
																		width: 130,
																	},
																	{
																		id: "bgp",
																		header: "BGP",
																		align: "right",
																		cell: (r: GroupSummaryRow) => (
																			<span className="text-xs tabular-nums">
																				{Number(r.bgpNeighbors ?? 0)} (
																				{Number(r.bgpEstablished ?? 0)})
																			</span>
																		),
																		width: 100,
																	},
																] as Array<DataTableColumn<GroupSummaryRow>>)
															: []),
														{
															id: "count",
															header: "Ifaces",
															align: "right",
															cell: (r) => (
																<span className="text-xs tabular-nums">
																	{r.count}
																</span>
															),
															width: 80,
														},
														{
															id: "speed",
															header: "Σ Speed (Gbps)",
															align: "right",
															cell: (r) => (
																<span className="text-xs tabular-nums">
																	{r.sumSpeedGbps !== undefined
																		? r.sumSpeedGbps.toFixed(1)
																		: "—"}
																</span>
															),
															width: 120,
														},
														{
															id: "p95sum",
															header: "Σ p95 (Gbps)",
															align: "right",
															cell: (r) => (
																<span className="text-xs tabular-nums">
																	{r.sumP95Gbps !== undefined
																		? r.sumP95Gbps.toFixed(2)
																		: "—"}
																</span>
															),
															width: 120,
														},
														{
															id: "maxsum",
															header: "Σ Max (Gbps)",
															align: "right",
															cell: (r) => (
																<span className="text-xs tabular-nums">
																	{r.sumMaxGbps !== undefined
																		? r.sumMaxGbps.toFixed(2)
																		: "—"}
																</span>
															),
															width: 120,
														},
														{
															id: "utilp95",
															header: "Util@p95",
															align: "right",
															cell: (r) => {
																const denom = Number(r.sumSpeedGbps ?? 0);
																const num = Number(r.sumP95Gbps ?? 0);
																if (!denom) {
																	return (
																		<span className="text-muted-foreground text-xs">
																			—
																		</span>
																	);
																}
																return (
																	<span className="text-xs tabular-nums">
																		{fmtPct01(num / denom)}
																	</span>
																);
															},
															width: 90,
														},
														{
															id: "utilmax",
															header: "Util@max",
															align: "right",
															cell: (r) => {
																const denom = Number(r.sumSpeedGbps ?? 0);
																const num = Number(r.sumMaxGbps ?? 0);
																if (!denom) {
																	return (
																		<span className="text-muted-foreground text-xs">
																			—
																		</span>
																	);
																}
																return (
																	<span className="text-xs tabular-nums">
																		{fmtPct01(num / denom)}
																	</span>
																);
															},
															width: 90,
														},
														{
															id: "headroom",
															header: "Headroom@85 (Gbps)",
															align: "right",
															cell: (r) => {
																const denom = Number(r.sumSpeedGbps ?? 0);
																const p95 = Number(r.sumP95Gbps ?? 0);
																if (!denom) {
																	return (
																		<span className="text-muted-foreground text-xs">
																			—
																		</span>
																	);
																}
																const head = Math.max(0, denom * 0.85 - p95);
																return (
																	<span className="text-xs tabular-nums">
																		{head.toFixed(2)}
																	</span>
																);
															},
															width: 150,
														},
														{
															id: "p95cov",
															header: "p95 cov",
															align: "right",
															cell: (r) => (
																<span className="text-xs tabular-nums">
																	{Number(r.p95Count ?? 0)}/{r.count}
																</span>
															),
															width: 90,
														},
														{
															id: "soonest",
															header: "Soonest",
															cell: (r) => (
																<span className="font-mono text-xs">
																	{r.soonestForecast
																		? r.soonestForecast.slice(0, 10)
																		: "—"}
																</span>
															),
															width: 110,
														},
													] as Array<DataTableColumn<GroupSummaryRow>>)
												: ([
														{
															id: "group",
															header: "Group",
															cell: (r) => (
																<span className="font-mono text-xs">
																	{r.group}
																</span>
															),
															width: 260,
														},
														{
															id: "count",
															header: "Count",
															align: "right",
															cell: (r) => (
																<span className="text-xs">{r.count}</span>
															),
															width: 90,
														},
														{
															id: "hot",
															header: "Hot",
															align: "right",
															cell: (r) => (
																<span className="text-xs">{r.hotCount}</span>
															),
															width: 90,
														},
														{
															id: "p95",
															header: "Max p95",
															align: "right",
															cell: (r) => fmtNum(r.maxP95),
															width: 100,
														},
													] as Array<DataTableColumn<GroupSummaryRow>>)
										}
										rows={ifaceGroupSummary}
										getRowId={(r) => r.group}
										onRowClick={(r) => {
											if (groupBy === "location") setLocationFilter(r.group);
											else if (groupBy === "tag")
												setTagFilter(r.group === "untagged" ? "all" : r.group);
											else if (groupBy === "group")
												setGroupFilter(
													r.group === "ungrouped" ? "all" : r.group,
												);
											else if (groupBy === "vrf")
												setVrfFilter(r.group === "unknown" ? "all" : r.group);
										}}
										emptyText="No groups."
										maxHeightClassName="max-h-[260px]"
										minWidthClassName="min-w-0"
									/>
								</div>
							) : null}

							{summary.isLoading ? (
								<div className="space-y-2">
									<Skeleton className="h-5 w-56" />
									<Skeleton className="h-32 w-full" />
								</div>
							) : summary.isError ? (
								<div className="text-destructive text-sm">
									Failed to load summary:{" "}
									{summary.error instanceof Error
										? summary.error.message
										: String(summary.error)}
								</div>
							) : (
								<DataTable
									columns={ifaceColumns}
									rows={ifaceRows}
									getRowId={(r) => r.id}
									onRowClick={(r) => setSelectedIface(r)}
									emptyText="No rollups for this window/metric yet. Click Refresh to enqueue."
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="devices" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<CardTitle className="text-base">Device Capacity</CardTitle>
							<div className="flex flex-col gap-2 md:flex-row md:items-center">
								<Input
									placeholder="Filter (device / vendor / os)…"
									value={deviceFilter}
									onChange={(e) => setDeviceFilter(e.target.value)}
									className="w-[260px]"
								/>
								<Select
									value={deviceMetric}
									onValueChange={(v) => setDeviceMetric(v as any)}
								>
									<SelectTrigger className="w-[220px]">
										<SelectValue placeholder="Metric" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="device_cpu">CPU</SelectItem>
										<SelectItem value="device_memory">Memory</SelectItem>
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									onClick={() => {
										const headers = [
											"device",
											"window",
											"metric",
											"vendor",
											"os",
											"model",
											"p95",
											"p99",
											"max",
											"slopePerDay",
											"forecastCrossingTs",
											"samples",
										];
										const rows = deviceRows.map((r) => [
											r.device,
											windowLabel,
											deviceMetric,
											r.vendor ?? "",
											r.os ?? "",
											r.model ?? "",
											r.p95 ?? "",
											r.p99 ?? "",
											r.max ?? "",
											r.slopePerDay ?? "",
											r.forecastCrossingTs ?? "",
											r.samples ?? 0,
										]);
										downloadText(
											`capacity_devices_${deploymentId}_${windowLabel}_${deviceMetric}.csv`,
											"text/csv",
											toCSV(headers, rows),
										);
									}}
									disabled={deviceRows.length === 0}
								>
									Export CSV
								</Button>
								<Button
									variant="outline"
									onClick={() => setPickDeviceOpen(true)}
									disabled={inventory.isLoading || inventory.isError}
									title="Pick any device from NQE inventory and load trend from Forward perf history"
								>
									Pick device
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{groupBy !== "none" ? (
								<div className="space-y-2">
									<div className="text-xs text-muted-foreground">
										Group summary ({groupBy})
									</div>
									<DataTable
										columns={[
											{
												id: "group",
												header: "Group",
												cell: (r) => (
													<span className="font-mono text-xs">{r.group}</span>
												),
												width: 260,
											},
											{
												id: "count",
												header: "Count",
												align: "right",
												cell: (r) => <span className="text-xs">{r.count}</span>,
												width: 90,
											},
											{
												id: "hot",
												header: "Hot",
												align: "right",
												cell: (r) => (
													<span className="text-xs">{r.hotCount}</span>
												),
												width: 90,
											},
											{
												id: "p95",
												header: "Max p95",
												align: "right",
												cell: (r) => fmtPct01(r.maxP95),
												width: 100,
											},
										]}
										rows={deviceGroupSummary}
										getRowId={(r) => r.group}
										emptyText="No groups."
										maxHeightClassName="max-h-[260px]"
										minWidthClassName="min-w-0"
									/>
								</div>
							) : null}

							{summary.isLoading ? (
								<div className="space-y-2">
									<Skeleton className="h-5 w-56" />
									<Skeleton className="h-32 w-full" />
								</div>
							) : summary.isError ? (
								<div className="text-destructive text-sm">
									Failed to load summary:{" "}
									{summary.error instanceof Error
										? summary.error.message
										: String(summary.error)}
								</div>
							) : (
								<DataTable
									columns={deviceColumns}
									rows={deviceRows}
									getRowId={(r) => r.id}
									onRowClick={(r) => setSelectedDevice(r)}
									emptyText="No rollups for this window/metric yet. Click Refresh to enqueue."
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="growth" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<CardTitle className="text-base">
								Growth (Delta vs Prior)
							</CardTitle>
							<div className="flex flex-wrap items-center gap-2">
								<Select
									value={String(compareHours)}
									onValueChange={(v) => setCompareHours(Number(v))}
								>
									<SelectTrigger className="w-[150px]">
										<SelectValue placeholder="Compare" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="24">24h</SelectItem>
										<SelectItem value={String(24 * 7)}>7d</SelectItem>
										<SelectItem value={String(24 * 30)}>30d</SelectItem>
										<SelectItem value={String(24 * 90)}>90d</SelectItem>
									</SelectContent>
								</Select>
								<div className="text-xs text-muted-foreground">
									As of{" "}
									<span className="font-mono">
										{ifaceGrowth.data?.asOf ??
											deviceGrowth.data?.asOf ??
											summary.data?.asOf ??
											"—"}
									</span>
									{" • "}
									Compared to{" "}
									<span className="font-mono">
										{ifaceGrowth.data?.compareAsOf ??
											deviceGrowth.data?.compareAsOf ??
											"—"}
									</span>
								</div>
							</div>
						</CardHeader>
						<CardContent className="text-sm text-muted-foreground">
							Top growers computed from Skyforge rollups (no Forward time-series
							pull). Use Refresh to enqueue rollup recomputation.
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<CardTitle className="text-base">Interfaces</CardTitle>
							<Select
								value={growthIfaceMetric}
								onValueChange={(v) => setGrowthIfaceMetric(v as any)}
							>
								<SelectTrigger className="w-[240px]">
									<SelectValue placeholder="Metric" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="util_ingress">
										Utilization (ingress)
									</SelectItem>
									<SelectItem value="util_egress">
										Utilization (egress)
									</SelectItem>
								</SelectContent>
							</Select>
						</CardHeader>
						<CardContent>
							{ifaceGrowth.isLoading ? (
								<Skeleton className="h-32 w-full" />
							) : ifaceGrowth.isError ? (
								<div className="text-destructive text-sm">
									Failed to load growth:{" "}
									{ifaceGrowth.error instanceof Error
										? ifaceGrowth.error.message
										: String(ifaceGrowth.error)}
								</div>
							) : (
								<DataTable
									columns={[
										{
											id: "device",
											header: "Device",
											cell: (r) => (
												<span className="font-mono text-xs">{r.device}</span>
											),
											width: 220,
										},
										{
											id: "iface",
											header: "Interface",
											cell: (r) => (
												<span className="font-mono text-xs">{r.iface}</span>
											),
											width: 220,
										},
										{
											id: "dir",
											header: "Dir",
											cell: (r) => <span className="text-xs">{r.dir}</span>,
											width: 90,
										},
										{
											id: "speed",
											header: "Speed",
											align: "right",
											cell: (r) => (
												<span className="text-xs">
													{fmtSpeedMbps(r.speedMbps ?? null)}
												</span>
											),
											width: 90,
										},
										{
											id: "nowP95",
											header: "Now p95",
											align: "right",
											cell: (r) => fmtPct01(r.nowP95),
											width: 100,
										},
										{
											id: "prevP95",
											header: "Prev p95",
											align: "right",
											cell: (r) => fmtPct01(r.prevP95 ?? undefined),
											width: 100,
										},
										{
											id: "deltaP95",
											header: "Δ p95",
											align: "right",
											cell: (r) => {
												const d = r.deltaP95;
												if (d === null || d === undefined)
													return (
														<span className="text-muted-foreground text-xs">
															—
														</span>
													);
												const hot = d > 0;
												return (
													<span
														className={
															hot
																? "text-foreground font-medium"
																: "text-muted-foreground"
														}
													>
														{d >= 0 ? "+" : ""}
														{fmtPct01(d)}
													</span>
												);
											},
											width: 90,
										},
										{
											id: "deltaGbps",
											header: "Δ p95 (Gbps)",
											align: "right",
											cell: (r) =>
												r.deltaP95Gbps !== null &&
												r.deltaP95Gbps !== undefined ? (
													<span className="text-xs">
														{r.deltaP95Gbps >= 0 ? "+" : ""}
														{r.deltaP95Gbps.toFixed(2)}
													</span>
												) : (
													<span className="text-muted-foreground text-xs">
														—
													</span>
												),
											width: 120,
										},
										{
											id: "forecast",
											header: "Forecast",
											cell: (r) => (
												<span className="font-mono text-xs">
													{r.nowForecast ? r.nowForecast.slice(0, 10) : "—"}
												</span>
											),
											width: 120,
										},
									]}
									rows={ifaceGrowthRows}
									getRowId={(r) => r.id}
									onRowClick={(r) => {
										setIfaceMetric(growthIfaceMetric as any);
										setSelectedIface({
											id: `${r.device}:${r.iface}:${r.dir}:growth`,
											device: r.device,
											iface: r.iface,
											dir: r.dir || "INGRESS",
											speedMbps: r.speedMbps ?? null,
											samples: 0,
										});
									}}
									emptyText="No growth rows yet. Click Refresh to enqueue."
								/>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<CardTitle className="text-base">Devices</CardTitle>
							<Select
								value={growthDeviceMetric}
								onValueChange={(v) => setGrowthDeviceMetric(v as any)}
							>
								<SelectTrigger className="w-[220px]">
									<SelectValue placeholder="Metric" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="device_cpu">CPU</SelectItem>
									<SelectItem value="device_memory">Memory</SelectItem>
								</SelectContent>
							</Select>
						</CardHeader>
						<CardContent>
							{deviceGrowth.isLoading ? (
								<Skeleton className="h-32 w-full" />
							) : deviceGrowth.isError ? (
								<div className="text-destructive text-sm">
									Failed to load growth:{" "}
									{deviceGrowth.error instanceof Error
										? deviceGrowth.error.message
										: String(deviceGrowth.error)}
								</div>
							) : (
								<DataTable
									columns={[
										{
											id: "device",
											header: "Device",
											cell: (r) => (
												<span className="font-mono text-xs">{r.device}</span>
											),
											width: 240,
										},
										{
											id: "meta",
											header: "Meta",
											cell: (r) => (
												<div className="text-xs text-muted-foreground">
													<div>
														{[r.vendor, r.os].filter(Boolean).join(" • ") ||
															"—"}
													</div>
													<div className="font-mono">{r.model || ""}</div>
												</div>
											),
											width: 240,
										},
										{
											id: "nowP95",
											header: "Now p95",
											align: "right",
											cell: (r) => fmtPct01(r.nowP95),
											width: 100,
										},
										{
											id: "prevP95",
											header: "Prev p95",
											align: "right",
											cell: (r) => fmtPct01(r.prevP95 ?? undefined),
											width: 100,
										},
										{
											id: "deltaP95",
											header: "Δ p95",
											align: "right",
											cell: (r) => {
												const d = r.deltaP95;
												if (d === null || d === undefined)
													return (
														<span className="text-muted-foreground text-xs">
															—
														</span>
													);
												const hot = d > 0;
												return (
													<span
														className={
															hot
																? "text-foreground font-medium"
																: "text-muted-foreground"
														}
													>
														{d >= 0 ? "+" : ""}
														{fmtPct01(d)}
													</span>
												);
											},
											width: 90,
										},
										{
											id: "forecast",
											header: "Forecast",
											cell: (r) => (
												<span className="font-mono text-xs">
													{r.nowForecast ? r.nowForecast.slice(0, 10) : "—"}
												</span>
											),
											width: 120,
										},
									]}
									rows={deviceGrowthRows}
									getRowId={(r) => r.id}
									onRowClick={(r) => {
										setDeviceMetric(growthDeviceMetric as any);
										setSelectedDevice({
											id: `${r.device}:growth`,
											device: r.device,
											metric: growthDeviceMetric,
											vendor: r.vendor,
											os: r.os,
											model: r.model,
											samples: 0,
										});
									}}
									emptyText="No growth rows yet. Click Refresh to enqueue."
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="routing" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								VRF Summary (Perf + Scale)
							</CardTitle>
						</CardHeader>
						<CardContent>
							{inventory.isLoading ? (
								<Skeleton className="h-28 w-full" />
							) : inventory.isError ? (
								<div className="text-destructive text-sm">
									Failed to load inventory:{" "}
									{inventory.error instanceof Error
										? inventory.error.message
										: String(inventory.error)}
								</div>
							) : (
								<DataTable
									columns={[
										{
											id: "device",
											header: "Device",
											cell: (r) => (
												<span className="font-mono text-xs">
													{r.deviceName}
												</span>
											),
											width: 240,
										},
										{
											id: "vrf",
											header: "VRF",
											cell: (r) => (
												<span className="font-mono text-xs">{r.vrf}</span>
											),
											width: 180,
										},
										{
											id: "v4",
											header: "IPv4",
											align: "right",
											cell: (r) => (
												<span className="text-xs tabular-nums">
													{r.ipv4Routes}
												</span>
											),
											width: 90,
										},
										{
											id: "v6",
											header: "IPv6",
											align: "right",
											cell: (r) => (
												<span className="text-xs tabular-nums">
													{r.ipv6Routes}
												</span>
											),
											width: 90,
										},
										{
											id: "bgp",
											header: "BGP",
											align: "right",
											cell: (r) => (
												<span className="text-xs tabular-nums">
													{r.bgpNeighbors} ({r.bgpEstablished})
												</span>
											),
											width: 110,
										},
										{
											id: "max",
											header: "Max util",
											align: "right",
											cell: (r) => fmtPct01(r.maxIfaceMax),
											width: 100,
										},
										{
											id: "forecast",
											header: "Soonest",
											cell: (r) => (
												<span className="font-mono text-xs">
													{r.soonestForecast
														? r.soonestForecast.slice(0, 10)
														: "—"}
												</span>
											),
											width: 120,
										},
									]}
									rows={vrfSummaryRows}
									getRowId={(r) => r.id}
									onRowClick={(r) => {
										setRoutingDeviceFilter(r.deviceName);
										setRoutingVrfFilter(r.vrf);
										setVrfFilter(r.vrf);
									}}
									emptyText="No VRF summary available yet. Click Refresh to enqueue."
									maxHeightClassName="max-h-[360px]"
									minWidthClassName="min-w-0"
								/>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
							<CardTitle className="text-base">
								Hardware Capacity (TCAM)
							</CardTitle>
							<div className="text-xs text-muted-foreground">
								Derived from Forward CUSTOM command outputs. Configure a TCAM
								command collection to populate.
							</div>
						</CardHeader>
						<CardContent>
							{inventory.isLoading ? (
								<Skeleton className="h-28 w-full" />
							) : inventory.isError ? (
								<div className="text-destructive text-sm">
									Failed to load inventory:{" "}
									{inventory.error instanceof Error
										? inventory.error.message
										: String(inventory.error)}
								</div>
							) : (
								<DataTable
									columns={[
										{
											id: "device",
											header: "Device",
											cell: (r) => (
												<span className="font-mono text-xs">
													{r.deviceName}
												</span>
											),
											width: 240,
										},
										{
											id: "meta",
											header: "Meta",
											cell: (r) => (
												<div className="text-xs text-muted-foreground">
													<div>
														{[r.vendor ?? "", r.os ?? ""]
															.filter(Boolean)
															.join(" • ") || "—"}
													</div>
													<div className="font-mono">
														{String(r.model ?? "")}
													</div>
												</div>
											),
											width: 240,
										},
										{
											id: "used",
											header: "Used",
											align: "right",
											cell: (r) => (
												<span className="text-xs tabular-nums">
													{Number(r.tcamUsed ?? 0)}
												</span>
											),
											width: 90,
										},
										{
											id: "total",
											header: "Total",
											align: "right",
											cell: (r) => (
												<span className="text-xs tabular-nums">
													{Number(r.tcamTotal ?? 0)}
												</span>
											),
											width: 90,
										},
										{
											id: "util",
											header: "Util",
											align: "right",
											cell: (r) => {
												const used = Number(r.tcamUsed ?? 0);
												const tot = Number(r.tcamTotal ?? 0);
												if (!tot)
													return (
														<span className="text-muted-foreground text-xs">
															—
														</span>
													);
												return (
													<span className="text-xs">
														{fmtPct01(used / tot)}
													</span>
												);
											},
											width: 90,
										},
										{
											id: "cmd",
											header: "Command",
											cell: (r) => (
												<span className="font-mono text-xs">
													{String(r.commandText ?? "").slice(0, 48) || "—"}
												</span>
											),
											width: 260,
										},
										{
											id: "evidence",
											header: "Evidence",
											cell: (r) => (
												<span className="font-mono text-xs text-muted-foreground">
													{String(r.evidence ?? "").slice(0, 60) || "—"}
												</span>
											),
											width: 320,
										},
									]}
									rows={filteredHardwareTcam}
									getRowId={(r) => r.deviceName}
									onRowClick={(r) => {
										setRoutingDeviceFilter(r.deviceName);
										const txt = [
											`device: ${String(r.deviceName ?? "")}`,
											`command: ${String(r.commandText ?? "")}`,
											`used/total: ${Number(r.tcamUsed ?? 0)}/${Number(r.tcamTotal ?? 0)}`,
											"",
											String(r.evidence ?? ""),
										].join("\n");
										setTcamDialogText(txt);
										setTcamDialogOpen(true);
									}}
									emptyText="No TCAM rows cached yet. Click Refresh after enabling custom commands."
									maxHeightClassName="max-h-[320px]"
									minWidthClassName="min-w-0"
								/>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<CardTitle className="text-base">Routing Scale</CardTitle>
							<div className="flex flex-wrap items-center gap-2">
								<Select
									value={routingDeviceFilter}
									onValueChange={setRoutingDeviceFilter}
								>
									<SelectTrigger className="w-[220px]">
										<SelectValue placeholder="Device" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All devices</SelectItem>
										{routingOptions.devices.map((d) => (
											<SelectItem key={d} value={d}>
												{d}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select
									value={routingVrfFilter}
									onValueChange={setRoutingVrfFilter}
								>
									<SelectTrigger className="w-[170px]">
										<SelectValue placeholder="VRF" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All VRFs</SelectItem>
										{routingOptions.vrfs.map((v) => (
											<SelectItem key={v} value={v}>
												{v}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									onClick={() => {
										setRoutingDeviceFilter("all");
										setRoutingVrfFilter("all");
									}}
									disabled={
										routingDeviceFilter === "all" && routingVrfFilter === "all"
									}
								>
									Clear
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{inventory.isLoading ? (
								<Skeleton className="h-28 w-full" />
							) : inventory.isError ? (
								<div className="text-destructive text-sm">
									Failed to load inventory:{" "}
									{inventory.error instanceof Error
										? inventory.error.message
										: String(inventory.error)}
								</div>
							) : (
								<DataTable
									columns={[
										{
											id: "device",
											header: "Device",
											cell: (r) => (
												<span className="font-mono text-xs">
													{r.deviceName}
												</span>
											),
											width: 240,
										},
										{
											id: "vrf",
											header: "VRF",
											cell: (r) => (
												<span className="font-mono text-xs">{r.vrf}</span>
											),
											width: 180,
										},
										{
											id: "v4",
											header: "IPv4",
											align: "right",
											cell: (r) => (
												<span className="text-xs">{r.ipv4Routes}</span>
											),
											width: 90,
										},
										{
											id: "v6",
											header: "IPv6",
											align: "right",
											cell: (r) => (
												<span className="text-xs">{r.ipv6Routes}</span>
											),
											width: 90,
										},
									]}
									rows={filteredRouteScale}
									getRowId={(r) => `${r.deviceName}:${r.vrf}`}
									emptyText="No routing scale cached yet. Click Refresh to enqueue."
								/>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">BGP Neighbors</CardTitle>
						</CardHeader>
						<CardContent>
							{inventory.isLoading ? (
								<Skeleton className="h-28 w-full" />
							) : inventory.isError ? (
								<div className="text-destructive text-sm">
									Failed to load inventory:{" "}
									{inventory.error instanceof Error
										? inventory.error.message
										: String(inventory.error)}
								</div>
							) : (
								<DataTable
									columns={[
										{
											id: "device",
											header: "Device",
											cell: (r) => (
												<span className="font-mono text-xs">
													{r.deviceName}
												</span>
											),
											width: 220,
										},
										{
											id: "vrf",
											header: "VRF",
											cell: (r) => (
												<span className="font-mono text-xs">{r.vrf}</span>
											),
											width: 160,
										},
										{
											id: "nbr",
											header: "Neighbor",
											cell: (r) => (
												<span className="font-mono text-xs">
													{r.neighborAddress}
												</span>
											),
											width: 220,
										},
										{
											id: "state",
											header: "State",
											cell: (r) => (
												<span className="text-xs">{r.sessionState ?? "—"}</span>
											),
											width: 120,
										},
										{
											id: "rx",
											header: "Rx",
											align: "right",
											cell: (r) => (
												<span className="text-xs">
													{r.receivedPrefixes ?? "—"}
												</span>
											),
											width: 90,
										},
										{
											id: "tx",
											header: "Tx",
											align: "right",
											cell: (r) => (
												<span className="text-xs">
													{r.advertisedPrefixes ?? "—"}
												</span>
											),
											width: 90,
										},
									]}
									rows={filteredBgpNeighbors}
									getRowId={(r) =>
										`${r.deviceName}:${r.vrf}:${r.neighborAddress}`
									}
									emptyText="No BGP cache yet. Click Refresh to enqueue."
								/>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="health" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<CardTitle className="text-base">Health Issues</CardTitle>
							<Button
								variant="outline"
								onClick={() => loadUnhealthyDevices.mutate()}
								disabled={loadUnhealthyDevices.isPending}
							>
								{loadUnhealthyDevices.isPending
									? "Loading…"
									: "Load unhealthy devices"}
							</Button>
						</CardHeader>
						<CardContent className="space-y-2">
							{unhealthyDevices ? (
								<pre className="max-h-[60vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
									{jsonPretty(unhealthyDevices)}
								</pre>
							) : (
								<div className="text-sm text-muted-foreground">
									Loads Forward health signals (including high utilization)
									around the latest processed snapshot.
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="raw" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Raw Rollups</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{summary.isLoading ? (
								<Skeleton className="h-32 w-full" />
							) : summary.isError ? (
								<div className="text-destructive text-sm">
									{summary.error instanceof Error
										? summary.error.message
										: String(summary.error)}
								</div>
							) : (
								<pre className="max-h-[65vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
									{jsonPretty(summary.data?.rollups ?? [])}
								</pre>
							)}
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Raw Inventory</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{inventory.isLoading ? (
								<Skeleton className="h-32 w-full" />
							) : inventory.isError ? (
								<div className="text-destructive text-sm">
									{inventory.error instanceof Error
										? inventory.error.message
										: String(inventory.error)}
								</div>
							) : (
								<pre className="max-h-[65vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
									{jsonPretty(inventory.data ?? {})}
								</pre>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<Dialog
				open={Boolean(selectedIface)}
				onOpenChange={(v) => !v && setSelectedIface(null)}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle className="text-base">Interface Trend</DialogTitle>
					</DialogHeader>
					{selectedIface ? (
						<div className="space-y-3">
							<div className="text-sm">
								<span className="font-mono text-xs">
									{selectedIface.device} {selectedIface.iface}{" "}
									{selectedIface.dir}
								</span>{" "}
								<Badge variant="outline" className="ml-2">
									{windowLabel}
								</Badge>
								<Badge variant="secondary" className="ml-2">
									{ifaceMetric}
								</Badge>
								<Select
									value={selectedIface.dir}
									onValueChange={(v) =>
										setSelectedIface((cur) =>
											cur ? { ...cur, dir: String(v) } : cur,
										)
									}
								>
									<SelectTrigger className="ml-2 inline-flex h-7 w-[140px]">
										<SelectValue placeholder="Direction" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="INGRESS">INGRESS</SelectItem>
										<SelectItem value="EGRESS">EGRESS</SelectItem>
									</SelectContent>
								</Select>
								{selectedIface.vrf || selectedIface.vrfNames?.length ? (
									<div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
										<Badge variant="outline" className="font-mono text-xs">
											VRF
										</Badge>
										<span className="font-mono text-xs">
											{selectedIface.vrf ??
												(selectedIface.vrfNames ?? []).slice(0, 3).join(", ")}
											{(selectedIface.vrfNames ?? []).length > 3 ? "…" : ""}
										</span>
										<Button
											variant="outline"
											className="h-7 px-2"
											onClick={() => {
												setRoutingDeviceFilter(selectedIface.device);
												const v =
													selectedIface.vrf ??
													selectedIface.vrfNames?.[0] ??
													"all";
												setRoutingVrfFilter(v);
											}}
											title="Filter Routing/BGP tables to this device/VRF"
										>
											Filter routing
										</Button>
									</div>
								) : null}
							</div>
							{ifaceHistory.isLoading ? (
								<Skeleton className="h-24 w-full" />
							) : ifaceHistory.isError ? (
								<div className="text-sm text-destructive">
									Failed to load history
								</div>
							) : (
								<SimpleLineChart points={ifacePoints} />
							)}
							{(() => {
								const vrfs = selectedIface.vrfNames?.length
									? selectedIface.vrfNames
									: selectedIface.vrf
										? [selectedIface.vrf]
										: [];
								if (!vrfs.length) return null;
								const rs = (inventory.data?.routeScale ?? []).filter(
									(r) =>
										r.deviceName === selectedIface.device &&
										vrfs.includes(r.vrf),
								);
								const bgp = (inventory.data?.bgpNeighbors ?? []).filter(
									(r) =>
										r.deviceName === selectedIface.device &&
										vrfs.includes(r.vrf),
								);
								const v4 = rs.reduce(
									(acc, r) => acc + Number(r.ipv4Routes ?? 0),
									0,
								);
								const v6 = rs.reduce(
									(acc, r) => acc + Number(r.ipv6Routes ?? 0),
									0,
								);
								const up = bgp.filter((n) =>
									String(n.sessionState ?? "")
										.toUpperCase()
										.includes("ESTABLISHED"),
								).length;
								return (
									<div className="rounded-md border bg-muted/20 p-3 text-xs">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<div className="text-muted-foreground">
												Routing context for{" "}
												<span className="font-mono">
													{vrfs.slice(0, 3).join(", ")}
												</span>
												{vrfs.length > 3 ? "…" : ""}
											</div>
											<Button
												variant="outline"
												className="h-7 px-2"
												onClick={() => {
													setRoutingDeviceFilter(selectedIface.device);
													setRoutingVrfFilter(vrfs[0] ?? "all");
												}}
											>
												View in Routing tab
											</Button>
										</div>
										<div className="mt-2 grid grid-cols-2 gap-2">
											<div>
												FIB routes (sum):{" "}
												<span className="font-mono">
													v4={v4} v6={v6}
												</span>
											</div>
											<div className="text-right">
												BGP neighbors:{" "}
												<span className="font-mono">
													{bgp.length} ({up} established)
												</span>
											</div>
										</div>
									</div>
								);
							})()}
							<div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
								<div>
									p95:{" "}
									{ifaceMetric.startsWith("util_")
										? fmtPct01(
												selectedIface.p95 ?? ifaceComputed.p95 ?? undefined,
											)
										: fmtNum(
												selectedIface.p95 ?? ifaceComputed.p95 ?? undefined,
											)}
								</div>
								<div className="text-right">
									max:{" "}
									{ifaceMetric.startsWith("util_")
										? fmtPct01(
												selectedIface.max ?? ifaceComputed.max ?? undefined,
											)
										: fmtNum(
												selectedIface.max ?? ifaceComputed.max ?? undefined,
											)}
								</div>
								<div>
									slope/day:{" "}
									{ifaceMetric.startsWith("util_")
										? fmtPct01(selectedIface.slopePerDay)
										: fmtNum(selectedIface.slopePerDay)}
								</div>
								<div className="text-right">
									forecast:{" "}
									<span className="font-mono">
										{selectedIface.forecastCrossingTs ?? "—"}
									</span>
								</div>
								<div>
									speed: {fmtSpeedMbps(selectedIface.speedMbps ?? null)}
								</div>
								<div className="text-right">
									p95 (Gbps): {(() => {
										if (!ifaceMetric.startsWith("util_")) return "—";
										const speed = Number(selectedIface.speedMbps ?? 0);
										const p95 = Number(
											selectedIface.p95 ?? ifaceComputed.p95 ?? Number.NaN,
										);
										if (!speed || !Number.isFinite(p95)) return "—";
										return ((p95 * speed) / 1000).toFixed(2);
									})()}
								</div>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>

			<Dialog
				open={Boolean(selectedDevice)}
				onOpenChange={(v) => !v && setSelectedDevice(null)}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle className="text-base">Device Trend</DialogTitle>
					</DialogHeader>
					{selectedDevice ? (
						<div className="space-y-3">
							<div className="text-sm">
								<span className="font-mono text-xs">
									{selectedDevice.device}
								</span>{" "}
								<Badge variant="outline" className="ml-2">
									{windowLabel}
								</Badge>
								<Badge variant="secondary" className="ml-2">
									{deviceMetric}
								</Badge>
							</div>
							{deviceHistory.isLoading ? (
								<Skeleton className="h-24 w-full" />
							) : deviceHistory.isError ? (
								<div className="text-sm text-destructive">
									Failed to load history
								</div>
							) : (
								<SimpleLineChart points={devicePoints} />
							)}
							<div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
								<div>
									p95:{" "}
									{fmtPct01(
										selectedDevice.p95 ?? deviceComputed.p95 ?? undefined,
									)}
								</div>
								<div className="text-right">
									max:{" "}
									{fmtPct01(
										selectedDevice.max ?? deviceComputed.max ?? undefined,
									)}
								</div>
								<div>slope/day: {fmtPct01(selectedDevice.slopePerDay)}</div>
								<div className="text-right">
									forecast:{" "}
									<span className="font-mono">
										{selectedDevice.forecastCrossingTs ?? "—"}
									</span>
								</div>
							</div>
						</div>
					) : null}
				</DialogContent>
			</Dialog>

			<Dialog
				open={pickIfaceOpen}
				onOpenChange={(v) => !v && setPickIfaceOpen(false)}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="text-base">Pick Interface</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Input
							placeholder="Search device/interface…"
							value={pickIfaceQuery}
							onChange={(e) => setPickIfaceQuery(e.target.value)}
						/>
						<div className="max-h-[55vh] overflow-auto rounded-md border">
							{(() => {
								const all = inventory.data?.interfaces ?? [];
								const q = pickIfaceQuery.trim().toLowerCase();
								const filtered = q
									? all.filter((r) => {
											const dn = String(r.deviceName ?? "").toLowerCase();
											const iname = String(r.interfaceName ?? "").toLowerCase();
											return dn.includes(q) || iname.includes(q);
										})
									: all;
								const limited = filtered.slice(0, 200);
								if (!limited.length) {
									return (
										<div className="p-4 text-sm text-muted-foreground">
											No matches.
										</div>
									);
								}
								return (
									<div className="divide-y">
										{limited.map((r) => {
											const dn = String(r.deviceName ?? "");
											const iname = String(r.interfaceName ?? "");
											const speed = fmtSpeedMbps(r.speedMbps ?? null);
											return (
												<button
													type="button"
													key={`${dn}:${iname}`}
													className="w-full px-3 py-2 text-left hover:bg-muted/40"
													onClick={() => {
														setSelectedIface({
															id: `${dn}:${iname}:INGRESS:pick`,
															device: dn,
															iface: iname,
															dir: "INGRESS",
															speedMbps: r.speedMbps ?? null,
															admin: r.adminStatus ?? undefined,
															oper: r.operStatus ?? undefined,
															samples: 0,
														});
														setPickIfaceOpen(false);
													}}
												>
													<div className="flex items-center justify-between gap-3">
														<div className="font-mono text-xs">
															{dn} {iname}
														</div>
														<div className="text-xs text-muted-foreground">
															{speed}
														</div>
													</div>
												</button>
											);
										})}
									</div>
								);
							})()}
						</div>
						<div className="text-xs text-muted-foreground">
							Loads a trend directly from Forward perf history (not limited to
							the top-50 rollups).
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={tcamDialogOpen}
				onOpenChange={(v) => !v && setTcamDialogOpen(false)}
			>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle className="text-base">TCAM Evidence</DialogTitle>
					</DialogHeader>
					<pre className="max-h-[70vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
						{tcamDialogText || "—"}
					</pre>
				</DialogContent>
			</Dialog>

			<Dialog
				open={pickDeviceOpen}
				onOpenChange={(v) => !v && setPickDeviceOpen(false)}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle className="text-base">Pick Device</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Input
							placeholder="Search device…"
							value={pickDeviceQuery}
							onChange={(e) => setPickDeviceQuery(e.target.value)}
						/>
						<div className="max-h-[55vh] overflow-auto rounded-md border">
							{(() => {
								const all = inventory.data?.devices ?? [];
								const q = pickDeviceQuery.trim().toLowerCase();
								const filtered = q
									? all.filter((r) => {
											const dn = String(r.deviceName ?? "").toLowerCase();
											const vendor = String(r.vendor ?? "").toLowerCase();
											const os = String(r.os ?? "").toLowerCase();
											return (
												dn.includes(q) || vendor.includes(q) || os.includes(q)
											);
										})
									: all;
								const limited = filtered.slice(0, 200);
								if (!limited.length) {
									return (
										<div className="p-4 text-sm text-muted-foreground">
											No matches.
										</div>
									);
								}
								return (
									<div className="divide-y">
										{limited.map((r) => {
											const dn = String(r.deviceName ?? "");
											return (
												<button
													type="button"
													key={dn}
													className="w-full px-3 py-2 text-left hover:bg-muted/40"
													onClick={() => {
														setSelectedDevice({
															id: `${dn}:pick`,
															device: dn,
															metric: deviceMetric,
															vendor: r.vendor ?? undefined,
															os: r.os ?? undefined,
															model: r.model ?? undefined,
															samples: 0,
														});
														setPickDeviceOpen(false);
													}}
												>
													<div className="flex items-center justify-between gap-3">
														<div className="font-mono text-xs">{dn}</div>
														<div className="text-xs text-muted-foreground">
															{[r.vendor ?? "", r.os ?? ""]
																.filter(Boolean)
																.join(" • ") || "—"}
														</div>
													</div>
												</button>
											);
										})}
									</div>
								);
							})()}
						</div>
						<div className="text-xs text-muted-foreground">
							Loads a trend directly from Forward perf history.
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
