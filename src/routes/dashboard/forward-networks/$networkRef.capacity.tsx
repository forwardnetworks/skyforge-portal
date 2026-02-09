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
	type CapacityPathSearchQuery,
	type ForwardNetworkCapacityCoverageResponse,
	type ForwardNetworkCapacityInventoryResponse,
	type ForwardNetworkCapacityPathHop,
	type ForwardNetworkCapacityPathBottlenecksResponse,
	type ForwardNetworkCapacitySnapshotDeltaResponse,
	type ForwardNetworkCapacityUpgradeCandidate,
	type ForwardNetworkCapacityUpgradeCandidatesResponse,
	getForwardNetworkCapacityCoverage,
	getForwardNetworkCapacityGrowth,
	getForwardNetworkCapacityInventory,
	getForwardNetworkCapacitySnapshotDelta,
	getForwardNetworkCapacitySummary,
	getForwardNetworkCapacityUnhealthyDevices,
	getForwardNetworkCapacityUpgradeCandidates,
	listUserForwardNetworks,
	listWorkspaceForwardNetworks,
	postForwardNetworkCapacityPathBottlenecks,
	postForwardNetworkCapacityDeviceMetricsHistory,
	postForwardNetworkCapacityInterfaceMetricsHistory,
	refreshForwardNetworkCapacityRollups,
} from "@/lib/skyforge-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
	workspace: z.string().optional().catch(""),
	embed: z.string().optional().catch(""),
});

export const Route = createFileRoute(
	"/dashboard/forward-networks/$networkRef/capacity",
)({
	validateSearch: (search) => searchSchema.parse(search),
	component: ForwardNetworkCapacityPage,
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

async function copyToClipboard(text: string): Promise<boolean> {
	try {
		if (
			typeof navigator !== "undefined" &&
			navigator.clipboard &&
			typeof navigator.clipboard.writeText === "function"
		) {
			await navigator.clipboard.writeText(text);
			return true;
		}
	} catch {
		// ignore
	}
	return false;
}

function randomId(): string {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const c = (globalThis as any).crypto;
		if (c && typeof c.randomUUID === "function") return c.randomUUID();
	} catch {
		// ignore
	}
	return `id_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
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

function protoLabel(protoNum: unknown): string {
	const n = Number(protoNum ?? NaN);
	if (!Number.isFinite(n)) return "";
	if (n === 6) return "tcp";
	if (n === 17) return "udp";
	if (n === 1) return "icmp";
	return String(n);
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

function normalizeIfaceForJoin(name: string): string {
	let s = String(name ?? "")
		.trim()
		.toLowerCase();
	if (!s) return "";
	s = s.replaceAll(" ", "");
	const repl: Array<[string, string]> = [
		["port-channel", "po"],
		["portchannel", "po"],
		["bundle-ether", "be"],
		["bundleether", "be"],
		["gigabitethernet", "gi"],
		["tengigabitethernet", "te"],
		["twentyfivegigabitethernet", "twe"],
		["fortygigabitethernet", "fo"],
		["hundredgigabitethernet", "hu"],
		["tengige", "te"],
		["twentyfivegige", "twe"],
		["fortygige", "fo"],
		["hundredgige", "hu"],
		["twohundredgige", "twohu"],
		["fourhundredgige", "fourhu"],
		["managementethernet", "mgmt"],
		["mgmtethernet", "mgmt"],
		["management", "mgmt"],
		["fastethernet", "fa"],
		["ethernet", "eth"],
		["loopback", "lo"],
		["vlan", "vl"],
	];
	for (const [from, to] of repl) {
		if (s.startsWith(from)) {
			s = to + s.slice(from.length);
			break;
		}
	}
	if (s.endsWith(".0")) s = s.slice(0, -2);
	return s;
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

function parseCapacityPathQueries(text: string): {
	queries: CapacityPathSearchQuery[];
	error?: string;
} {
	const raw = String(text ?? "").trim();
	if (!raw)
		return { queries: [], error: "Enter at least one flow or JSON payload." };

	if (raw.startsWith("{") || raw.startsWith("[")) {
		try {
			const parsed = JSON.parse(raw) as any;
			if (Array.isArray(parsed)) {
				const queries = parsed as CapacityPathSearchQuery[];
				return {
					queries: queries.filter((q) => String(q?.dstIp ?? "").trim()),
				};
			}
			if (parsed && Array.isArray(parsed.queries)) {
				const queries = parsed.queries as CapacityPathSearchQuery[];
				return {
					queries: queries.filter((q) => String(q?.dstIp ?? "").trim()),
				};
			}
			return {
				queries: [],
				error:
					"JSON must be an array of queries or an object with { queries: [...] }.",
			};
		} catch (e) {
			return {
				queries: [],
				error:
					e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON.",
			};
		}
	}

	const queries: CapacityPathSearchQuery[] = [];
	for (const line0 of raw.split(/\r?\n/g)) {
		const line = line0.trim();
		if (!line || line.startsWith("#")) continue;

		// Accept common formats:
		// - "srcIp dstIp tcp 443"
		// - "srcIp:srcPort -> dstIp:dstPort tcp"
		// - "dstIp" or "dstIp:dstPort" or "dstIp tcp/443"
		// - CSV-ish: "srcIp,dstIp,tcp,443"
		const cleaned = line.replaceAll("\t", " ").replaceAll("->", " ");
		const csvish = cleaned.includes(",") && !cleaned.includes(" ");
		const parts = (
			csvish ? cleaned.split(",") : cleaned.replaceAll(",", " ").split(/\s+/g)
		)
			.map((p) => p.trim())
			.filter(Boolean);
		if (!parts.length) continue;

		const splitHostPort = (s: string): { host: string; port?: string } => {
			const v = String(s ?? "").trim();
			// Very basic: "ip:port" (do not attempt to parse IPv6 bracket forms for now).
			const m = v.match(/^([^:]+):([^:]+)$/);
			if (!m) return { host: v };
			return { host: m[1]!, port: m[2]! };
		};

		if (parts.length === 1) {
			const hp = splitHostPort(parts[0]!);
			const q: CapacityPathSearchQuery = { dstIp: hp.host };
			if (hp.port) q.dstPort = hp.port;
			queries.push(q);
			continue;
		}

		let srcHp: { host: string; port?: string } | null = null;
		let dstHp: { host: string; port?: string } | null = null;

		// Identify src/dst tokens with optional ports.
		// If the first token looks like a bare dst (no src), allow "-" or "*" placeholders.
		const t0 = parts[0]!;
		const t1 = parts[1]!;
		if (t0 === "-" || t0 === "*" || t0.toLowerCase() === "any") {
			dstHp = splitHostPort(t1);
		} else {
			srcHp = splitHostPort(t0);
			dstHp = splitHostPort(t1);
		}

		let ipProto: number | undefined;
		let dstPort: string | undefined = dstHp?.port;
		let srcPort: string | undefined = srcHp?.port;

		const parseProto = (tok: string) => {
			const p = String(tok ?? "")
				.trim()
				.toLowerCase();
			if (!p) return;
			if (p.includes("/")) {
				const [pp, port] = p.split("/", 2);
				if (pp === "tcp") ipProto = 6;
				else if (pp === "udp") ipProto = 17;
				else if (pp === "icmp") ipProto = 1;
				else if (/^\d+$/.test(pp)) ipProto = Number(pp);
				if (port) dstPort = port;
				return;
			}
			if (p === "tcp") ipProto = 6;
			else if (p === "udp") ipProto = 17;
			else if (p === "icmp") ipProto = 1;
			else if (/^\d+$/.test(p)) ipProto = Number(p);
			else if (/^\d+(-\d+)?$/.test(p)) dstPort = p;
		};

		parseProto(parts[2] ?? "");
		// Allow explicit dstPort after proto
		if (parts[3]) dstPort = String(parts[3]).trim() || dstPort;

		const q: CapacityPathSearchQuery = { dstIp: dstHp?.host ?? "" };
		if (srcHp?.host) q.srcIp = srcHp.host;
		if (srcPort) q.srcPort = srcPort;
		if (ipProto !== undefined && Number.isFinite(ipProto)) q.ipProto = ipProto;
		if (dstPort) q.dstPort = dstPort;

		if (String(q.dstIp ?? "").trim()) queries.push(q);
	}

	if (!queries.length) {
		return {
			queries: [],
			error:
				"No valid flows parsed. Try JSON or lines like: 10.0.0.1 10.0.0.2 tcp 443",
		};
	}
	return { queries };
}

type SavedPathBatch = {
	id: string;
	name: string;
	text: string;
	createdAt: string;
};

type PathBottleneckSummaryRow = {
	id: string;
	deviceName: string;
	interfaceName: string;
	direction: string;
	count: number;
	minHeadroomGbps?: number;
	minHeadroomUtil?: number;
	worstMaxUtil?: number;
	soonestForecast?: string;
};

type PathsUpgradeImpactRow = {
	id: string;
	deviceName: string;
	interfaceName: string;
	direction: string;
	flows: number;
	minHeadroomGbps?: number;
	minHeadroomUtil?: number;
	recommendedSpeedMbps?: number | null;
	requiredSpeedMbps?: number | null;
	reason?: string;
};

type PathsUpgradeImpactFlowRow = {
	id: string;
	index: number;
	src: string;
	dst: string;
	proto: string;
	port: string;
	outcome: string;
	headroomGbps?: number | null;
	headroomUtil?: number | null;
	forwardQueryUrl?: string;
};

type PathsPlanSimItem = {
	index: number;
	beforeHeadroomGbps?: number | null;
	beforeHeadroomUtil?: number | null;
	afterHeadroomGbps?: number | null;
	afterHeadroomUtil?: number | null;
	appliedUpgradeId?: string;
	appliedSpeedMbps?: number;
	reason?: string;
};

type PathsPlanSimSummary = {
	totalFlows: number;
	withBottleneck: number;
	simulated: number;
	cannotSimulate: number;
	atRiskBefore: number;
	atRiskAfter: number;
	improved: number;
};

function storageKeyPathBatches(
	workspaceId: string,
	networkRef: string,
): string {
	return `skyforge:capacity:path-batches:${encodeURIComponent(workspaceId)}:${encodeURIComponent(networkRef)}`;
}

function loadSavedPathBatches(
	workspaceId: string,
	networkRef: string,
): SavedPathBatch[] {
	try {
		const raw = localStorage.getItem(
			storageKeyPathBatches(workspaceId, networkRef),
		);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as any;
		if (!Array.isArray(parsed)) return [];
		return parsed
			.map((v) => ({
				id: String(v?.id ?? "").trim(),
				name: String(v?.name ?? "").trim(),
				text: String(v?.text ?? ""),
				createdAt: String(v?.createdAt ?? "").trim(),
			}))
			.filter((b) => b.id && b.name && b.text);
	} catch {
		return [];
	}
}

function savePathBatches(
	workspaceId: string,
	networkRef: string,
	batches: SavedPathBatch[],
) {
	try {
		localStorage.setItem(
			storageKeyPathBatches(workspaceId, networkRef),
			JSON.stringify(batches),
		);
	} catch {
		// ignore
	}
}

type InterfaceRow = {
	id: string;
	device: string;
	iface: string;
	dir: string;
	aggregateId?: string;
	isAggregate?: boolean;
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

function ForwardNetworkCapacityPage() {
	const { networkRef } = Route.useParams();
	const { workspace, embed } = Route.useSearch();
	const embedded =
		String(embed ?? "").trim() === "1" ||
		String(embed ?? "")
			.trim()
			.toLowerCase() === "true";
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
	const [planFilter, setPlanFilter] = useState("");
	const [lagDialogOpen, setLagDialogOpen] = useState(false);
	const [lagDialog, setLagDialog] = useState<{
		deviceName: string;
		lagName: string;
		totalSpeedMbps?: number;
		members: Array<{
			interfaceName: string;
			speedMbps?: number;
			worstDirection?: string;
			p95Util?: number;
			maxUtil?: number;
			forecast?: string;
		}>;
	} | null>(null);

	const [pathsInput, setPathsInput] = useState("");
	const [pathsSnapshotId, setPathsSnapshotId] = useState("");
	const [pathsIncludeHops, setPathsIncludeHops] = useState(false);
	const [pathsDemoMode, setPathsDemoMode] = useState(false);
	const [pathsResult, setPathsResult] =
		useState<ForwardNetworkCapacityPathBottlenecksResponse | null>(null);
	const [pathsBatchName, setPathsBatchName] = useState("");
	const [savedPathBatches, setSavedPathBatches] = useState<SavedPathBatch[]>(
		[],
	);
	const [pathsHopsDialogOpen, setPathsHopsDialogOpen] = useState(false);
	const [pathsHopsDialog, setPathsHopsDialog] = useState<{
		title: string;
		hops: ForwardNetworkCapacityPathHop[];
	} | null>(null);
	const [pathsCoverageDialogOpen, setPathsCoverageDialogOpen] = useState(false);
	const [pathsPayloadDialogOpen, setPathsPayloadDialogOpen] = useState(false);
	const [pathsUpgradeDialogOpen, setPathsUpgradeDialogOpen] = useState(false);
	const [pathsUpgradeDialog, setPathsUpgradeDialog] = useState<{
		title: string;
		upgrade: PathsUpgradeImpactRow;
		flows: PathsUpgradeImpactFlowRow[];
	} | null>(null);
	const [pathsWhyDialogOpen, setPathsWhyDialogOpen] = useState(false);
	const [pathsWhyDialog, setPathsWhyDialog] = useState<{
		title: string;
		unmatched: string[];
		notesText: string;
		forwardQueryUrl?: string;
	} | null>(null);
	const [pathsPlanSelected, setPathsPlanSelected] = useState<string[]>([]);

	const workspaceId = String(workspace ?? "").trim();

	useEffect(() => {
		if (!workspaceId || !networkRef) return;
		setSavedPathBatches(loadSavedPathBatches(workspaceId, networkRef));
	}, [workspaceId, networkRef]);

	const networksQ = useQuery({
		queryKey: queryKeys.workspaceForwardNetworks(workspaceId),
		queryFn: () => listWorkspaceForwardNetworks(workspaceId),
		enabled: Boolean(workspaceId),
		retry: false,
		staleTime: 30_000,
	});

	const userNetworksQ = useQuery({
		queryKey: queryKeys.userForwardNetworks(),
		queryFn: listUserForwardNetworks,
		retry: false,
		staleTime: 30_000,
	});

	const networkName = useMemo(() => {
		const ns = (networksQ.data?.networks ?? []) as any[];
		const us = (userNetworksQ.data?.networks ?? []) as any[];
		const hit =
			ns.find((n) => String(n?.id ?? "") === String(networkRef)) ??
			us.find((n) => String(n?.id ?? "") === String(networkRef));
		return String(hit?.name ?? "");
	}, [networksQ.data?.networks, userNetworksQ.data?.networks, networkRef]);

	const summary = useQuery({
		queryKey: queryKeys.forwardNetworkCapacitySummary(workspaceId, networkRef),
		queryFn: () => getForwardNetworkCapacitySummary(workspaceId, networkRef),
		enabled: Boolean(workspaceId && networkRef),
		retry: false,
		staleTime: 30_000,
	});

	const inventory = useQuery<ForwardNetworkCapacityInventoryResponse>({
		queryKey: queryKeys.forwardNetworkCapacityInventory(
			workspaceId,
			networkRef,
		),
		queryFn: () => getForwardNetworkCapacityInventory(workspaceId, networkRef),
		enabled: Boolean(workspaceId && networkRef),
		retry: false,
		staleTime: 30_000,
	});

	const coverage = useQuery<ForwardNetworkCapacityCoverageResponse>({
		queryKey: queryKeys.forwardNetworkCapacityCoverage(workspaceId, networkRef),
		queryFn: () => getForwardNetworkCapacityCoverage(workspaceId, networkRef),
		enabled: Boolean(workspaceId && networkRef),
		retry: false,
		staleTime: 30_000,
	});

	const snapshotDelta = useQuery<ForwardNetworkCapacitySnapshotDeltaResponse>({
		queryKey: queryKeys.forwardNetworkCapacitySnapshotDelta(
			workspaceId,
			networkRef,
		),
		queryFn: () =>
			getForwardNetworkCapacitySnapshotDelta(workspaceId, networkRef),
		enabled: Boolean(workspaceId && networkRef),
		retry: false,
		staleTime: 30_000,
	});

	const upgradeCandidates =
		useQuery<ForwardNetworkCapacityUpgradeCandidatesResponse>({
			queryKey: queryKeys.forwardNetworkCapacityUpgradeCandidates(
				workspaceId,
				networkRef,
				windowLabel,
			),
			queryFn: () =>
				getForwardNetworkCapacityUpgradeCandidates(workspaceId, networkRef, {
					window: windowLabel,
				}),
			enabled: Boolean(workspaceId && networkRef),
			retry: false,
			staleTime: 30_000,
		});

	const forwardNetworkId = String(
		summary.data?.forwardNetworkId ?? inventory.data?.forwardNetworkId ?? "",
	);

	const ifaceInvIndex = useMemo(() => {
		const m = new Map<
			string,
			{ aggregateId?: string; interfaceType?: string }
		>();
		for (const r of inventory.data?.interfaces ?? []) {
			const dev = String(r.deviceName ?? "").trim();
			const ifn = String(r.interfaceName ?? "").trim();
			if (!dev || !ifn) continue;
			const agg = String(r.aggregateId ?? "").trim();
			const typ = String(r.interfaceType ?? "").trim();
			m.set(`${dev}|${ifn}`, {
				aggregateId: agg || undefined,
				interfaceType: typ || undefined,
			});
		}
		return m;
	}, [inventory.data?.interfaces]);

	const lagImbalanceRows = useMemo(() => {
		const ifaces = inventory.data?.interfaces ?? [];
		const rollups = summary.data?.rollups ?? [];

		const speedByKey = new Map<string, number>();
		for (const r of ifaces) {
			const dev = String(r.deviceName ?? "").trim();
			const ifn = String(r.interfaceName ?? "").trim();
			if (!dev || !ifn) continue;
			const sp = Number(r.speedMbps ?? 0);
			if (sp > 0) speedByKey.set(`${dev}|${ifn}`, sp);
		}

		const groups = new Map<
			string,
			{ deviceName: string; lagName: string; members: Set<string> }
		>();

		const addMember = (deviceName: string, lagName: string, member: string) => {
			const dev = String(deviceName ?? "").trim();
			const lag = String(lagName ?? "").trim();
			const mem = String(member ?? "").trim();
			if (!dev || !lag || !mem) return;
			const k = `${dev}|${lag}`;
			const g = groups.get(k) ?? {
				deviceName: dev,
				lagName: lag,
				members: new Set<string>(),
			};
			g.members.add(mem);
			groups.set(k, g);
		};

		for (const r of ifaces) {
			const dev = String(r.deviceName ?? "").trim();
			const ifn = String(r.interfaceName ?? "").trim();
			if (!dev || !ifn) continue;

			const aggId = String(r.aggregateId ?? "").trim();
			if (aggId) addMember(dev, aggId, ifn);

			const mems =
				(r.aggregationConfiguredMemberNames?.length
					? r.aggregationConfiguredMemberNames
					: r.aggregationMemberNames) ?? [];
			for (const m of mems) addMember(dev, ifn, String(m ?? "").trim());
		}

		const utilByKey = new Map<
			string,
			{
				maxUtil: number;
				p95Util: number;
				worstDirection: string;
				speedMbps?: number;
				forecast?: string;
			}
		>();

		for (const r of rollups as any[]) {
			if (String(r?.objectType ?? "") !== "interface") continue;
			if (String(r?.window ?? "") !== windowLabel) continue;
			const metric = String(r?.metric ?? "");
			if (metric !== "util_ingress" && metric !== "util_egress") continue;

			const det = (r?.details ?? {}) as any;
			let dev = String(det?.deviceName ?? "").trim();
			let ifn = String(det?.interfaceName ?? "").trim();
			let dir = String(det?.direction ?? "").trim();
			if (!dev || !ifn) {
				const parts = String(r?.objectId ?? "").split(":");
				dev = String(parts[0] ?? "").trim();
				ifn = String(parts[1] ?? "").trim();
				if (!dir) dir = String(parts[2] ?? "").trim();
			}
			if (!dev || !ifn) continue;

			const k = `${dev}|${ifn}`;
			const maxUtil = Number(r?.max ?? 0);
			const p95Util = Number(r?.p95 ?? 0);
			const speedMbps = Number(det?.speedMbps ?? 0) || speedByKey.get(k);
			const forecast = String(r?.forecastCrossingTs ?? "").trim();
			const dirNorm =
				String(dir || (metric === "util_egress" ? "EGRESS" : "INGRESS"))
					.toUpperCase()
					.trim() || "—";

			const prev = utilByKey.get(k);
			if (!prev || maxUtil > prev.maxUtil) {
				utilByKey.set(k, {
					maxUtil,
					p95Util,
					worstDirection: dirNorm,
					speedMbps: speedMbps || undefined,
					forecast: forecast || undefined,
				});
			}
		}

		const rows: Array<{
			id: string;
			deviceName: string;
			lagName: string;
			memberCount: number;
			totalSpeedMbps?: number;
			worstMemberMaxUtil?: number;
			spread?: number;
			hotMembers?: number;
			soonestForecast?: string;
			members: Array<{
				interfaceName: string;
				speedMbps?: number;
				worstDirection?: string;
				p95Util?: number;
				maxUtil?: number;
				forecast?: string;
			}>;
		}> = [];

		for (const g of groups.values()) {
			const members = Array.from(g.members).filter(Boolean).sort();
			if (members.length < 2) continue;

			const memberRows = members.map((m) => {
				const k = `${g.deviceName}|${m}`;
				const u = utilByKey.get(k);
				return {
					interfaceName: m,
					speedMbps: speedByKey.get(k) || u?.speedMbps,
					worstDirection: u?.worstDirection,
					p95Util: u?.p95Util,
					maxUtil: u?.maxUtil,
					forecast: u?.forecast,
				};
			});

			const maxes = memberRows
				.map((r) => Number(r.maxUtil ?? 0))
				.filter((n) => Number.isFinite(n));
			if (!maxes.length) continue;
			const worst = Math.max(...maxes);
			const sorted = [...maxes].sort((a, b) => a - b);
			const median = sorted[Math.floor(sorted.length / 2)];
			const spread = worst - median;

			const hotMembers = memberRows.filter(
				(r) => Number(r.maxUtil ?? 0) >= 0.85,
			).length;

			let soonestForecast = "";
			for (const r of memberRows) {
				const f = String(r.forecast ?? "").trim();
				if (!f) continue;
				if (!soonestForecast || f < soonestForecast) soonestForecast = f;
			}

			const totalSpeedMbps = memberRows.reduce(
				(acc, r) => acc + Number(r.speedMbps ?? 0),
				0,
			);

			// Keep it a high-signal showcase list.
			if (!(worst >= 0.85 || spread >= 0.25)) continue;

			rows.push({
				id: `${g.deviceName}|${g.lagName}`,
				deviceName: g.deviceName,
				lagName: g.lagName,
				memberCount: members.length,
				totalSpeedMbps: totalSpeedMbps || undefined,
				worstMemberMaxUtil: worst,
				spread,
				hotMembers,
				soonestForecast: soonestForecast || undefined,
				members: memberRows,
			});
		}

		rows.sort((a, b) => {
			const aw = Number(a.worstMemberMaxUtil ?? 0);
			const bw = Number(b.worstMemberMaxUtil ?? 0);
			if (aw !== bw) return bw - aw;
			const as = Number(a.spread ?? 0);
			const bs = Number(b.spread ?? 0);
			if (as !== bs) return bs - as;
			if (a.deviceName !== b.deviceName)
				return a.deviceName.localeCompare(b.deviceName);
			return a.lagName.localeCompare(b.lagName);
		});

		return rows.slice(0, 50);
	}, [inventory.data?.interfaces, summary.data?.rollups, windowLabel]);

	const refresh = useMutation({
		mutationFn: async () => {
			if (!workspaceId) throw new Error("workspace not found");
			return refreshForwardNetworkCapacityRollups(workspaceId, networkRef);
		},
		onSuccess: async (resp) => {
			toast.success("Refresh queued", {
				description: `Run ${String(resp.run?.id ?? "")}`.trim(),
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.forwardNetworkCapacitySummary(
					workspaceId,
					networkRef,
				),
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.forwardNetworkCapacityInventory(
					workspaceId,
					networkRef,
				),
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.forwardNetworkCapacityCoverage(
					workspaceId,
					networkRef,
				),
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.forwardNetworkCapacitySnapshotDelta(
					workspaceId,
					networkRef,
				),
			});
			await qc.invalidateQueries({
				queryKey: [
					"forwardNetworkCapacityUpgradeCandidates",
					workspaceId,
					networkRef,
				],
			});
			await qc.invalidateQueries({
				queryKey:
					queryKeys.workspaceForwardNetworkCapacityPortfolio(workspaceId),
			});
			await qc.invalidateQueries({
				// Prefix match for all growth queries for this forward network.
				queryKey: ["forwardNetworkCapacityGrowth", workspaceId, networkRef],
			});
		},
		onError: (e) =>
			toast.error("Failed to refresh", { description: (e as Error).message }),
	});

	const loadUnhealthyDevices = useMutation({
		mutationFn: async () => {
			return getForwardNetworkCapacityUnhealthyDevices(
				workspaceId,
				networkRef,
				{},
			);
		},
		onSuccess: (resp) => setUnhealthyDevices(resp.body),
		onError: (e) =>
			toast.error("Failed to load unhealthy devices", {
				description: (e as Error).message,
			}),
	});

	const runPathBottlenecks = useMutation({
		mutationFn: async (body: {
			window: "24h" | "7d" | "30d";
			snapshotId?: string;
			includeHops?: boolean;
			queries: CapacityPathSearchQuery[];
		}) => {
			if (!workspaceId) throw new Error("workspace not found");
			return postForwardNetworkCapacityPathBottlenecks(
				workspaceId,
				networkRef,
				body,
			);
		},
		onSuccess: (resp) => setPathsResult(resp),
		onError: (e) =>
			toast.error("Failed to compute paths", {
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

	const pathsParsed = useMemo(
		() => parseCapacityPathQueries(pathsInput),
		[pathsInput],
	);
	const forwardPathsBulkPayloadPreview = useMemo(() => {
		if (pathsParsed.error || !pathsParsed.queries.length) return "";
		const snapshotId = pathsSnapshotId.trim();
		const body = {
			queries: pathsParsed.queries,
			intent: "PREFER_DELIVERED",
			maxCandidates: 5000,
			maxResults: 1,
			maxReturnPathResults: 0,
			maxSeconds: 30,
			maxOverallSeconds: 300,
			includeTags: false,
			includeNetworkFunctions: false,
		};
		return jsonPretty({
			method: "POST",
			path: `/networks/${forwardNetworkId || "{networkId}"}/paths-bulk`,
			query: snapshotId ? { snapshotId } : {},
			body,
		});
	}, [
		pathsParsed.error,
		pathsParsed.queries,
		pathsSnapshotId,
		forwardNetworkId,
	]);

	const pathsSummaryRows = useMemo((): PathBottleneckSummaryRow[] => {
		const items = pathsResult?.items ?? [];
		const m = new Map<string, PathBottleneckSummaryRow>();
		for (const it of items) {
			const b = (it as any)?.bottleneck ?? null;
			if (!b) continue;
			const key = `${String(b.deviceName ?? "")}|${String(b.interfaceName ?? "")}|${String(b.direction ?? "")}`;
			const row = m.get(key) ?? {
				id: key,
				deviceName: String(b.deviceName ?? ""),
				interfaceName: String(b.interfaceName ?? ""),
				direction: String(b.direction ?? ""),
				count: 0,
			};
			row.count += 1;

			const h = Number(b.headroomGbps ?? NaN);
			if (Number.isFinite(h)) {
				if (row.minHeadroomGbps === undefined) row.minHeadroomGbps = h;
				else row.minHeadroomGbps = Math.min(row.minHeadroomGbps, h);
			}
			const hu = Number((b as any).headroomUtil ?? NaN);
			if (Number.isFinite(hu)) {
				if (row.minHeadroomUtil === undefined) row.minHeadroomUtil = hu;
				else row.minHeadroomUtil = Math.min(row.minHeadroomUtil, hu);
			}

			const mu = Number(b.maxUtil ?? NaN);
			if (Number.isFinite(mu)) {
				if (row.worstMaxUtil === undefined) row.worstMaxUtil = mu;
				else row.worstMaxUtil = Math.max(row.worstMaxUtil, mu);
			}

			const ts = String(b.forecastCrossingTs ?? "").trim();
			if (ts) {
				if (!row.soonestForecast) row.soonestForecast = ts;
				else if (Date.parse(ts) < Date.parse(row.soonestForecast))
					row.soonestForecast = ts;
			}

			m.set(key, row);
		}
		const rows = Array.from(m.values());
		rows.sort((a, b) => {
			if (a.count !== b.count) return b.count - a.count;
			const ah = a.minHeadroomGbps ?? Number.POSITIVE_INFINITY;
			const bh = b.minHeadroomGbps ?? Number.POSITIVE_INFINITY;
			if (ah !== bh) return ah - bh;
			const au = a.minHeadroomUtil ?? Number.POSITIVE_INFINITY;
			const bu = b.minHeadroomUtil ?? Number.POSITIVE_INFINITY;
			if (au !== bu) return au - bu;
			return a.id.localeCompare(b.id);
		});
		return rows;
	}, [pathsResult?.items]);

	const pathsUpgradeImpactRows = useMemo((): PathsUpgradeImpactRow[] => {
		const cands = (upgradeCandidates.data?.items ??
			[]) as ForwardNetworkCapacityUpgradeCandidate[];
		if (!pathsSummaryRows.length || !cands.length) return [];

		const index = new Map<string, ForwardNetworkCapacityUpgradeCandidate>();
		for (const c of cands) {
			const dev = String(c.device ?? "").trim();
			const ifn = String(c.name ?? "").trim();
			const dir = String(c.worstDirection ?? "")
				.trim()
				.toUpperCase();
			if (!dev || !ifn) continue;
			const k = `${dev.toLowerCase()}|${normalizeIfaceForJoin(ifn)}|${dir}`;
			if (!index.has(k)) index.set(k, c);
		}

		const rows: PathsUpgradeImpactRow[] = [];
		for (const r of pathsSummaryRows) {
			const dev = String(r.deviceName ?? "").trim();
			const ifn = String(r.interfaceName ?? "").trim();
			const dir = String(r.direction ?? "")
				.trim()
				.toUpperCase();
			if (!dev || !ifn) continue;
			const k = `${dev.toLowerCase()}|${normalizeIfaceForJoin(ifn)}|${dir}`;
			const c = index.get(k);
			if (!c) continue;
			rows.push({
				id: k,
				deviceName: dev,
				interfaceName: ifn,
				direction: dir || String(c.worstDirection ?? "").trim(),
				flows: r.count,
				minHeadroomGbps: r.minHeadroomGbps,
				minHeadroomUtil: r.minHeadroomUtil,
				recommendedSpeedMbps: c.recommendedSpeedMbps ?? null,
				requiredSpeedMbps: c.requiredSpeedMbps ?? null,
				reason: String(c.reason ?? "").trim() || undefined,
			});
		}

		rows.sort((a, b) => {
			if (a.flows !== b.flows) return b.flows - a.flows;
			const ah = a.minHeadroomGbps ?? Number.POSITIVE_INFINITY;
			const bh = b.minHeadroomGbps ?? Number.POSITIVE_INFINITY;
			if (ah !== bh) return ah - bh;
			const au = a.minHeadroomUtil ?? Number.POSITIVE_INFINITY;
			const bu = b.minHeadroomUtil ?? Number.POSITIVE_INFINITY;
			if (au !== bu) return au - bu;
			return a.id.localeCompare(b.id);
		});
		return rows;
	}, [pathsSummaryRows, upgradeCandidates.data?.items]);

	useEffect(() => {
		// Auto-select top upgrades for convenience in demos, but do not override an existing selection.
		if (pathsPlanSelected.length) return;
		if (!pathsUpgradeImpactRows.length) return;
		setPathsPlanSelected(pathsUpgradeImpactRows.slice(0, 3).map((r) => r.id));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathsUpgradeImpactRows.length]);

	const pathsPlanSim = useMemo((): {
		summary: PathsPlanSimSummary;
		items: PathsPlanSimItem[];
	} => {
		const items = pathsResult?.items ?? [];
		const sel = new Set(pathsPlanSelected);
		const upgrades = new Map<string, PathsUpgradeImpactRow>();
		for (const u of pathsUpgradeImpactRows) upgrades.set(u.id, u);

		const out: PathsPlanSimItem[] = [];
		let withBottleneck = 0;
		let simulated = 0;
		let cannotSimulate = 0;
		let atRiskBefore = 0;
		let atRiskAfter = 0;
		let improved = 0;

		for (const it of items) {
			const b = it.bottleneck ?? null;
			const beforeGbps = b?.headroomGbps ?? null;
			const beforeHu = (b as any)?.headroomUtil ?? null;
			const row: PathsPlanSimItem = {
				index: it.index,
				beforeHeadroomGbps: beforeGbps,
				beforeHeadroomUtil: beforeHu,
				afterHeadroomGbps: beforeGbps,
				afterHeadroomUtil: beforeHu,
			};
			if (b) withBottleneck += 1;
			const beforeRisk = Number(beforeHu ?? NaN);
			if (Number.isFinite(beforeRisk) && beforeRisk < 0) atRiskBefore += 1;

			if (!b) {
				out.push(row);
				continue;
			}

			const dev = String(b.deviceName ?? "")
				.trim()
				.toLowerCase();
			const ifn = normalizeIfaceForJoin(String(b.interfaceName ?? ""));
			const dir = String(b.direction ?? "")
				.trim()
				.toUpperCase();
			const id = `${dev}|${ifn}|${dir}`;
			if (!sel.has(id)) {
				out.push(row);
				const afterRisk = Number(row.afterHeadroomUtil ?? NaN);
				if (Number.isFinite(afterRisk) && afterRisk < 0) atRiskAfter += 1;
				continue;
			}

			const u = upgrades.get(id);
			const newSpeed = Number(
				u?.recommendedSpeedMbps ?? u?.requiredSpeedMbps ?? NaN,
			);
			const thr = Number((b as any)?.threshold ?? 0.85);
			const speed = Number((b as any)?.speedMbps ?? NaN);
			const p95Gbps = Number((b as any)?.p95Gbps ?? NaN);
			const p95Util = Number((b as any)?.p95Util ?? NaN);

			if (!Number.isFinite(newSpeed) || newSpeed <= 0) {
				row.reason = "upgrade missing recommended speed";
				cannotSimulate += 1;
				out.push(row);
				const afterRisk = Number(row.afterHeadroomUtil ?? NaN);
				if (Number.isFinite(afterRisk) && afterRisk < 0) atRiskAfter += 1;
				continue;
			}

			// Approximation: assume traffic (Gbps) stays constant; utilization changes inversely with speed.
			let trafficGbps = Number.NaN;
			if (Number.isFinite(p95Gbps)) trafficGbps = p95Gbps;
			else if (
				Number.isFinite(p95Util) &&
				Number.isFinite(speed) &&
				speed > 0
			) {
				trafficGbps = (p95Util * speed) / 1000.0;
			}
			if (!Number.isFinite(trafficGbps)) {
				row.reason = "missing speed/util (cannot estimate traffic)";
				cannotSimulate += 1;
				out.push(row);
				const afterRisk = Number(row.afterHeadroomUtil ?? NaN);
				if (Number.isFinite(afterRisk) && afterRisk < 0) atRiskAfter += 1;
				continue;
			}

			const newSpeedGbps = newSpeed / 1000.0;
			const newUtil =
				newSpeedGbps > 0 ? trafficGbps / newSpeedGbps : Number.NaN;
			const newHeadroomUtil = thr - newUtil;
			const newHeadroomGbps = thr * newSpeedGbps - trafficGbps;

			row.afterHeadroomUtil = Number.isFinite(newHeadroomUtil)
				? newHeadroomUtil
				: row.afterHeadroomUtil;
			row.afterHeadroomGbps = Number.isFinite(newHeadroomGbps)
				? newHeadroomGbps
				: row.afterHeadroomGbps;
			row.appliedUpgradeId = id;
			row.appliedSpeedMbps = newSpeed;
			row.reason = "simulated using constant traffic (p95)";
			simulated += 1;

			const afterRisk = Number(row.afterHeadroomUtil ?? NaN);
			if (Number.isFinite(afterRisk) && afterRisk < 0) atRiskAfter += 1;

			const b0 = Number(beforeHu ?? NaN);
			if (Number.isFinite(b0) && Number.isFinite(afterRisk) && afterRisk > b0)
				improved += 1;

			out.push(row);
		}

		return {
			summary: {
				totalFlows: items.length,
				withBottleneck,
				simulated,
				cannotSimulate,
				atRiskBefore,
				atRiskAfter,
				improved,
			},
			items: out,
		};
	}, [pathsResult?.items, pathsPlanSelected, pathsUpgradeImpactRows]);

	const pathsBatchReportMarkdown = useMemo(() => {
		if (!pathsResult) return "";
		const lines: string[] = [];
		const netLabel = networkName
			? `${networkName} (${networkRef})`
			: networkRef;
		lines.push(`# Capacity Memo (Art of the Possible)`);
		lines.push("");
		lines.push(`- Network: \`${netLabel}\``);
		lines.push(`- Forward Network ID: \`${forwardNetworkId || "—"}\``);
		lines.push(`- Window: \`${windowLabel}\``);
		lines.push(`- Paths snapshot: \`${pathsResult.snapshotId || "latest"}\``);
		lines.push(
			`- Rollups as-of: \`${summary.data?.asOf ?? "—"}\`${summary.data?.stale ? " (stale)" : ""}`,
		);
		lines.push(`- Inventory as-of: \`${inventory.data?.asOf ?? "—"}\``);
		lines.push("");
		lines.push(`## Guardrails / Non-Goals`);
		lines.push("");
		lines.push(
			`- This is capacity-only. No alerting/on-call, no ticketing, no event correlation.`,
		);
		lines.push(
			`- This does not replicate Forward path workflows; each flow links back to Forward for deeper analysis.`,
		);
		lines.push("");
		lines.push(`## Coverage`);
		lines.push("");
		if (pathsResult.coverage) {
			const c = pathsResult.coverage;
			lines.push(`- hop-keys: ${c.hopInterfaceKeys}`);
			lines.push(`- rollup matched: ${c.rollupMatched}`);
			lines.push(`- perf fallback used: ${c.perfFallbackUsed}`);
			lines.push(`- unknown: ${c.unknown}`);
			lines.push(`- fallback truncated: ${c.truncated ? "yes" : "no"}`);
			lines.push("");
			if ((c.unmatchedHopInterfacesSample ?? []).length) {
				lines.push(`Unmatched hop interfaces (sample):`);
				lines.push("```");
				for (const s of c.unmatchedHopInterfacesSample ?? [])
					lines.push(String(s));
				lines.push("```");
				lines.push("");
			}
		} else {
			lines.push(`- (no coverage data)`);
			lines.push("");
		}
		lines.push(`## Top Bottlenecks (Batch)`);
		lines.push("");
		lines.push(
			`| device | interface | dir | flows | min headroom | soonest forecast |`,
		);
		lines.push(`|---|---|---:|---:|---:|---:|`);
		for (const r of pathsSummaryRows.slice(0, 20)) {
			const headroom =
				r.minHeadroomGbps !== undefined
					? `${Number(r.minHeadroomGbps).toFixed(2)}G`
					: r.minHeadroomUtil !== undefined
						? `${fmtPct01(Number(r.minHeadroomUtil))} util`
						: "—";
			lines.push(
				`| \`${r.deviceName}\` | \`${r.interfaceName}\` | \`${r.direction}\` | ${r.count} | ${headroom} | \`${(r.soonestForecast ?? "").slice(0, 10) || "—"}\` |`,
			);
		}
		lines.push("");

		if (pathsUpgradeImpactRows.length) {
			lines.push(`## Implied Upgrades (From This Batch)`);
			lines.push("");
			lines.push(`| device | interface | dir | flows | rec | reason |`);
			lines.push(`|---|---|---:|---:|---:|---|`);
			for (const r of pathsUpgradeImpactRows.slice(0, 10)) {
				lines.push(
					`| \`${r.deviceName}\` | \`${r.interfaceName}\` | \`${r.direction}\` | ${r.flows} | \`${fmtSpeedMbps(r.recommendedSpeedMbps)}\` | ${r.reason ? `\`${r.reason}\`` : "—"} |`,
				);
			}
			lines.push("");
		}

		lines.push(`## Notes`);
		lines.push("");
		lines.push(
			`- Forward paths are computed against a (possibly older) snapshot; perf/rollups are time-windowed and may reflect more recent utilization.`,
		);
		lines.push(
			`- Unknown coverage usually indicates missing rollups and/or missing perf for hop interfaces; use Coverage details to see samples.`,
		);
		lines.push("");

		return lines.join("\n");
	}, [
		pathsResult,
		pathsSummaryRows,
		pathsUpgradeImpactRows,
		networkName,
		networkRef,
		forwardNetworkId,
		windowLabel,
		summary.data?.asOf,
		summary.data?.stale,
		inventory.data?.asOf,
	]);

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
				const aggregateId = inv?.aggregateId;
				const isAggregate = inv?.interfaceType === "IF_AGGREGATE";
				const id = `${device}:${iface}:${dir}:${r.metric}:${r.window}`;
				return {
					id,
					device,
					iface,
					dir,
					aggregateId,
					isAggregate,
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
			workspaceId,
			networkRef,
			windowLabel,
			ifaceMetric,
			selectedIface?.id ?? "",
		],
		queryFn: async () => {
			if (!selectedIface) return null;
			const typ = metricToInterfaceType(ifaceMetric);
			const resp = await postForwardNetworkCapacityInterfaceMetricsHistory(
				workspaceId,
				networkRef,
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
		enabled: Boolean(selectedIface && workspaceId && forwardNetworkId),
		retry: false,
		staleTime: 10_000,
	});

	const deviceHistory = useQuery({
		queryKey: [
			"capacityDeviceHistory",
			workspaceId,
			networkRef,
			windowLabel,
			deviceMetric,
			selectedDevice?.id ?? "",
		],
		queryFn: async () => {
			if (!selectedDevice) return null;
			const typ = metricToDeviceType(deviceMetric);
			const resp = await postForwardNetworkCapacityDeviceMetricsHistory(
				workspaceId,
				networkRef,
				{
					type: typ,
					days: windowDays,
					maxSamples: 400,
					devices: [selectedDevice.device],
				},
			);
			return resp.body as any;
		},
		enabled: Boolean(selectedDevice && workspaceId && forwardNetworkId),
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
				id: "lag",
				header: "LAG",
				cell: (r) => {
					if (r.isAggregate) {
						return <Badge variant="secondary">aggregate</Badge>;
					}
					if (r.aggregateId) {
						return (
							<span className="font-mono text-xs text-muted-foreground">
								{r.aggregateId}
							</span>
						);
					}
					return <span className="text-muted-foreground text-xs">—</span>;
				},
				width: 170,
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
		queryKey: queryKeys.forwardNetworkCapacityGrowth(
			workspaceId,
			networkRef,
			windowLabel,
			growthIfaceMetric,
			compareHours,
			"interface",
		),
		queryFn: () =>
			getForwardNetworkCapacityGrowth(workspaceId, networkRef, {
				metric: growthIfaceMetric,
				window: windowLabel,
				objectType: "interface",
				compareHours,
				limit: 50,
			}),
		enabled: Boolean(workspaceId && networkRef && forwardNetworkId),
		retry: false,
		staleTime: 30_000,
	});

	const deviceGrowth = useQuery({
		queryKey: queryKeys.forwardNetworkCapacityGrowth(
			workspaceId,
			networkRef,
			windowLabel,
			growthDeviceMetric,
			compareHours,
			"device",
		),
		queryFn: () =>
			getForwardNetworkCapacityGrowth(workspaceId, networkRef, {
				metric: growthDeviceMetric,
				window: windowLabel,
				objectType: "device",
				compareHours,
				limit: 50,
			}),
		enabled: Boolean(workspaceId && networkRef && forwardNetworkId),
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

	if (!workspaceId) {
		return (
			<div className={embedded ? "space-y-6" : "space-y-6 p-6"}>
				{!embedded ? (
					<div className="flex items-center gap-3">
						<Link
							to="/dashboard/forward-networks"
							search={{ workspace: "" } as any}
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
				) : null}
				<Card>
					<CardContent className="pt-6 text-sm text-muted-foreground">
						Workspace is required.
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className={embedded ? "space-y-6" : "space-y-6 p-6 pb-20"}>
			{!embedded ? (
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="flex items-center gap-3">
						<Link
							to="/dashboard/forward-networks"
							search={{ workspace: workspaceId } as any}
							className={buttonVariants({
								variant: "outline",
								size: "icon",
								className: "h-9 w-9",
							})}
							title="Back to Forward networks"
						>
							<ArrowLeft className="h-4 w-4" />
						</Link>
						<div>
							<h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
								<TrendingUp className="h-5 w-5" /> Capacity
							</h1>
							<p className="text-sm text-muted-foreground mt-1">
								Forward network:{" "}
								<span className="font-medium">{networkName || networkRef}</span>
								{forwardNetworkId ? (
									<span className="ml-2 font-mono text-xs">
										{forwardNetworkId}
									</span>
								) : null}
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
							disabled={refresh.isPending || !forwardNetworkId}
							title={
								!forwardNetworkId
									? "Load the saved Forward network first"
									: "Enqueue a background rollup task"
							}
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							{refresh.isPending ? "Queueing…" : "Refresh"}
						</Button>
					</div>
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Coverage</CardTitle>
					</CardHeader>
					<CardContent className="text-sm space-y-1">
						{(() => {
							const c = coverage.data;
							const pct = (num: number, den: number) => {
								if (!den) return "—";
								return `${((num / den) * 100).toFixed(0)}%`;
							};
							const ifacePct = c ? pct(c.ifacesWithSpeed, c.ifacesTotal) : "—";
							const rollupDen = c
								? c.rollupsInterfaceTotal + c.rollupsDeviceTotal
								: 0;
							const rollupPct = c ? pct(c.rollupsWithSamples, rollupDen) : "—";
							return (
								<div className="space-y-2">
									<div className="flex items-center justify-between gap-3">
										<div className="text-xs text-muted-foreground">
											Ifaces w/speed
										</div>
										<div className="font-medium">
											{ifacePct}{" "}
											<span className="text-xs text-muted-foreground">
												({c ? `${c.ifacesWithSpeed}/${c.ifacesTotal}` : "—"})
											</span>
										</div>
									</div>
									<div className="flex items-center justify-between gap-3">
										<div className="text-xs text-muted-foreground">
											Rollups w/samples
										</div>
										<div className="font-medium">
											{rollupPct}{" "}
											<span className="text-xs text-muted-foreground">
												({c ? `${c.rollupsWithSamples}/${rollupDen}` : "—"})
											</span>
										</div>
									</div>
									<div className="text-xs text-muted-foreground">
										Inv:{" "}
										<span className="font-mono">{c?.asOfInventory ?? "—"}</span>
										{" · "}Rollups:{" "}
										<span className="font-mono">{c?.asOfRollups ?? "—"}</span>
									</div>
								</div>
							);
						})()}
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="interfaces" className="space-y-4">
				<TabsList>
					<TabsTrigger value="scorecard">Scorecard</TabsTrigger>
					<TabsTrigger value="interfaces">Interfaces</TabsTrigger>
					<TabsTrigger value="devices">Devices</TabsTrigger>
					<TabsTrigger value="growth">Growth</TabsTrigger>
					<TabsTrigger value="plan">Plan</TabsTrigger>
					<TabsTrigger value="paths">Paths (Capacity)</TabsTrigger>
					<TabsTrigger value="routing">Routing/BGP</TabsTrigger>
					<TabsTrigger value="changes">Changes</TabsTrigger>
					<TabsTrigger value="health">Health</TabsTrigger>
					<TabsTrigger value="raw">Raw</TabsTrigger>
				</TabsList>

				<TabsContent value="scorecard" className="space-y-4">
					{(() => {
						const ifaces = inventory.data?.interfaces ?? [];
						const aggregates = ifaces.filter(
							(r) => String(r.interfaceType ?? "") === "IF_AGGREGATE",
						);
						const members = ifaces.filter((r) =>
							String(r.aggregateId ?? "").trim(),
						);
						const items = (upgradeCandidates.data?.items ??
							[]) as ForwardNetworkCapacityUpgradeCandidate[];
						const top = items.slice(0, 10);
						const soonest = (() => {
							let best: string | null = null;
							for (const it of items) {
								const s = String(it.forecastCrossingTs ?? "").trim();
								if (!s) continue;
								if (!best || Date.parse(s) < Date.parse(best)) best = s;
							}
							return best;
						})();
						return (
							<div className="space-y-4">
								<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm">Collection</CardTitle>
										</CardHeader>
										<CardContent className="text-sm space-y-1">
											<div className="flex items-center justify-between">
												<div className="text-xs text-muted-foreground">
													As of
												</div>
												<div className="font-mono text-xs">
													{summary.data?.asOf ?? inventory.data?.asOf ?? "—"}
												</div>
											</div>
											<div className="flex items-center justify-between">
												<div className="text-xs text-muted-foreground">
													Status
												</div>
												<div>
													{summary.data?.stale ? (
														<Badge variant="destructive">Stale</Badge>
													) : (
														<Badge variant="secondary">Fresh</Badge>
													)}
												</div>
											</div>
											<div className="flex items-center justify-between">
												<div className="text-xs text-muted-foreground">
													Ifaces w/speed
												</div>
												<div className="font-medium text-xs">
													{coverage.data
														? `${coverage.data.ifacesWithSpeed}/${coverage.data.ifacesTotal}`
														: "—"}
												</div>
											</div>
											<div className="flex items-center justify-between">
												<div className="text-xs text-muted-foreground">
													Rollups w/samples
												</div>
												<div className="font-medium text-xs">
													{coverage.data
														? `${coverage.data.rollupsWithSamples}/${coverage.data.rollupsInterfaceTotal + coverage.data.rollupsDeviceTotal}`
														: "—"}
												</div>
											</div>
										</CardContent>
									</Card>
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm">LAGs</CardTitle>
										</CardHeader>
										<CardContent className="text-sm space-y-1">
											<div className="flex items-center justify-between">
												<div className="text-xs text-muted-foreground">
													Aggregate ifaces
												</div>
												<div className="text-2xl font-semibold">
													{aggregates.length}
												</div>
											</div>
											<div className="flex items-center justify-between">
												<div className="text-xs text-muted-foreground">
													Member ifaces
												</div>
												<div className="text-2xl font-semibold">
													{members.length}
												</div>
											</div>
											<div className="text-xs text-muted-foreground">
												LAG membership from NQE (ethernet.aggregateId +
												aggregation.memberNames).
											</div>
										</CardContent>
									</Card>
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm">Upgrade Risk</CardTitle>
										</CardHeader>
										<CardContent className="text-sm space-y-1">
											<div className="flex items-center justify-between">
												<div className="text-xs text-muted-foreground">
													Candidates
												</div>
												<div className="text-2xl font-semibold">
													{items.length}
												</div>
											</div>
											<div className="flex items-center justify-between">
												<div className="text-xs text-muted-foreground">
													Soonest forecast
												</div>
												<div className="font-mono text-xs">
													{soonest ? soonest.slice(0, 10) : "—"}
												</div>
											</div>
											<div className="text-xs text-muted-foreground">
												Based on util_* rollups (window {windowLabel}).
											</div>
										</CardContent>
									</Card>
								</div>

								<Card>
									<CardHeader>
										<CardTitle className="text-base">
											Top Upgrade Candidates
										</CardTitle>
									</CardHeader>
									<CardContent>
										<DataTable
											columns={
												[
													{
														id: "device",
														header: "Device",
														cell: (r) => (
															<span className="font-mono text-xs">
																{r.device}
															</span>
														),
														width: 220,
													},
													{
														id: "name",
														header: "Link",
														cell: (r) => (
															<div className="text-xs">
																<div className="flex items-center gap-2">
																	<span className="font-mono">{r.name}</span>
																	{r.scopeType === "lag" ? (
																		<Badge variant="secondary">LAG</Badge>
																	) : null}
																</div>
																{r.recommendedSpeedMbps ? (
																	<div className="text-muted-foreground">
																		Rec: {fmtSpeedMbps(r.recommendedSpeedMbps)}
																	</div>
																) : null}
															</div>
														),
														width: 260,
													},
													{
														id: "max",
														header: "Max",
														align: "right",
														cell: (r) => fmtPct01(r.maxUtil),
														width: 90,
													},
													{
														id: "forecast",
														header: "Forecast",
														cell: (r) => (
															<span className="font-mono text-xs">
																{r.forecastCrossingTs
																	? String(r.forecastCrossingTs).slice(0, 10)
																	: "—"}
															</span>
														),
														width: 120,
													},
													{
														id: "reason",
														header: "Reason",
														cell: (r) => (
															<span className="text-xs text-muted-foreground">
																{r.reason || "—"}
															</span>
														),
														width: 140,
													},
												] as Array<
													DataTableColumn<ForwardNetworkCapacityUpgradeCandidate>
												>
											}
											rows={top}
											getRowId={(r) => `${r.scopeType}:${r.device}:${r.name}`}
											emptyText="No upgrade candidates yet. Click Refresh to enqueue rollups."
											maxHeightClassName="max-h-[320px]"
											minWidthClassName="min-w-0"
										/>
									</CardContent>
								</Card>
							</div>
						);
					})()}
				</TabsContent>

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
											`capacity_interfaces_${networkRef}_${windowLabel}_${ifaceMetric}.csv`,
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
											`capacity_devices_${networkRef}_${windowLabel}_${deviceMetric}.csv`,
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

				<TabsContent value="plan" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<CardTitle className="text-base">Upgrade Candidates</CardTitle>
							<div className="flex flex-col gap-2 md:flex-row md:items-center">
								<Input
									placeholder="Filter (device / link)…"
									value={planFilter}
									onChange={(e) => setPlanFilter(e.target.value)}
									className="w-[260px]"
								/>
								<Button
									variant="outline"
									onClick={() => {
										const items = (upgradeCandidates.data?.items ??
											[]) as ForwardNetworkCapacityUpgradeCandidate[];
										const q = planFilter.trim().toLowerCase();
										const filtered = q
											? items.filter((it) => {
													const s =
														`${it.device} ${it.name} ${(it.members ?? []).join(" ")}`.toLowerCase();
													return s.includes(q);
												})
											: items;
										const headers = [
											"scopeType",
											"device",
											"name",
											"members",
											"speedMbps",
											"worstDirection",
											"p95Util",
											"maxUtil",
											"p95Gbps",
											"maxGbps",
											"forecastCrossingTs",
											"requiredSpeedMbps",
											"recommendedSpeedMbps",
											"reason",
											"worstMemberMaxUtil",
										];
										const rows = filtered.map((it) => [
											it.scopeType ?? "",
											it.device ?? "",
											it.name ?? "",
											(it.members ?? []).join(" "),
											it.speedMbps ?? "",
											it.worstDirection ?? "",
											it.p95Util ?? "",
											it.maxUtil ?? "",
											it.p95Gbps ?? "",
											it.maxGbps ?? "",
											it.forecastCrossingTs ?? "",
											it.requiredSpeedMbps ?? "",
											it.recommendedSpeedMbps ?? "",
											it.reason ?? "",
											it.worstMemberMaxUtil ?? "",
										]);
										downloadText(
											`upgrade-candidates-${networkRef}-${windowLabel}.csv`,
											"text/csv",
											toCSV(headers, rows),
										);
									}}
									disabled={upgradeCandidates.isLoading}
								>
									Export CSV
								</Button>
							</div>
						</CardHeader>
						<CardContent>
							{upgradeCandidates.isLoading ? (
								<Skeleton className="h-24 w-full" />
							) : upgradeCandidates.isError ? (
								<div className="text-destructive text-sm">
									Failed to load upgrade candidates:{" "}
									{upgradeCandidates.error instanceof Error
										? upgradeCandidates.error.message
										: String(upgradeCandidates.error)}
								</div>
							) : (
								(() => {
									const items = (upgradeCandidates.data?.items ??
										[]) as ForwardNetworkCapacityUpgradeCandidate[];
									const q = planFilter.trim().toLowerCase();
									const filtered = q
										? items.filter((it) => {
												const s =
													`${it.device} ${it.name} ${(it.members ?? []).join(" ")}`.toLowerCase();
												return s.includes(q);
											})
										: items;
									return (
										<DataTable
											columns={
												[
													{
														id: "device",
														header: "Device",
														cell: (r) => (
															<span className="font-mono text-xs">
																{r.device}
															</span>
														),
														width: 220,
													},
													{
														id: "link",
														header: "Link",
														cell: (r) => (
															<div className="text-xs">
																<div className="flex items-center gap-2">
																	<span className="font-mono">{r.name}</span>
																	{r.scopeType === "lag" ? (
																		<Badge variant="secondary">LAG</Badge>
																	) : null}
																	{r.recommendedSpeedMbps ? (
																		<Badge variant="destructive">upgrade</Badge>
																	) : null}
																</div>
																{(r.members ?? []).length ? (
																	<div className="text-muted-foreground">
																		{(r.members ?? []).length} members
																	</div>
																) : null}
															</div>
														),
														width: 240,
													},
													{
														id: "speed",
														header: "Speed",
														align: "right",
														cell: (r) => (
															<span className="text-xs">
																{fmtSpeedMbps(r.speedMbps)}
															</span>
														),
														width: 90,
													},
													{
														id: "dir",
														header: "Worst",
														cell: (r) => (
															<span className="text-xs">
																{r.worstDirection || "—"}
															</span>
														),
														width: 90,
													},
													{
														id: "max",
														header: "Max",
														align: "right",
														cell: (r) => (
															<span
																className={
																	r.maxUtil >= 0.85
																		? "text-destructive font-medium"
																		: ""
																}
															>
																{fmtPct01(r.maxUtil)}
															</span>
														),
														width: 90,
													},
													{
														id: "p95",
														header: "p95",
														align: "right",
														cell: (r) => fmtPct01(r.p95Util),
														width: 90,
													},
													{
														id: "maxGbps",
														header: "Max (Gbps)",
														align: "right",
														cell: (r) => (
															<span className="text-xs tabular-nums">
																{Number(r.maxGbps ?? 0).toFixed(2)}
															</span>
														),
														width: 110,
													},
													{
														id: "forecast",
														header: "Forecast",
														cell: (r) => (
															<span className="font-mono text-xs">
																{r.forecastCrossingTs
																	? String(r.forecastCrossingTs).slice(0, 10)
																	: "—"}
															</span>
														),
														width: 120,
													},
													{
														id: "req",
														header: "Req",
														align: "right",
														cell: (r) =>
															r.requiredSpeedMbps ? (
																<span className="text-xs">
																	{fmtSpeedMbps(r.requiredSpeedMbps)}
																</span>
															) : (
																<span className="text-muted-foreground text-xs">
																	—
																</span>
															),
														width: 90,
													},
													{
														id: "rec",
														header: "Rec",
														align: "right",
														cell: (r) =>
															r.recommendedSpeedMbps ? (
																<span className="text-xs font-medium text-destructive">
																	{fmtSpeedMbps(r.recommendedSpeedMbps)}
																</span>
															) : (
																<span className="text-muted-foreground text-xs">
																	—
																</span>
															),
														width: 90,
													},
													{
														id: "imb",
														header: "Worst member",
														align: "right",
														cell: (r) =>
															r.worstMemberMaxUtil ? (
																<span className="text-xs">
																	{fmtPct01(r.worstMemberMaxUtil)}
																</span>
															) : (
																<span className="text-muted-foreground text-xs">
																	—
																</span>
															),
														width: 120,
													},
													{
														id: "reason",
														header: "Reason",
														cell: (r) => (
															<span className="text-xs text-muted-foreground">
																{r.reason || "—"}
															</span>
														),
														width: 140,
													},
												] as Array<
													DataTableColumn<ForwardNetworkCapacityUpgradeCandidate>
												>
											}
											rows={filtered}
											getRowId={(r) => `${r.scopeType}:${r.device}:${r.name}`}
											emptyText="No upgrade candidates for this window (no hot links / no near-term forecasts)."
											maxHeightClassName="max-h-[520px]"
											minWidthClassName="min-w-0"
										/>
									);
								})()
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="paths" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<CardTitle className="text-base">
								Path Bottlenecks (Capacity)
							</CardTitle>
							<div className="flex flex-col gap-2 md:flex-row md:items-center">
								<Input
									placeholder="snapshotId (optional)"
									value={pathsSnapshotId}
									onChange={(e) => setPathsSnapshotId(e.target.value)}
									className="w-[260px] font-mono text-xs"
								/>
								<label className="flex items-center gap-2 text-xs text-muted-foreground">
									<input
										type="checkbox"
										checked={pathsIncludeHops}
										onChange={(e) => setPathsIncludeHops(e.target.checked)}
									/>
									include hops
								</label>
								<label className="flex items-center gap-2 text-xs text-muted-foreground">
									<input
										type="checkbox"
										checked={pathsDemoMode}
										onChange={(e) => setPathsDemoMode(e.target.checked)}
									/>
									demo mode
								</label>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPathsPayloadDialogOpen(true)}
									disabled={
										Boolean(pathsParsed.error) || !pathsParsed.queries.length
									}
								>
									Payload
								</Button>
								<Button
									onClick={() => {
										const parsed = pathsParsed;
										if (parsed.error) {
											toast.error("Invalid path input", {
												description: parsed.error,
											});
											return;
										}
										setPathsResult(null);
										runPathBottlenecks.mutate({
											window: windowLabel,
											snapshotId: pathsSnapshotId.trim() || undefined,
											includeHops: pathsIncludeHops,
											queries: parsed.queries,
										});
									}}
									disabled={runPathBottlenecks.isPending}
								>
									Run
								</Button>
								<Button
									variant="outline"
									disabled={!pathsResult?.items?.length}
									onClick={() => {
										const headers = [
											"index",
											"srcIp",
											"dstIp",
											"ipProto",
											"dstPort",
											"forwardingOutcome",
											"securityOutcome",
											"forwardQueryUrl",
											"bottleneckDevice",
											"bottleneckInterface",
											"direction",
											"source",
											"speedMbps",
											"headroomGbps",
											"headroomUtil",
											"p95Util",
											"maxUtil",
											"forecastCrossingTs",
											"error",
										];
										const rows = (pathsResult?.items ?? []).map((it) => {
											const q = it.query ?? {};
											const b = it.bottleneck ?? null;
											return [
												it.index,
												q.srcIp ?? "",
												q.dstIp ?? "",
												q.ipProto ?? "",
												q.dstPort ?? "",
												it.forwardingOutcome ?? "",
												it.securityOutcome ?? "",
												it.forwardQueryUrl ?? "",
												b?.deviceName ?? "",
												b?.interfaceName ?? "",
												b?.direction ?? "",
												(b as any)?.source ?? "",
												b?.speedMbps ?? "",
												b?.headroomGbps ?? "",
												(b as any)?.headroomUtil ?? "",
												b?.p95Util ?? "",
												b?.maxUtil ?? "",
												b?.forecastCrossingTs ?? "",
												it.error ?? "",
											];
										});
										downloadText(
											`path_bottlenecks_${networkRef}_${windowLabel}.csv`,
											"text/csv",
											toCSV(headers, rows),
										);
									}}
								>
									Export CSV
								</Button>
								<Button
									variant="outline"
									disabled={!pathsResult?.items?.length}
									onClick={() => {
										if (!pathsBatchReportMarkdown) return;
										downloadText(
											`capacity_memo_${networkRef}_${windowLabel}.md`,
											"text/markdown",
											pathsBatchReportMarkdown,
										);
									}}
								>
									Report
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="text-xs text-muted-foreground">
								This uses Forward bulk paths to find candidate paths, then joins
								hop interfaces to Skyforge capacity rollups (window{" "}
								{windowLabel}) to highlight the tightest headroom along each
								flow.
							</div>
							<div className="text-xs text-muted-foreground">
								Guardrails: this is not a Forward path-analysis UI. It only
								returns a capacity bottleneck per flow (plus optional minimal
								hops).
							</div>
							<div className="text-xs text-muted-foreground">
								Input formats:{" "}
								<span className="font-mono">srcIp dstIp tcp 443</span>
								{" · "}
								<span className="font-mono">dstIp</span>
								{" · "}
								<span className="font-mono">{"{ queries: [...] }"}</span>
							</div>
							{pathsDemoMode ? (
								<div className="rounded-md border p-3 space-y-2">
									<div className="flex items-center justify-between gap-2">
										<div className="text-xs text-muted-foreground">
											Demo templates
										</div>
										<div className="text-xs text-muted-foreground">
											Forward network:{" "}
											<span className="font-mono">
												{forwardNetworkId || "—"}
											</span>
										</div>
									</div>
									<div className="flex flex-wrap gap-2">
										<Button
											variant="secondary"
											size="sm"
											onClick={() =>
												setPathsInput(
													[
														"10.10.10.10 10.10.10.64/28 tcp 80",
														"10.10.20.10 10.10.30.10 tcp 443",
														"- 10.10.40.0/24 udp 53",
													].join("\\n"),
												)
											}
										>
											Load basic (lines)
										</Button>
										<Button
											variant="secondary"
											size="sm"
											onClick={() =>
												setPathsInput(
													jsonPretty({
														queries: [
															{
																srcIp: "10.10.10.10",
																dstIp: "10.10.10.64/28",
																ipProto: 6,
																dstPort: "8080-8088",
																appId: "ssh",
																url: "*.example.com",
															},
															{
																srcIp: "10.10.20.10",
																dstIp: "10.10.30.10",
																ipProto: 6,
																dstPort: "443",
															},
														],
													}),
												)
											}
										>
											Load advanced (JSON)
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setPathsInput("");
												setPathsBatchName("");
												setPathsResult(null);
											}}
										>
											Clear input
										</Button>
									</div>
									<div className="text-xs text-muted-foreground">
										Tip: use JSON input to set{" "}
										<span className="font-mono">appId</span>,{" "}
										<span className="font-mono">url</span>,{" "}
										<span className="font-mono">userId</span>, etc.
									</div>
								</div>
							) : null}
							<div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
								<div className="flex flex-col gap-2 md:flex-row md:items-center">
									<Input
										placeholder="Save batch name"
										value={pathsBatchName}
										onChange={(e) => setPathsBatchName(e.target.value)}
										className="w-[260px]"
									/>
									<Button
										variant="outline"
										onClick={() => {
											const name = pathsBatchName.trim();
											if (!name) {
												toast.error("Batch name required");
												return;
											}
											if (!workspaceId || !networkRef) {
												toast.error("Workspace/network missing");
												return;
											}
											const b: SavedPathBatch = {
												id: randomId(),
												name,
												text: pathsInput,
												createdAt: new Date().toISOString(),
											};
											const next = [b, ...(savedPathBatches ?? [])].slice(
												0,
												25,
											);
											setSavedPathBatches(next);
											savePathBatches(workspaceId, networkRef, next);
											toast.success("Saved batch", { description: name });
										}}
										disabled={!pathsInput.trim()}
									>
										Save
									</Button>
								</div>
								<div className="text-xs text-muted-foreground flex items-center gap-3">
									<span>
										{pathsParsed.queries.length
											? `${pathsParsed.queries.length} flows parsed`
											: pathsParsed.error
												? pathsParsed.error
												: "—"}
									</span>
									<span>
										Saved batches are stored in your browser for this
										workspace/network.
									</span>
								</div>
							</div>
							{savedPathBatches.length ? (
								<div className="rounded-md border p-3 space-y-2">
									<div className="text-xs text-muted-foreground">
										Saved batches
									</div>
									<div className="flex flex-wrap gap-2">
										{savedPathBatches.map((b) => (
											<div
												key={b.id}
												className="flex items-center gap-2 rounded-md border px-2 py-1"
											>
												<button
													type="button"
													className="text-xs font-mono hover:underline"
													onClick={() => {
														setPathsInput(b.text);
														setPathsBatchName(b.name);
														toast.success("Loaded batch", {
															description: b.name,
														});
													}}
												>
													{b.name}
												</button>
												<button
													type="button"
													className="text-xs text-muted-foreground hover:underline"
													onClick={() => {
														if (!workspaceId || !networkRef) return;
														const next = savedPathBatches.filter(
															(x) => x.id !== b.id,
														);
														setSavedPathBatches(next);
														savePathBatches(workspaceId, networkRef, next);
													}}
												>
													delete
												</button>
											</div>
										))}
									</div>
								</div>
							) : null}
							<textarea
								className="min-h-[140px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs"
								placeholder={
									"10.0.0.1 10.0.0.2 tcp 443\n10.0.0.3 10.0.0.4 udp 53\n10.0.0.0/24"
								}
								value={pathsInput}
								onChange={(e) => setPathsInput(e.target.value)}
							/>

							{runPathBottlenecks.isPending ? (
								<Skeleton className="h-24 w-full" />
							) : pathsResult ? (
								<div className="space-y-4">
									<div className="flex items-center justify-between gap-2">
										<div className="text-xs text-muted-foreground">Results</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPathsResult(null)}
										>
											Clear
										</Button>
									</div>
									{pathsResult.coverage ? (
										<div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
											<span className="font-mono">
												snapshot{" "}
												{String(pathsResult.snapshotId ?? "").trim() ||
													"latest"}
											</span>
											<span className="font-mono">
												hop-keys{" "}
												{Number(pathsResult.coverage.hopInterfaceKeys ?? 0)}
											</span>
											<span className="font-mono">
												rollup {Number(pathsResult.coverage.rollupMatched ?? 0)}
											</span>
											<span className="font-mono">
												perf{" "}
												{Number(pathsResult.coverage.perfFallbackUsed ?? 0)}
											</span>
											<span className="font-mono">
												unknown {Number(pathsResult.coverage.unknown ?? 0)}
											</span>
											{pathsResult.coverage.truncated ? (
												<Badge variant="destructive">truncated</Badge>
											) : null}
											<button
												type="button"
												className="text-xs text-muted-foreground hover:underline"
												onClick={() => setPathsCoverageDialogOpen(true)}
											>
												details
											</button>
										</div>
									) : null}
									<DataTable
										columns={[
											{
												id: "flow",
												header: "Flow",
												cell: (r) => {
													const q = r.query ?? {};
													const src = String(q.srcIp ?? "").trim();
													const dst = String(q.dstIp ?? "").trim();
													const protoNum = Number(q.ipProto ?? NaN);
													const proto =
														protoNum === 6
															? "tcp"
															: protoNum === 17
																? "udp"
																: protoNum === 1
																	? "icmp"
																	: Number.isFinite(protoNum)
																		? String(protoNum)
																		: "";
													const port = String(q.dstPort ?? "").trim();
													return (
														<div className="text-xs">
															<div className="font-mono">
																{src ? `${src} -> ` : ""}
																{dst || "—"}
															</div>
															<div className="text-muted-foreground">
																{[proto, port].filter(Boolean).join(" ")}
															</div>
														</div>
													);
												},
												width: 320,
											},
											{
												id: "outcome",
												header: "Outcome",
												cell: (r) => {
													const f = String(r.forwardingOutcome ?? "").trim();
													const s = String(r.securityOutcome ?? "").trim();
													const ok = f === "DELIVERED" && s !== "DENIED";
													return (
														<div className="text-xs">
															<div
																className={
																	ok
																		? "text-muted-foreground"
																		: "text-destructive font-medium"
																}
															>
																{[f, s].filter(Boolean).join(" / ") || "—"}
															</div>
															{r.timedOut ? (
																<div className="text-muted-foreground">
																	timed out
																</div>
															) : null}
														</div>
													);
												},
												width: 200,
											},
											{
												id: "forward",
												header: "Forward",
												cell: (r) => {
													const u = String(r.forwardQueryUrl ?? "").trim();
													return u ? (
														<a
															href={u}
															target="_blank"
															rel="noreferrer"
															className="text-xs text-muted-foreground hover:underline"
															onClick={(e) => e.stopPropagation()}
														>
															open
														</a>
													) : (
														<span className="text-xs text-muted-foreground">
															—
														</span>
													);
												},
												width: 90,
											},
											{
												id: "hops",
												header: "Hops",
												cell: (r) => {
													const hops = Array.isArray((r as any)?.hops)
														? ((r as any)
																.hops as ForwardNetworkCapacityPathHop[])
														: [];
													if (!hops.length)
														return (
															<span className="text-xs text-muted-foreground">
																—
															</span>
														);
													return (
														<Button
															variant="outline"
															size="sm"
															onClick={(e) => {
																e.preventDefault();
																e.stopPropagation();
																const q = (r as any).query ?? {};
																const src = String(q.srcIp ?? "").trim();
																const dst = String(q.dstIp ?? "").trim();
																const title = `${src ? `${src} -> ` : ""}${dst || "—"}`;
																setPathsHopsDialog({
																	title,
																	hops,
																});
																setPathsHopsDialogOpen(true);
															}}
														>
															{hops.length}
														</Button>
													);
												},
												width: 90,
											},
											{
												id: "bottleneck",
												header: "Bottleneck",
												cell: (r) => {
													const b = r.bottleneck ?? null;
													if (!b)
														return (
															<span className="text-xs text-muted-foreground">
																—
															</span>
														);
													const src = String((b as any).source ?? "").trim();
													return (
														<div className="text-xs">
															<div className="flex items-center gap-2">
																<div className="font-mono">
																	{b.deviceName} {b.interfaceName}
																</div>
																{src ? (
																	<Badge
																		variant="secondary"
																		className="text-[10px]"
																	>
																		{src === "perf_fallback" ? "perf" : src}
																	</Badge>
																) : null}
															</div>
															<div className="text-muted-foreground">
																{b.direction} ·{" "}
																{fmtSpeedMbps(b.speedMbps ?? null)}
															</div>
														</div>
													);
												},
												width: 320,
											},
											{
												id: "headroom",
												header: "Headroom",
												align: "right",
												cell: (r) => {
													const b = r.bottleneck ?? null;
													if (!b)
														return (
															<span className="text-xs text-muted-foreground">
																—
															</span>
														);
													if (
														b.headroomGbps !== undefined &&
														b.headroomGbps !== null
													) {
														const n = Number(b.headroomGbps);
														return (
															<span
																className={
																	n < 0
																		? "text-xs font-medium text-destructive tabular-nums"
																		: "text-xs tabular-nums"
																}
															>
																{n.toFixed(2)}G
															</span>
														);
													}
													if (
														(b as any).headroomUtil !== undefined &&
														(b as any).headroomUtil !== null
													) {
														const hu = Number((b as any).headroomUtil);
														return (
															<span
																className={
																	hu < 0
																		? "text-xs font-medium text-destructive tabular-nums"
																		: "text-xs tabular-nums"
																}
															>
																{fmtPct01(hu)}{" "}
																<span className="text-muted-foreground">
																	util
																</span>
															</span>
														);
													}
													return (
														<span className="text-xs text-muted-foreground">
															—
														</span>
													);
												},
												width: 110,
											},
											{
												id: "util",
												header: "p95 / max",
												align: "right",
												cell: (r) => {
													const b = r.bottleneck ?? null;
													if (!b)
														return (
															<span className="text-xs text-muted-foreground">
																—
															</span>
														);
													return (
														<span className="text-xs tabular-nums">
															{fmtPct01(b.p95Util ?? undefined)} /{" "}
															{fmtPct01(b.maxUtil ?? undefined)}
														</span>
													);
												},
												width: 130,
											},
											{
												id: "forecast",
												header: "Forecast",
												cell: (r) => {
													const b = r.bottleneck ?? null;
													const ts = String(b?.forecastCrossingTs ?? "").trim();
													return (
														<span className="font-mono text-xs">
															{ts ? ts.slice(0, 10) : "—"}
														</span>
													);
												},
												width: 120,
											},
											{
												id: "err",
												header: "Notes",
												cell: (r) => {
													const ns = Array.isArray((r as any)?.notes)
														? ((r as any).notes as Array<{
																code?: string;
																message?: string;
															}>)
														: [];
													const msgs = ns
														.map((n) => String(n?.message ?? "").trim())
														.filter(Boolean);
													const err = String((r as any)?.error ?? "").trim();
													const text = [...msgs, err]
														.filter(Boolean)
														.join(" · ");
													const unmatched = Array.isArray(
														(r as any)?.unmatchedHopInterfacesSample,
													)
														? (
																(r as any)
																	.unmatchedHopInterfacesSample as unknown[]
															)
																.map((x) => String(x ?? "").trim())
																.filter(Boolean)
														: [];
													const fwdUrl =
														String((r as any)?.forwardQueryUrl ?? "").trim() ||
														undefined;
													return (
														<div className="flex items-center gap-2">
															<span className="text-xs text-muted-foreground">
																{text || "—"}
															</span>
															{unmatched.length ? (
																<button
																	type="button"
																	className="text-xs text-muted-foreground hover:underline"
																	onClick={(e) => {
																		e.preventDefault();
																		e.stopPropagation();
																		const q = (r as any).query ?? {};
																		const src = String(q.srcIp ?? "").trim();
																		const dst = String(q.dstIp ?? "").trim();
																		const title = `${src ? `${src} -> ` : ""}${dst || "—"}`;
																		setPathsWhyDialog({
																			title,
																			unmatched,
																			notesText: text,
																			forwardQueryUrl: fwdUrl,
																		});
																		setPathsWhyDialogOpen(true);
																	}}
																>
																	why
																</button>
															) : null}
														</div>
													);
												},
												width: 260,
											},
										]}
										rows={pathsResult.items ?? []}
										getRowId={(r) => String(r.index)}
										onRowClick={(r) => {
											const b = r.bottleneck ?? null;
											if (!b) return;
											setIfaceMetric(
												b.direction === "EGRESS"
													? "util_egress"
													: "util_ingress",
											);
											setSelectedIface({
												id: `${b.deviceName}:${b.interfaceName}:${b.direction}:paths`,
												device: b.deviceName,
												iface: b.interfaceName,
												dir: b.direction,
												speedMbps: b.speedMbps ?? null,
												p95: b.p95Util ?? undefined,
												max: b.maxUtil ?? undefined,
												threshold: b.threshold ?? undefined,
												forecastCrossingTs: b.forecastCrossingTs ?? undefined,
												samples: 0,
											});
										}}
										emptyText="No results."
										maxHeightClassName="max-h-[520px]"
										minWidthClassName="min-w-0"
									/>

									{pathsSummaryRows.length ? (
										<div className="space-y-2">
											<div className="flex items-center justify-between gap-2">
												<div className="text-xs text-muted-foreground">
													Top bottlenecks in this batch
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														const headers = [
															"deviceName",
															"interfaceName",
															"direction",
															"flows",
															"minHeadroomGbps",
															"minHeadroomUtil",
															"worstMaxUtil",
															"soonestForecast",
														];
														const rows = pathsSummaryRows.map((r) => [
															r.deviceName,
															r.interfaceName,
															r.direction,
															r.count,
															r.minHeadroomGbps ?? "",
															r.minHeadroomUtil ?? "",
															r.worstMaxUtil ?? "",
															r.soonestForecast ?? "",
														]);
														downloadText(
															`path_bottlenecks_summary_${networkRef}_${windowLabel}.csv`,
															"text/csv",
															toCSV(headers, rows),
														);
													}}
												>
													Export summary CSV
												</Button>
											</div>
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
														id: "iface",
														header: "Interface",
														cell: (r) => (
															<span className="font-mono text-xs">
																{r.interfaceName}
															</span>
														),
														width: 220,
													},
													{
														id: "dir",
														header: "Dir",
														cell: (r) => (
															<span className="text-xs">{r.direction}</span>
														),
														width: 90,
													},
													{
														id: "count",
														header: "Flows",
														align: "right",
														cell: (r) => (
															<span className="text-xs tabular-nums">
																{r.count}
															</span>
														),
														width: 80,
													},
													{
														id: "headroom",
														header: "Min headroom",
														align: "right",
														cell: (r) => {
															const n = Number(r.minHeadroomGbps ?? NaN);
															if (Number.isFinite(n)) {
																return (
																	<span
																		className={
																			n < 0
																				? "text-xs font-medium text-destructive tabular-nums"
																				: "text-xs tabular-nums"
																		}
																	>
																		{n.toFixed(2)}G
																	</span>
																);
															}
															const hu = Number(r.minHeadroomUtil ?? NaN);
															if (Number.isFinite(hu)) {
																return (
																	<span
																		className={
																			hu < 0
																				? "text-xs font-medium text-destructive tabular-nums"
																				: "text-xs tabular-nums"
																		}
																	>
																		{fmtPct01(hu)}{" "}
																		<span className="text-muted-foreground">
																			util
																		</span>
																	</span>
																);
															}
															return (
																<span className="text-xs text-muted-foreground">
																	—
																</span>
															);
														},
														width: 130,
													},
													{
														id: "worst",
														header: "Worst max",
														align: "right",
														cell: (r) => fmtPct01(r.worstMaxUtil ?? undefined),
														width: 110,
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
												rows={pathsSummaryRows.slice(0, 20)}
												getRowId={(r) => r.id}
												onRowClick={(r) => {
													setIfaceMetric(
														r.direction === "EGRESS"
															? "util_egress"
															: "util_ingress",
													);
													setSelectedIface({
														id: `${r.deviceName}:${r.interfaceName}:${r.direction}:paths-sum`,
														device: r.deviceName,
														iface: r.interfaceName,
														dir: r.direction,
														samples: 0,
													});
												}}
												emptyText="—"
												maxHeightClassName="max-h-[260px]"
												minWidthClassName="min-w-0"
											/>
										</div>
									) : null}

									{pathsUpgradeImpactRows.length ? (
										<div className="space-y-2">
											<div className="flex items-center justify-between gap-2">
												<div className="text-xs text-muted-foreground">
													Upgrade opportunities implied by this batch
												</div>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														const headers = [
															"deviceName",
															"interfaceName",
															"direction",
															"flows",
															"minHeadroomGbps",
															"minHeadroomUtil",
															"requiredSpeedMbps",
															"recommendedSpeedMbps",
															"reason",
														];
														const rows = pathsUpgradeImpactRows.map((r) => [
															r.deviceName,
															r.interfaceName,
															r.direction,
															r.flows,
															r.minHeadroomGbps ?? "",
															r.minHeadroomUtil ?? "",
															r.requiredSpeedMbps ?? "",
															r.recommendedSpeedMbps ?? "",
															r.reason ?? "",
														]);
														downloadText(
															`path_bottlenecks_upgrades_${networkRef}_${windowLabel}.csv`,
															"text/csv",
															toCSV(headers, rows),
														);
													}}
												>
													Export upgrades CSV
												</Button>
											</div>
											<div className="text-xs text-muted-foreground">
												Derived by joining bottleneck interfaces to existing
												Upgrade Candidates (window {windowLabel}); this does not
												replace Forward workflows.
											</div>
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
														id: "iface",
														header: "Interface",
														cell: (r) => (
															<span className="font-mono text-xs">
																{r.interfaceName}
															</span>
														),
														width: 220,
													},
													{
														id: "dir",
														header: "Dir",
														cell: (r) => (
															<span className="text-xs">{r.direction}</span>
														),
														width: 90,
													},
													{
														id: "flows",
														header: "Flows",
														align: "right",
														cell: (r) => (
															<span className="text-xs tabular-nums">
																{r.flows}
															</span>
														),
														width: 80,
													},
													{
														id: "headroom",
														header: "Min headroom",
														align: "right",
														cell: (r) => {
															const n = Number(r.minHeadroomGbps ?? NaN);
															if (Number.isFinite(n)) {
																return (
																	<span
																		className={
																			n < 0
																				? "text-xs font-medium text-destructive tabular-nums"
																				: "text-xs tabular-nums"
																		}
																	>
																		{n.toFixed(2)}G
																	</span>
																);
															}
															const hu = Number(r.minHeadroomUtil ?? NaN);
															if (Number.isFinite(hu)) {
																return (
																	<span
																		className={
																			hu < 0
																				? "text-xs font-medium text-destructive tabular-nums"
																				: "text-xs tabular-nums"
																		}
																	>
																		{fmtPct01(hu)}{" "}
																		<span className="text-muted-foreground">
																			util
																		</span>
																	</span>
																);
															}
															return (
																<span className="text-xs text-muted-foreground">
																	—
																</span>
															);
														},
														width: 130,
													},
													{
														id: "rec",
														header: "Rec",
														align: "right",
														cell: (r) => (
															<span className="text-xs">
																{fmtSpeedMbps(r.recommendedSpeedMbps)}
															</span>
														),
														width: 90,
													},
													{
														id: "reason",
														header: "Reason",
														cell: (r) => (
															<span className="text-xs text-muted-foreground">
																{r.reason || "—"}
															</span>
														),
														width: 220,
													},
												]}
												rows={pathsUpgradeImpactRows.slice(0, 10)}
												getRowId={(r) => r.id}
												onRowClick={(r) => {
													const items = pathsResult?.items ?? [];
													const devNeed = String(r.deviceName ?? "")
														.trim()
														.toLowerCase();
													const ifNeed = normalizeIfaceForJoin(
														String(r.interfaceName ?? ""),
													);
													const dirNeed = String(r.direction ?? "")
														.trim()
														.toUpperCase();
													const flows: PathsUpgradeImpactFlowRow[] = [];
													for (const it of items) {
														const b = it.bottleneck ?? null;
														if (!b) continue;
														const devGot = String(b.deviceName ?? "")
															.trim()
															.toLowerCase();
														const ifGot = normalizeIfaceForJoin(
															String(b.interfaceName ?? ""),
														);
														const dirGot = String(b.direction ?? "")
															.trim()
															.toUpperCase();
														if (
															devGot !== devNeed ||
															ifGot !== ifNeed ||
															dirGot !== dirNeed
														) {
															continue;
														}
														const q = it.query ?? ({} as any);
														const src = String(q.srcIp ?? "").trim();
														const dst = String(q.dstIp ?? "").trim();
														const proto = protoLabel(q.ipProto ?? undefined);
														const port = String(q.dstPort ?? "").trim();
														const f = String(it.forwardingOutcome ?? "").trim();
														const s = String(it.securityOutcome ?? "").trim();
														flows.push({
															id: String(it.index),
															index: it.index,
															src,
															dst,
															proto,
															port,
															outcome: [f, s].filter(Boolean).join(" / "),
															headroomGbps: b.headroomGbps ?? null,
															headroomUtil: (b as any).headroomUtil ?? null,
															forwardQueryUrl: it.forwardQueryUrl,
														});
													}
													const title = `${r.deviceName} ${r.interfaceName} ${r.direction}`;
													setPathsUpgradeDialog({
														title,
														upgrade: r,
														flows,
													});
													setPathsUpgradeDialogOpen(true);
												}}
												emptyText="—"
												maxHeightClassName="max-h-[260px]"
												minWidthClassName="min-w-0"
											/>
										</div>
									) : null}

									{pathsUpgradeImpactRows.length &&
									pathsResult?.items?.length ? (
										<div className="space-y-2">
											<div className="flex items-center justify-between gap-2">
												<div className="text-xs text-muted-foreground">
													Plan impact (simulation)
												</div>
												<div className="flex items-center gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() =>
															setPathsPlanSelected(
																pathsUpgradeImpactRows
																	.slice(0, 3)
																	.map((r) => r.id),
															)
														}
													>
														Select top 3
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => setPathsPlanSelected([])}
													>
														Clear
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															const headers = [
																"index",
																"beforeHeadroomGbps",
																"beforeHeadroomUtil",
																"afterHeadroomGbps",
																"afterHeadroomUtil",
																"appliedSpeedMbps",
																"reason",
															];
															const rows = pathsPlanSim.items.map((r) => [
																r.index,
																r.beforeHeadroomGbps ?? "",
																r.beforeHeadroomUtil ?? "",
																r.afterHeadroomGbps ?? "",
																r.afterHeadroomUtil ?? "",
																r.appliedSpeedMbps ?? "",
																r.reason ?? "",
															]);
															downloadText(
																`path_plan_sim_${networkRef}_${windowLabel}.csv`,
																"text/csv",
																toCSV(headers, rows),
															);
														}}
													>
														Export sim CSV
													</Button>
												</div>
											</div>

											<div className="rounded-md border p-3 space-y-2">
												<div className="text-xs text-muted-foreground">
													Assumption: keep traffic constant (estimate traffic
													from p95 util and speed), then recompute
													utilization/headroom at the upgraded speed. This is a
													planning approximation.
												</div>
												<div className="flex flex-wrap items-center gap-3 text-xs">
													<div>
														Selected upgrades:{" "}
														<span className="font-medium tabular-nums">
															{pathsPlanSelected.length}
														</span>
													</div>
													<div>
														Simulated:{" "}
														<span className="font-medium tabular-nums">
															{pathsPlanSim.summary.simulated}
														</span>
														{" · "}
														<span className="text-muted-foreground">
															cannot simulate:{" "}
															{pathsPlanSim.summary.cannotSimulate}
														</span>
													</div>
													<div>
														At-risk (headroom util &lt; 0):{" "}
														<span className="font-medium tabular-nums">
															{pathsPlanSim.summary.atRiskBefore}
														</span>{" "}
														<span className="text-muted-foreground">
															before
														</span>{" "}
														<span className="font-medium tabular-nums">
															{pathsPlanSim.summary.atRiskAfter}
														</span>{" "}
														<span className="text-muted-foreground">after</span>
													</div>
												</div>

												<div className="flex flex-wrap gap-2">
													{pathsUpgradeImpactRows.slice(0, 10).map((u) => {
														const checked = pathsPlanSelected.includes(u.id);
														return (
															<label
																key={u.id}
																className="flex items-center gap-2 rounded-md border px-2 py-1"
															>
																<input
																	type="checkbox"
																	checked={checked}
																	onChange={(e) => {
																		const on = e.target.checked;
																		setPathsPlanSelected((prev) => {
																			const p = new Set(prev);
																			if (on) p.add(u.id);
																			else p.delete(u.id);
																			return Array.from(p.values());
																		});
																	}}
																/>
																<span className="text-xs font-mono">
																	{u.deviceName} {u.interfaceName} {u.direction}
																</span>
																<span className="text-xs text-muted-foreground">
																	{fmtSpeedMbps(u.recommendedSpeedMbps)}
																</span>
																<span className="text-xs text-muted-foreground">
																	({u.flows} flows)
																</span>
															</label>
														);
													})}
												</div>
											</div>
										</div>
									) : null}
								</div>
							) : (
								<div className="text-xs text-muted-foreground">
									Run a batch to see bottlenecks. If everything is "—", click
									Refresh to compute rollups first.
								</div>
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

				<TabsContent value="changes" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Snapshot Delta</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{snapshotDelta.isLoading ? (
								<Skeleton className="h-24 w-full" />
							) : snapshotDelta.isError ? (
								<div className="text-destructive text-sm">
									Failed to load snapshot delta:{" "}
									{snapshotDelta.error instanceof Error
										? snapshotDelta.error.message
										: String(snapshotDelta.error)}
								</div>
							) : (
								<div className="space-y-3">
									<div className="text-sm text-muted-foreground">
										Latest:{" "}
										<span className="font-mono text-xs">
											{snapshotDelta.data?.latestSnapshotId ?? "—"}
										</span>
										{" · "}Prev:{" "}
										<span className="font-mono text-xs">
											{snapshotDelta.data?.prevSnapshotId ?? "—"}
										</span>
									</div>
									<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
										<Card>
											<CardHeader className="pb-2">
												<CardTitle className="text-sm">
													Route Scale Changes
												</CardTitle>
											</CardHeader>
											<CardContent>
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
																<span className="font-mono text-xs">
																	{r.vrf}
																</span>
															),
															width: 160,
														},
														{
															id: "v4",
															header: "IPv4 Δ",
															align: "right",
															cell: (r) => {
																const n = Number(r.ipv4Delta ?? 0);
																const s = n > 0 ? `+${n}` : String(n);
																return (
																	<span className="text-xs tabular-nums">
																		{s}
																	</span>
																);
															},
															width: 90,
														},
														{
															id: "v6",
															header: "IPv6 Δ",
															align: "right",
															cell: (r) => {
																const n = Number(r.ipv6Delta ?? 0);
																const s = n > 0 ? `+${n}` : String(n);
																return (
																	<span className="text-xs tabular-nums">
																		{s}
																	</span>
																);
															},
															width: 90,
														},
													]}
													rows={snapshotDelta.data?.routeDelta ?? []}
													getRowId={(r) => `${r.deviceName}:${r.vrf}`}
													emptyText="No route scale deltas between last two snapshots."
													maxHeightClassName="max-h-[320px]"
													minWidthClassName="min-w-0"
												/>
											</CardContent>
										</Card>
										<Card>
											<CardHeader className="pb-2">
												<CardTitle className="text-sm">
													BGP Neighbor Changes
												</CardTitle>
											</CardHeader>
											<CardContent>
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
																<span className="font-mono text-xs">
																	{r.vrf}
																</span>
															),
															width: 160,
														},
														{
															id: "nbr",
															header: "Nbrs Δ",
															align: "right",
															cell: (r) => {
																const n = Number(r.neighborsDelta ?? 0);
																const s = n > 0 ? `+${n}` : String(n);
																return (
																	<span className="text-xs tabular-nums">
																		{s}
																	</span>
																);
															},
															width: 80,
														},
														{
															id: "est",
															header: "Est Δ",
															align: "right",
															cell: (r) => {
																const n = Number(r.establishedDelta ?? 0);
																const s = n > 0 ? `+${n}` : String(n);
																return (
																	<span className="text-xs tabular-nums">
																		{s}
																	</span>
																);
															},
															width: 80,
														},
													]}
													rows={snapshotDelta.data?.bgpDelta ?? []}
													getRowId={(r) => `${r.deviceName}:${r.vrf}`}
													emptyText="No BGP scale deltas between last two snapshots."
													maxHeightClassName="max-h-[320px]"
													minWidthClassName="min-w-0"
												/>
											</CardContent>
										</Card>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Inventory Changes</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{snapshotDelta.isLoading ? (
								<Skeleton className="h-24 w-full" />
							) : snapshotDelta.isError ? (
								<div className="text-destructive text-sm">
									Failed to load inventory delta:{" "}
									{snapshotDelta.error instanceof Error
										? snapshotDelta.error.message
										: String(snapshotDelta.error)}
								</div>
							) : (
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm">Devices</CardTitle>
										</CardHeader>
										<CardContent>
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
														id: "type",
														header: "Change",
														cell: (r) => (
															<Badge
																variant={
																	r.changeType === "added"
																		? "secondary"
																		: r.changeType === "removed"
																			? "destructive"
																			: "outline"
																}
															>
																{String(r.changeType || "changed")}
															</Badge>
														),
														width: 110,
													},
													{
														id: "changes",
														header: "Details",
														cell: (r) => (
															<span className="text-xs text-muted-foreground">
																{(r.changes ?? []).length
																	? (r.changes ?? []).join(", ")
																	: "—"}
															</span>
														),
														width: 420,
													},
												]}
												rows={snapshotDelta.data?.deviceDelta ?? []}
												getRowId={(r) => `${r.deviceName}:${r.changeType}`}
												emptyText="No device inventory changes between last two snapshots."
												maxHeightClassName="max-h-[360px]"
												minWidthClassName="min-w-0"
											/>
										</CardContent>
									</Card>

									<Card>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm">Interfaces</CardTitle>
										</CardHeader>
										<CardContent>
											<DataTable
												columns={[
													{
														id: "iface",
														header: "Interface",
														cell: (r) => (
															<div className="space-y-0.5">
																<div className="font-mono text-xs">
																	{r.deviceName}:{r.interfaceName}
																</div>
																<div className="text-xs text-muted-foreground">
																	{(r.changes ?? []).length
																		? (r.changes ?? []).join(", ")
																		: "—"}
																</div>
															</div>
														),
														width: 420,
													},
													{
														id: "type",
														header: "Change",
														cell: (r) => (
															<Badge
																variant={
																	r.changeType === "added"
																		? "secondary"
																		: r.changeType === "removed"
																			? "destructive"
																			: "outline"
																}
															>
																{String(r.changeType || "changed")}
															</Badge>
														),
														width: 110,
													},
												]}
												rows={snapshotDelta.data?.interfaceDelta ?? []}
												getRowId={(r) =>
													`${r.deviceName}:${r.interfaceName}:${r.changeType}`
												}
												emptyText="No interface inventory changes between last two snapshots."
												maxHeightClassName="max-h-[360px]"
												minWidthClassName="min-w-0"
											/>
										</CardContent>
									</Card>
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">LAG Member Imbalance</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="text-sm text-muted-foreground">
								Highlights port-channels / LAGs where one member is running hot
								or disproportionately loaded (based on rollups for {windowLabel}
								).
							</div>
							{inventory.isLoading || summary.isLoading ? (
								<Skeleton className="h-24 w-full" />
							) : inventory.isError || summary.isError ? (
								<div className="text-destructive text-sm">
									Failed to compute LAG imbalance.
								</div>
							) : (
								<DataTable
									columns={[
										{
											id: "lag",
											header: "LAG",
											cell: (r: any) => (
												<div className="space-y-0.5">
													<div className="font-mono text-xs">
														{r.deviceName}:{r.lagName}
													</div>
													<div className="text-xs text-muted-foreground">
														{r.memberCount} members
														{r.totalSpeedMbps
															? ` • ${fmtSpeedMbps(r.totalSpeedMbps)}`
															: ""}
													</div>
												</div>
											),
											width: 360,
										},
										{
											id: "worst",
											header: "Worst member",
											align: "right",
											cell: (r: any) => (
												<span
													className={
														Number(r.worstMemberMaxUtil ?? 0) >= 0.85
															? "text-destructive font-medium"
															: "text-foreground"
													}
												>
													{fmtPct01(Number(r.worstMemberMaxUtil ?? 0))}
												</span>
											),
											width: 120,
										},
										{
											id: "spread",
											header: "Spread",
											align: "right",
											cell: (r: any) => (
												<span className="text-xs tabular-nums">
													{fmtPct01(Number(r.spread ?? 0))}
												</span>
											),
											width: 90,
										},
										{
											id: "hot",
											header: "Hot",
											align: "right",
											cell: (r: any) => (
												<span className="text-xs tabular-nums">
													{Number(r.hotMembers ?? 0)}
												</span>
											),
											width: 70,
										},
										{
											id: "forecast",
											header: "Soonest",
											cell: (r: any) => (
												<span className="font-mono text-xs">
													{r.soonestForecast
														? String(r.soonestForecast).slice(0, 10)
														: "—"}
												</span>
											),
											width: 110,
										},
									]}
									rows={lagImbalanceRows}
									getRowId={(r: any) => r.id}
									onRowClick={(r: any) => {
										setLagDialog({
											deviceName: String(r.deviceName ?? ""),
											lagName: String(r.lagName ?? ""),
											totalSpeedMbps: r.totalSpeedMbps,
											members: (r.members ?? []) as any[],
										});
										setLagDialogOpen(true);
									}}
									emptyText="No LAG imbalance signals in this window."
									maxHeightClassName="max-h-[420px]"
									minWidthClassName="min-w-0"
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
			<Dialog
				open={lagDialogOpen}
				onOpenChange={(v) => !v && setLagDialogOpen(false)}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle className="text-base">LAG Details</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="text-sm">
							<span className="font-mono text-xs">
								{lagDialog
									? `${lagDialog.deviceName}:${lagDialog.lagName}`
									: "—"}
							</span>
							{lagDialog?.totalSpeedMbps ? (
								<span className="text-muted-foreground text-xs">
									{" "}
									{" · "}Σ speed {fmtSpeedMbps(lagDialog.totalSpeedMbps)}
								</span>
							) : null}
						</div>
						<DataTable
							columns={[
								{
									id: "iface",
									header: "Member",
									cell: (r: any) => (
										<span className="font-mono text-xs">
											{String(r.interfaceName ?? "")}
										</span>
									),
									width: 240,
								},
								{
									id: "speed",
									header: "Speed",
									align: "right",
									cell: (r: any) => (
										<span className="text-xs">
											{fmtSpeedMbps(Number(r.speedMbps ?? 0) || null)}
										</span>
									),
									width: 90,
								},
								{
									id: "dir",
									header: "Worst",
									cell: (r: any) => (
										<span className="text-xs">
											{String(r.worstDirection ?? "—")}
										</span>
									),
									width: 90,
								},
								{
									id: "max",
									header: "Max",
									align: "right",
									cell: (r: any) => (
										<span
											className={
												Number(r.maxUtil ?? 0) >= 0.85
													? "text-destructive font-medium"
													: ""
											}
										>
											{fmtPct01(Number(r.maxUtil ?? 0))}
										</span>
									),
									width: 90,
								},
								{
									id: "p95",
									header: "p95",
									align: "right",
									cell: (r: any) => fmtPct01(Number(r.p95Util ?? 0)),
									width: 90,
								},
								{
									id: "forecast",
									header: "Forecast",
									cell: (r: any) => (
										<span className="font-mono text-xs">
											{r.forecast ? String(r.forecast).slice(0, 10) : "—"}
										</span>
									),
									width: 110,
								},
							]}
							rows={lagDialog?.members ?? []}
							getRowId={(r: any) => String(r.interfaceName ?? "")}
							emptyText="No member rows."
							maxHeightClassName="max-h-[55vh]"
							minWidthClassName="min-w-0"
						/>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={pathsCoverageDialogOpen}
				onOpenChange={setPathsCoverageDialogOpen}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle className="text-sm">Paths Coverage</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="text-xs text-muted-foreground">
							Paths are computed against a Forward snapshot (can be older than
							perf). Interface utilization is joined from Skyforge rollups, with
							bounded on-demand perf fallback when rollups are missing.
						</div>
						<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
							<div className="rounded-md border p-3 space-y-1">
								<div className="text-xs text-muted-foreground">Snapshot</div>
								<div className="font-mono text-xs">
									{String(pathsResult?.snapshotId ?? "").trim() || "latest"}
								</div>
								<div className="text-xs text-muted-foreground mt-2">Window</div>
								<div className="font-mono text-xs">
									{String(pathsResult?.window ?? windowLabel)}
								</div>
								<div className="text-xs text-muted-foreground mt-2">
									Rollups as-of
								</div>
								<div className="font-mono text-xs">
									{String(summary.data?.asOf ?? "—")}
									{summary.data?.stale ? (
										<span className="ml-2">
											<Badge variant="destructive">stale</Badge>
										</span>
									) : null}
								</div>
								<div className="text-xs text-muted-foreground mt-2">
									Inventory as-of
								</div>
								<div className="font-mono text-xs">
									{String(inventory.data?.asOf ?? "—")}
								</div>
							</div>
							<div className="rounded-md border p-3 space-y-1">
								<div className="text-xs text-muted-foreground">
									Hop interface keys
								</div>
								<div className="font-mono text-xs">
									{Number(pathsResult?.coverage?.hopInterfaceKeys ?? 0)}
								</div>
								<div className="text-xs text-muted-foreground mt-2">
									Rollup matched / Perf fallback / Unknown
								</div>
								<div className="font-mono text-xs">
									{Number(pathsResult?.coverage?.rollupMatched ?? 0)} /{" "}
									{Number(pathsResult?.coverage?.perfFallbackUsed ?? 0)} /{" "}
									{Number(pathsResult?.coverage?.unknown ?? 0)}
								</div>
								{pathsResult?.coverage?.truncated ? (
									<div className="mt-2">
										<Badge variant="destructive">fallback truncated</Badge>
									</div>
								) : null}
							</div>
						</div>

						{(pathsResult?.coverage?.unmatchedHopInterfacesSample ?? [])
							.length ? (
							<div className="rounded-md border p-3 space-y-2">
								<div className="text-xs text-muted-foreground">
									Unmatched hop interfaces (sample)
								</div>
								<pre className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-2 font-mono text-xs">
									{(pathsResult?.coverage?.unmatchedHopInterfacesSample ?? [])
										.map(String)
										.join("\n")}
								</pre>
							</div>
						) : null}
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={pathsPayloadDialogOpen}
				onOpenChange={setPathsPayloadDialogOpen}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle className="text-sm">
							Forward /paths-bulk Payload
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="text-xs text-muted-foreground">
							This is the exact bulk-path request shape Skyforge uses
							(guardrails applied). Use it to reproduce results or hand off
							deeper analysis to Forward without duplicating Forward UI.
						</div>
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								onClick={async () => {
									const text = forwardPathsBulkPayloadPreview;
									if (!text) {
										toast.error("Nothing to copy", {
											description: "Enter/parse at least one flow first.",
										});
										return;
									}
									const ok = await copyToClipboard(text);
									if (ok) toast.success("Copied payload");
									else {
										downloadText(
											`forward_paths_bulk_payload_${networkRef}.json`,
											"application/json",
											text,
										);
										toast.message("Clipboard not available", {
											description: "Downloaded JSON instead.",
										});
									}
								}}
							>
								Copy
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									const text = forwardPathsBulkPayloadPreview;
									if (!text) return;
									downloadText(
										`forward_paths_bulk_payload_${networkRef}.json`,
										"application/json",
										text,
									);
								}}
								disabled={!forwardPathsBulkPayloadPreview}
							>
								Download
							</Button>
						</div>
						<pre className="max-h-[55vh] overflow-auto whitespace-pre rounded-md border bg-muted p-3 font-mono text-xs">
							{forwardPathsBulkPayloadPreview ||
								"Enter at least one flow (or JSON with { queries: [...] })."}
						</pre>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={pathsUpgradeDialogOpen}
				onOpenChange={setPathsUpgradeDialogOpen}
			>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle className="text-sm">
							Upgrade Impact (Batch)
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="text-xs text-muted-foreground">
							{pathsUpgradeDialog?.title ?? "—"}
						</div>
						<div className="flex flex-wrap items-center gap-3">
							<div className="text-xs">
								Flows:{" "}
								<span className="font-medium tabular-nums">
									{pathsUpgradeDialog?.flows.length ?? 0}
								</span>
							</div>
							<div className="text-xs text-muted-foreground">
								Rec:{" "}
								<span className="font-mono">
									{fmtSpeedMbps(
										pathsUpgradeDialog?.upgrade.recommendedSpeedMbps,
									)}
								</span>
							</div>
							{pathsUpgradeDialog?.upgrade.reason ? (
								<div className="text-xs text-muted-foreground">
									Reason:{" "}
									<span className="font-mono">
										{pathsUpgradeDialog.upgrade.reason}
									</span>
								</div>
							) : null}
							<Button
								variant="outline"
								size="sm"
								disabled={!pathsUpgradeDialog?.flows.length}
								onClick={() => {
									const u = pathsUpgradeDialog?.upgrade;
									const flows = pathsUpgradeDialog?.flows ?? [];
									if (!u || !flows.length) return;
									const headers = [
										"deviceName",
										"interfaceName",
										"direction",
										"index",
										"srcIp",
										"dstIp",
										"proto",
										"dstPort",
										"outcome",
										"headroomGbps",
										"headroomUtil",
										"forwardQueryUrl",
									];
									const rows = flows.map((f) => [
										u.deviceName,
										u.interfaceName,
										u.direction,
										f.index,
										f.src,
										f.dst,
										f.proto,
										f.port,
										f.outcome,
										f.headroomGbps ?? "",
										f.headroomUtil ?? "",
										f.forwardQueryUrl ?? "",
									]);
									downloadText(
										`upgrade_impact_flows_${networkRef}_${windowLabel}.csv`,
										"text/csv",
										toCSV(headers, rows),
									);
								}}
							>
								Export flows CSV
							</Button>
						</div>
						<DataTable
							columns={[
								{
									id: "flow",
									header: "Flow",
									cell: (r) => (
										<div className="text-xs">
											<div className="font-mono">
												{r.src ? `${r.src} -> ` : ""}
												{r.dst || "—"}
											</div>
											<div className="text-muted-foreground">
												{[r.proto, r.port].filter(Boolean).join(" ")}
											</div>
										</div>
									),
									width: 360,
								},
								{
									id: "outcome",
									header: "Outcome",
									cell: (r) => (
										<span className="text-xs text-muted-foreground">
											{r.outcome || "—"}
										</span>
									),
									width: 200,
								},
								{
									id: "headroom",
									header: "Headroom",
									align: "right",
									cell: (r) => {
										const n = Number(r.headroomGbps ?? NaN);
										if (Number.isFinite(n)) {
											return (
												<span
													className={
														n < 0
															? "text-xs font-medium text-destructive tabular-nums"
															: "text-xs tabular-nums"
													}
												>
													{n.toFixed(2)}G
												</span>
											);
										}
										const hu = Number(r.headroomUtil ?? NaN);
										if (Number.isFinite(hu)) {
											return (
												<span
													className={
														hu < 0
															? "text-xs font-medium text-destructive tabular-nums"
															: "text-xs tabular-nums"
													}
												>
													{fmtPct01(hu)}{" "}
													<span className="text-muted-foreground">util</span>
												</span>
											);
										}
										return (
											<span className="text-xs text-muted-foreground">—</span>
										);
									},
									width: 120,
								},
								{
									id: "forward",
									header: "Forward",
									cell: (r) => {
										const u = String(r.forwardQueryUrl ?? "").trim();
										return u ? (
											<a
												href={u}
												target="_blank"
												rel="noreferrer"
												className="text-xs text-muted-foreground hover:underline"
											>
												open
											</a>
										) : (
											<span className="text-xs text-muted-foreground">—</span>
										);
									},
									width: 90,
								},
							]}
							rows={pathsUpgradeDialog?.flows ?? []}
							getRowId={(r) => r.id}
							emptyText="No matching flows (this can happen if interface naming differs)."
							maxHeightClassName="max-h-[55vh]"
							minWidthClassName="min-w-0"
						/>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={pathsWhyDialogOpen} onOpenChange={setPathsWhyDialogOpen}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle className="text-sm">Why Unknown?</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="text-xs text-muted-foreground">
							{pathsWhyDialog?.title ?? "—"}
						</div>
						{pathsWhyDialog?.notesText ? (
							<div className="text-xs text-muted-foreground">
								{pathsWhyDialog.notesText}
							</div>
						) : null}
						{pathsWhyDialog?.forwardQueryUrl ? (
							<div>
								<a
									href={pathsWhyDialog.forwardQueryUrl}
									target="_blank"
									rel="noreferrer"
									className="text-xs text-muted-foreground hover:underline"
								>
									Open in Forward
								</a>
							</div>
						) : null}
						<div className="rounded-md border p-3 space-y-2">
							<div className="text-xs text-muted-foreground">
								Hop interfaces missing utilization stats (sample)
							</div>
							<pre className="max-h-[320px] overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-2 font-mono text-xs">
								{(pathsWhyDialog?.unmatched ?? []).join("\n") || "—"}
							</pre>
						</div>
						<div className="text-xs text-muted-foreground">
							Common causes: missing rollups (run Refresh), interface naming
							mismatches (vendor quirks), or Forward perf history unavailable
							for the hop interface.
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={pathsHopsDialogOpen} onOpenChange={setPathsHopsDialogOpen}>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle className="text-sm">Hops</DialogTitle>
					</DialogHeader>
					<div className="text-xs text-muted-foreground">
						{pathsHopsDialog?.title ?? "—"}
					</div>
					<div className="max-h-[420px] overflow-auto rounded-md border">
						<table className="w-full text-xs">
							<thead className="sticky top-0 bg-background border-b">
								<tr>
									<th className="text-left p-2 w-[60px]">#</th>
									<th className="text-left p-2">Device</th>
									<th className="text-left p-2">Ingress</th>
									<th className="text-left p-2">Egress</th>
								</tr>
							</thead>
							<tbody>
								{(pathsHopsDialog?.hops ?? []).map((h, idx) => (
									<tr key={`${idx}:${h.deviceName ?? ""}`} className="border-b">
										<td className="p-2 text-muted-foreground">{idx + 1}</td>
										<td className="p-2 font-mono">
											{String(h.deviceName ?? "")}
										</td>
										<td className="p-2 font-mono">
											{String(h.ingressInterface ?? "") || "—"}
										</td>
										<td className="p-2 font-mono">
											{String(h.egressInterface ?? "") || "—"}
										</td>
									</tr>
								))}
								{(pathsHopsDialog?.hops ?? []).length === 0 ? (
									<tr>
										<td className="p-3 text-muted-foreground" colSpan={4}>
											No hops in response. Enable “include hops” and re-run.
										</td>
									</tr>
								) : null}
							</tbody>
						</table>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
