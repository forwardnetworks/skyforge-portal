import { useDownloadImage } from "@/hooks/use-download-image";
import type { DeploymentMap } from "@/lib/api-client";
import {
	Background,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	type NodeMouseHandler,
	Panel,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { Copy, ExternalLink, Info, Search } from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { topologyViewerNodeTypes } from "./topology-viewer-custom-node";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

type LayoutMode = "aws" | "azure" | "gcp" | "grid" | "circle";
type InspectorRow = { label: string; value: string };
type LaneDef = {
	key: string;
	label: string;
	classes: string[];
	x: number;
	width: number;
	color: string;
};
type SavedDeploymentMapView = {
	name: string;
	layoutMode: LayoutMode;
	search: string;
	focusDepth: number;
	activeClassFilter: string;
	activeSemanticFilter: string;
	activeLaneFilter: string;
	pinnedNodeIDs: string[];
	pinnedOnly: boolean;
	selectedNodeId: string;
};
const MAX_FOCUS_DEPTH = 6;
const URL_PARAM_PREFIX = "tfmv_";

function normalizeSavedDeploymentMapView(raw: unknown): SavedDeploymentMapView | null {
	if (!raw || typeof raw !== "object") {
		return null;
	}
	const record = raw as Record<string, unknown>;
	const name = String(record.name ?? "").trim();
	if (!name) {
		return null;
	}
	const layoutMode = String(record.layoutMode ?? "grid");
	return {
		name,
		layoutMode:
			layoutMode === "aws" ||
			layoutMode === "azure" ||
			layoutMode === "gcp" ||
			layoutMode === "grid" ||
			layoutMode === "circle"
				? layoutMode
				: "grid",
		search: String(record.search ?? ""),
		focusDepth:
			typeof record.focusDepth === "number" &&
			Number.isInteger(record.focusDepth) &&
			record.focusDepth >= 0 &&
			record.focusDepth <= MAX_FOCUS_DEPTH
				? record.focusDepth
				: 0,
		activeClassFilter: String(record.activeClassFilter ?? ""),
		activeSemanticFilter: String(record.activeSemanticFilter ?? ""),
		activeLaneFilter: String(record.activeLaneFilter ?? ""),
		pinnedNodeIDs: Array.isArray(record.pinnedNodeIDs)
			? record.pinnedNodeIDs.map((value) => String(value).trim()).filter(Boolean)
			: [],
		pinnedOnly: Boolean(record.pinnedOnly),
		selectedNodeId: String(record.selectedNodeId ?? ""),
	};
}

function readURLMapState() {
	if (typeof window === "undefined") {
		return null;
	}
	const params = new URLSearchParams(window.location.search);
	const get = (key: string) => params.get(`${URL_PARAM_PREFIX}${key}`) ?? "";
	const layoutMode = get("layout");
	const focusRaw = get("focus");
	const pinnedRaw = get("pins");
	const pinnedOnlyRaw = get("pinned_only");
	return {
		layoutMode:
			layoutMode === "aws" ||
			layoutMode === "azure" ||
			layoutMode === "gcp" ||
			layoutMode === "grid" ||
			layoutMode === "circle"
				? layoutMode
				: "",
		search: get("search"),
		selectedNodeId: get("selected"),
		activeClassFilter: get("class"),
		activeSemanticFilter: get("semantic"),
		activeLaneFilter: get("lane"),
		focusDepth:
			focusRaw !== "" &&
			Number.isInteger(Number(focusRaw)) &&
			Number(focusRaw) >= 0 &&
			Number(focusRaw) <= MAX_FOCUS_DEPTH
				? Number(focusRaw)
				: null,
		pinnedNodeIDs: pinnedRaw
			.split(",")
			.map((value) => value.trim())
			.filter(Boolean),
		pinnedOnly:
			pinnedOnlyRaw === "1" || pinnedOnlyRaw.toLowerCase() === "true",
	};
}

function writeURLMapState(state: {
	layoutMode: LayoutMode;
	search: string;
	selectedNodeId: string;
	focusDepth: number;
	activeClassFilter: string;
	activeSemanticFilter: string;
	activeLaneFilter: string;
	pinnedNodeIDs: string[];
	pinnedOnly: boolean;
}) {
	if (typeof window === "undefined") {
		return window.location.href;
	}
	const url = new URL(window.location.href);
	const params = url.searchParams;
	const setOrDelete = (key: string, value: string) => {
		const fullKey = `${URL_PARAM_PREFIX}${key}`;
		if (value.trim() === "") {
			params.delete(fullKey);
			return;
		}
		params.set(fullKey, value);
	};
	setOrDelete("layout", state.layoutMode);
	setOrDelete("search", state.search);
	setOrDelete("selected", state.selectedNodeId);
	setOrDelete("focus", state.focusDepth > 0 ? String(state.focusDepth) : "");
	setOrDelete("class", state.activeClassFilter);
	setOrDelete("semantic", state.activeSemanticFilter);
	setOrDelete("lane", state.activeLaneFilter);
	setOrDelete("pins", state.pinnedNodeIDs.join(","));
	setOrDelete("pinned_only", state.pinnedOnly ? "1" : "");
	return url.toString();
}

function focusedNeighborhoodNodeIDs(
	edges: DeploymentMap["edges"],
	rootID: string,
	depth: number,
) {
	const root = String(rootID).trim();
	if (!root || depth <= 0) {
		return null;
	}
	const adjacency = new Map<string, Set<string>>();
	for (const edge of edges) {
		const source = String(edge.source ?? "").trim();
		const target = String(edge.target ?? "").trim();
		if (!source || !target) {
			continue;
		}
		if (!adjacency.has(source)) {
			adjacency.set(source, new Set());
		}
		if (!adjacency.has(target)) {
			adjacency.set(target, new Set());
		}
		adjacency.get(source)?.add(target);
		adjacency.get(target)?.add(source);
	}
	const visible = new Set<string>([root]);
	let frontier = new Set<string>([root]);
	for (let currentDepth = 0; currentDepth < depth; currentDepth += 1) {
		const next = new Set<string>();
		for (const nodeID of frontier) {
			for (const neighbor of adjacency.get(nodeID) ?? []) {
				if (!visible.has(neighbor)) {
					visible.add(neighbor);
					next.add(neighbor);
				}
			}
		}
		frontier = next;
		if (frontier.size === 0) {
			break;
		}
	}
	return visible;
}

function edgeLabel(kind: string) {
	switch (kind.trim().toLowerCase()) {
		case "contains":
			return "contains";
		case "attaches":
			return "attaches to";
		case "routes":
			return "routes";
		case "targets":
			return "targets";
		case "peers":
			return "peers with";
		case "depends-on":
			return "depends on";
		default:
			return kind || "related";
	}
}

function edgeDescription(
	edge: DeploymentMap["edges"][number],
	nodesById: Map<string, DeploymentMap["nodes"][number]>,
) {
	const source = nodesById.get(edge.source);
	const target = nodesById.get(edge.target);
	const sourceLabel = String(source?.label ?? edge.source);
	const targetLabel = String(target?.label ?? edge.target);
	return `${sourceLabel} ${edgeLabel(String(edge.kind ?? "")).toLowerCase()} ${targetLabel}`;
}

function layoutPosition(index: number, count: number, mode: "grid" | "circle") {
	if (mode === "circle") {
		const radius = Math.max(220, count * 18);
		const angle = count <= 1 ? 0 : (2 * Math.PI * index) / count;
		return {
			x: Math.round(Math.cos(angle) * radius),
			y: Math.round(Math.sin(angle) * radius),
		};
	}
	const cols = Math.max(1, Math.ceil(Math.sqrt(count || 1)));
	return {
		x: (index % cols) * 250,
		y: Math.floor(index / cols) * 170,
	};
}

function iconForClass(resourceClass: string) {
	switch (resourceClass) {
		case "network":
		case "subnet":
		case "route":
		case "security":
			return "switch";
		case "gateway":
		case "load-balancer":
		case "service":
			return "cloud";
		default:
			return "server";
	}
}

function isAWSMap(map: DeploymentMap) {
	return mapProviders(map).length === 1 && mapProviders(map)[0] === "aws";
}

function isAzureMap(map: DeploymentMap) {
	return mapProviders(map).length === 1 && mapProviders(map)[0] === "azure";
}

function isGCPMap(map: DeploymentMap) {
	return mapProviders(map).length === 1 && mapProviders(map)[0] === "gcp";
}

function mapProviders(map: DeploymentMap) {
	const providers = new Set(
		map.nodes
			.map((node) => String(node.provider ?? "").trim().toLowerCase())
			.filter(Boolean),
	);
	return [...providers].sort();
}

function inferSubnetRole(node: DeploymentMap["nodes"][number]) {
	const explicit = String(node.subnetRole ?? "").trim().toLowerCase();
	if (explicit) {
		return explicit;
	}
	return "unspecified";
}

function classSortWeight(resourceClass: string) {
	switch (resourceClass) {
		case "network":
			return 0;
		case "gateway":
			return 1;
		case "route":
			return 2;
		case "security":
			return 3;
		case "subnet":
			return 4;
		case "load-balancer":
			return 5;
		case "compute":
			return 6;
		case "database":
			return 7;
		case "service":
			return 8;
		case "storage":
			return 9;
		default:
			return 10;
	}
}

function compareNodes(a: DeploymentMap["nodes"][number], b: DeploymentMap["nodes"][number]) {
	const classDiff =
		classSortWeight(String(a.class ?? "")) -
		classSortWeight(String(b.class ?? ""));
	if (classDiff !== 0) {
		return classDiff;
	}
	const subnetRoleDiff = String(a.subnetRole ?? "").localeCompare(
		String(b.subnetRole ?? ""),
	);
	if (subnetRoleDiff !== 0) {
		return subnetRoleDiff;
	}
	const zoneA = String(a.zone ?? "");
	const zoneB = String(b.zone ?? "");
	if (zoneA !== zoneB) {
		return zoneA.localeCompare(zoneB);
	}
	return String(a.label ?? a.id).localeCompare(String(b.label ?? b.id));
}

function buildGridPositions(map: DeploymentMap) {
	const sortedNodes = [...map.nodes].sort(compareNodes);
	return new Map(
		sortedNodes.map((node, index) => [
			node.id,
			layoutPosition(index, sortedNodes.length, "grid"),
		]),
	);
}

function buildCirclePositions(map: DeploymentMap) {
	const sortedNodes = [...map.nodes].sort(compareNodes);
	return new Map(
		sortedNodes.map((node, index) => [
			node.id,
			layoutPosition(index, sortedNodes.length, "circle"),
		]),
	);
}

function buildAWSPositions(map: DeploymentMap) {
	const positions = new Map<string, { x: number; y: number }>();
	const groups = new Map<string, DeploymentMap["nodes"]>();
	for (const node of [...map.nodes].sort(compareNodes)) {
		const key = String(node.class ?? "resource");
		const existing = groups.get(key) ?? [];
		existing.push(node);
		groups.set(key, existing);
	}

	const laneX: Record<string, number> = {
		network: 0,
		gateway: 280,
		route: 280,
		security: 560,
		subnet: 860,
		"load-balancer": 1180,
		compute: 1480,
		database: 1480,
		service: 1780,
		storage: 1780,
		resource: 2080,
	};

	const laneBaseY: Record<string, number> = {
		network: 120,
		gateway: 40,
		route: 320,
		security: 620,
		subnet: 40,
		"load-balancer": 120,
		compute: 40,
		database: 520,
		service: 900,
		storage: 1180,
		resource: 1460,
	};

	for (const [resourceClass, nodes] of groups) {
		if (resourceClass === "subnet") {
			const zoneOrder = Array.from(
				new Set(nodes.map((node) => String(node.zone ?? "regional") || "regional")),
			).sort();
			for (const [index, node] of nodes.entries()) {
				const zone = String(node.zone ?? "regional") || "regional";
				const zoneIndex = Math.max(zoneOrder.indexOf(zone), 0);
				const role = inferSubnetRole(node);
				const roleOffset =
					role === "public" ? 0 : role === "private" ? 280 : 560;
				positions.set(node.id, {
					x: laneX.subnet + roleOffset,
					y: 40 + zoneIndex * 260 + (index % 2) * 120,
				});
			}
			continue;
		}

		if (resourceClass === "compute") {
			const zoneOrder = Array.from(
				new Set(nodes.map((node) => String(node.zone ?? "regional") || "regional")),
			).sort();
			for (const [index, node] of nodes.entries()) {
				const zone = String(node.zone ?? "regional") || "regional";
				const zoneIndex = Math.max(zoneOrder.indexOf(zone), 0);
				const role = inferSubnetRole(node);
				const roleOffset =
					role === "public" ? 0 : role === "private" ? 280 : 560;
				const col = Math.floor(index / 4);
				const row = index % 4;
				positions.set(node.id, {
					x: laneX.compute + roleOffset + col * 220,
					y: 40 + zoneIndex * 260 + row * 110,
				});
			}
			continue;
		}

		const baseX = laneX[resourceClass] ?? laneX.resource;
		const baseY = laneBaseY[resourceClass] ?? laneBaseY.resource;
		for (const [index, node] of nodes.entries()) {
			const row = index % 4;
			const col = Math.floor(index / 4);
			positions.set(node.id, {
				x: baseX + col * 260,
				y: baseY + row * 140,
			});
		}
	}

	return positions;
}

function buildLanePositions(
	map: DeploymentMap,
	laneX: Record<string, number>,
	laneBaseY: Record<string, number>,
) {
	const positions = new Map<string, { x: number; y: number }>();
	const groups = new Map<string, DeploymentMap["nodes"]>();
	for (const node of [...map.nodes].sort(compareNodes)) {
		const key = String(node.class ?? "resource");
		const existing = groups.get(key) ?? [];
		existing.push(node);
		groups.set(key, existing);
	}

	for (const [resourceClass, nodes] of groups) {
		const baseX = laneX[resourceClass] ?? laneX.resource ?? 0;
		const baseY = laneBaseY[resourceClass] ?? laneBaseY.resource ?? 0;
		const networkGroups = new Map<string, DeploymentMap["nodes"]>();
		for (const node of nodes) {
			const networkKey =
				String(node.networkId ?? node.vpcId ?? node.peerNetworkId ?? "regional") ||
				"regional";
			const existing = networkGroups.get(networkKey) ?? [];
			existing.push(node);
			networkGroups.set(networkKey, existing);
		}
		const networkKeys = [...networkGroups.keys()].sort();
		for (const [networkIndex, networkKey] of networkKeys.entries()) {
			const networkNodes = networkGroups.get(networkKey) ?? [];
			const zoneOrder = Array.from(
				new Set(
					networkNodes.map((node) => String(node.zone ?? node.region ?? "regional")),
				),
			).sort();
			for (const [index, node] of networkNodes.entries()) {
				const zone = String(node.zone ?? node.region ?? "regional") || "regional";
				const zoneIndex = Math.max(zoneOrder.indexOf(zone), 0);
				const col = Math.floor(index / 4);
				const row = index % 4;
				positions.set(node.id, {
					x: baseX + networkIndex * 320 + col * 220,
					y: baseY + zoneIndex * 240 + row * 110,
				});
			}
		}
	}

	return positions;
}

function buildAzurePositions(map: DeploymentMap) {
	return buildLanePositions(
		map,
		{
			network: 0,
			subnet: 340,
			security: 700,
			route: 1040,
			gateway: 1380,
			"load-balancer": 1720,
			compute: 2060,
			database: 2060,
			service: 2400,
			storage: 2400,
			resource: 2740,
		},
		{
			network: 120,
			subnet: 60,
			security: 60,
			route: 60,
			gateway: 60,
			"load-balancer": 120,
			compute: 60,
			database: 520,
			service: 920,
			storage: 1220,
			resource: 1520,
		},
	);
}

function buildGCPPositions(map: DeploymentMap) {
	return buildLanePositions(
		map,
		{
			network: 0,
			subnet: 340,
			route: 700,
			security: 1060,
			gateway: 1400,
			"load-balancer": 1740,
			compute: 2080,
			database: 2080,
			service: 2420,
			storage: 2420,
			resource: 2760,
		},
		{
			network: 120,
			subnet: 60,
			route: 60,
			security: 520,
			gateway: 60,
			"load-balancer": 120,
			compute: 60,
			database: 520,
			service: 920,
			storage: 1220,
			resource: 1520,
		},
	);
}

function semanticLegendItems(map: DeploymentMap) {
	const provider = mapProviders(map)[0] ?? "";
	if (provider === "aws") {
		return ["public", "private", "internet", "nat", "transit", "public lb", "default route"];
	}
	if (provider === "azure") {
		return ["vpn", "appliance", "firewall", "external", "internal", "default route", "peering"];
	}
	if (provider === "gcp") {
		return ["router", "nat", "internal lb", "external", "vpn", "default route", "peering"];
	}
	return [];
}

function laneDefinitions(mode: LayoutMode): LaneDef[] {
	switch (mode) {
		case "aws":
			return [
				{ key: "network", label: "network", classes: ["network"], x: -60, width: 260, color: "rgba(14, 165, 233, 0.08)" },
				{ key: "gateway-route", label: "gateway/route", classes: ["gateway", "route"], x: 220, width: 360, color: "rgba(249, 115, 22, 0.08)" },
				{ key: "security", label: "security", classes: ["security"], x: 600, width: 240, color: "rgba(234, 179, 8, 0.08)" },
				{ key: "subnet", label: "subnet", classes: ["subnet"], x: 840, width: 560, color: "rgba(34, 197, 94, 0.08)" },
				{ key: "load-balancer", label: "load balancer", classes: ["load-balancer"], x: 1120, width: 260, color: "rgba(244, 63, 94, 0.08)" },
				{ key: "compute", label: "compute", classes: ["compute", "database"], x: 1420, width: 640, color: "rgba(99, 102, 241, 0.08)" },
				{ key: "service-storage", label: "service/storage", classes: ["service", "storage", "resource"], x: 1760, width: 620, color: "rgba(168, 85, 247, 0.08)" },
			];
		case "azure":
			return [
				{ key: "network", label: "network", classes: ["network"], x: -60, width: 280, color: "rgba(14, 165, 233, 0.08)" },
				{ key: "subnet", label: "subnet", classes: ["subnet"], x: 280, width: 320, color: "rgba(34, 197, 94, 0.08)" },
				{ key: "security", label: "security", classes: ["security"], x: 640, width: 300, color: "rgba(234, 179, 8, 0.08)" },
				{ key: "route", label: "route", classes: ["route"], x: 980, width: 300, color: "rgba(249, 115, 22, 0.08)" },
				{ key: "gateway", label: "gateway", classes: ["gateway"], x: 1320, width: 300, color: "rgba(244, 63, 94, 0.08)" },
				{ key: "load-balancer", label: "load balancer", classes: ["load-balancer"], x: 1660, width: 300, color: "rgba(217, 70, 239, 0.08)" },
				{ key: "compute-service", label: "compute/service", classes: ["compute", "database", "service", "storage", "resource"], x: 2000, width: 980, color: "rgba(99, 102, 241, 0.08)" },
			];
		case "gcp":
			return [
				{ key: "network", label: "network", classes: ["network"], x: -60, width: 280, color: "rgba(14, 165, 233, 0.08)" },
				{ key: "subnet", label: "subnet", classes: ["subnet"], x: 280, width: 320, color: "rgba(34, 197, 94, 0.08)" },
				{ key: "route", label: "route", classes: ["route"], x: 640, width: 320, color: "rgba(249, 115, 22, 0.08)" },
				{ key: "security", label: "security", classes: ["security"], x: 1000, width: 320, color: "rgba(234, 179, 8, 0.08)" },
				{ key: "gateway", label: "gateway", classes: ["gateway"], x: 1360, width: 320, color: "rgba(244, 63, 94, 0.08)" },
				{ key: "load-balancer", label: "load balancer", classes: ["load-balancer"], x: 1720, width: 320, color: "rgba(217, 70, 239, 0.08)" },
				{ key: "compute-service", label: "compute/service", classes: ["compute", "database", "service", "storage", "resource"], x: 2060, width: 980, color: "rgba(99, 102, 241, 0.08)" },
			];
		default:
			return [];
	}
}

function nodeSemanticTokens(node: DeploymentMap["nodes"][number]) {
	const tokens = [
		node.subnetRole,
		node.gatewayKind,
		node.routeTargetKind,
		node.scheme,
		node.isDefaultRoute ? "default route" : "",
	];
	if (node.peerNetworkId) {
		tokens.push("peering");
	}
	if ((node.class === "subnet" || node.class === "compute") && node.networkId) {
		tokens.push("network attached");
	}
	return tokens
		.map((value) => String(value ?? "").trim().toLowerCase())
		.filter(Boolean)
		.map((value) =>
			value
				.replaceAll("internet-gateway", "internet")
				.replaceAll("nat-gateway", "nat")
				.replaceAll("transit-gateway", "transit")
				.replaceAll("vpn-gateway", "vpn")
				.replaceAll("virtual-appliance", "appliance")
				.replaceAll("internal-load-balancer", "internal lb")
				.replaceAll("internet-facing", "public lb")
				.replaceAll("-", " "),
		);
}

function buildLaneBandNodes(mode: LayoutMode): Node[] {
	const lanes = laneDefinitions(mode);
	if (lanes.length === 0) {
		return [];
	}
	return lanes.map((lane, index) => ({
		id: `lane-band-${mode}-${lane.key}`,
		type: "lane-band",
		position: { x: lane.x, y: 0 },
		data: {
			label: lane.label,
			background: lane.color,
			borderColor: lane.color.replace("0.08", "0.24"),
		},
		style: {
			width: lane.width,
			height: 1720,
			zIndex: -1,
		},
		draggable: false,
		selectable: false,
		focusable: false,
		connectable: false,
		deletable: false,
		hidden: false,
		zIndex: -10 - index,
	}));
}

function downloadTerraformInventory(map: DeploymentMap, deploymentId: string) {
	const rows = [
		[
			"label",
			"class",
			"provider",
			"resource_type",
			"resource_address",
			"status",
			"primary_value",
			"region",
			"zone",
		],
	];
	for (const node of map.nodes) {
		rows.push([
			node.label ?? "",
			node.class ?? "",
			node.provider ?? "",
			node.resourceType ?? "",
			node.resourceAddress ?? "",
			node.status ?? "",
			node.primaryValue ?? "",
			node.region ?? "",
			node.zone ?? "",
		]);
	}
	const csv = rows
		.map((row) =>
			row.map((value) => `"${String(value).replaceAll(`"`, `""`)}"`).join(","),
		)
		.join("\n");
	const blob = new Blob([csv], { type: "text/csv" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = `${deploymentId}-terraform-resources.csv`;
	anchor.click();
	URL.revokeObjectURL(url);
}

function inspectorRowsForNode(node: DeploymentMap["nodes"][number]): InspectorRow[] {
	const provider = String(node.provider ?? "").trim().toLowerCase();
	const rows: InspectorRow[] = [
		{ label: "Class", value: node.class || "resource" },
		{ label: "Provider", value: node.provider || "terraform" },
		{ label: "Type", value: node.resourceType || "unknown" },
		{ label: "Address", value: node.resourceAddress || node.id },
		{ label: "Primary", value: node.primaryValue || "—" },
	];

	if (provider === "aws" && String(node.vpcId ?? "").trim()) {
		rows.push({ label: "VPC ID", value: String(node.vpcId).trim() });
	} else if (String(node.networkId ?? "").trim()) {
		rows.push({ label: "Network", value: String(node.networkId).trim() });
	}
	if (String(node.peerNetworkId ?? "").trim()) {
		rows.push({ label: "Peer network", value: String(node.peerNetworkId).trim() });
	}

	for (const entry of [
		["Status", node.status],
		["Region", node.region],
		["Zone", node.zone],
		["Subnet role", node.subnetRole],
		["Subnet ID", node.subnetId],
		["Gateway kind", node.gatewayKind],
		["Route target", node.routeTargetKind],
		["Default route", node.isDefaultRoute ? "true" : ""],
		["Route table", node.routeTableId],
		["Scheme", node.scheme],
	] as const) {
		if (String(entry[1] ?? "").trim()) {
			rows.push({ label: entry[0], value: String(entry[1]).trim() });
		}
	}

	const routeTableIDs = node.routeTableIds ?? [];
	if (routeTableIDs.length > 0) {
		rows.push({ label: "Route tables", value: routeTableIDs.join(", ") });
	}
	const subnetIDs = node.subnetIds ?? [];
	if (subnetIDs.length > 0) {
		rows.push({ label: "Subnets", value: subnetIDs.join(", ") });
	}
	const securityGroups = node.securityGroups ?? [];
	if (securityGroups.length > 0) {
		rows.push({ label: "Security groups", value: securityGroups.join(", ") });
	}

	return rows;
}

export function DeploymentMapTerraformViewer(props: {
	map: DeploymentMap;
	deploymentId: string;
}) {
	const { map, deploymentId } = props;
	const storageKey = `skyforge.deploymentMapPrefs.${deploymentId}`;
	const ref = useRef<HTMLDivElement>(null);
	const importRef = useRef<HTMLInputElement>(null);
	const { downloadImage } = useDownloadImage();
	const awsSemantic = isAWSMap(map);
	const azureSemantic = isAzureMap(map);
	const gcpSemantic = isGCPMap(map);
	const [layoutMode, setLayoutMode] = useState<LayoutMode>(
		awsSemantic ? "aws" : azureSemantic ? "azure" : gcpSemantic ? "gcp" : "grid",
	);
	const [search, setSearch] = useState("");
	const [selectedNodeId, setSelectedNodeId] = useState("");
	const [focusDepth, setFocusDepth] = useState(0);
	const [hoveredEdgeId, setHoveredEdgeId] = useState("");
	const [activeClassFilter, setActiveClassFilter] = useState("");
	const [activeSemanticFilter, setActiveSemanticFilter] = useState("");
	const [activeLaneFilter, setActiveLaneFilter] = useState("");
	const [pinnedNodeIDs, setPinnedNodeIDs] = useState<string[]>([]);
	const [pinnedOnly, setPinnedOnly] = useState(false);
	const [savedViews, setSavedViews] = useState<SavedDeploymentMapView[]>([]);
	const [viewName, setViewName] = useState("");
	const [prefsLoaded, setPrefsLoaded] = useState(false);
	const [menu, setMenu] = useState<{
		x: number;
		y: number;
		node: Node;
	} | null>(null);
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const nodesById = useMemo(
		() => new Map(map.nodes.map((node) => [node.id, node] as const)),
		[map.nodes],
	);

	const classSummary = useMemo(() => {
		const counts = new Map<string, number>();
		for (const node of map.nodes) {
			const key = String(node.class ?? "resource");
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
		return Array.from(counts.entries()).sort((a, b) => {
			if (b[1] !== a[1]) {
				return b[1] - a[1];
			}
			return a[0].localeCompare(b[0]);
		});
	}, [map.nodes]);

	const semanticLegend = useMemo(() => semanticLegendItems(map), [map]);
	const lanes = useMemo(() => laneDefinitions(layoutMode), [layoutMode]);
	const laneBandNodes = useMemo(() => buildLaneBandNodes(layoutMode), [layoutMode]);
	const focusNodeIDs = useMemo(
		() => focusedNeighborhoodNodeIDs(map.edges, selectedNodeId, focusDepth),
		[focusDepth, map.edges, selectedNodeId],
	);

	const layoutPositions = useMemo(() => {
		if (layoutMode === "circle") {
			return buildCirclePositions(map);
		}
		if (layoutMode === "aws" && awsSemantic) {
			return buildAWSPositions(map);
		}
		if (layoutMode === "azure" && azureSemantic) {
			return buildAzurePositions(map);
		}
		if (layoutMode === "gcp" && gcpSemantic) {
			return buildGCPPositions(map);
		}
		return buildGridPositions(map);
	}, [awsSemantic, azureSemantic, gcpSemantic, layoutMode, map]);

	useEffect(() => {
		if (
			(!awsSemantic && layoutMode === "aws") ||
			(!azureSemantic && layoutMode === "azure") ||
			(!gcpSemantic && layoutMode === "gcp")
		) {
			setLayoutMode("grid");
		}
	}, [awsSemantic, azureSemantic, gcpSemantic, layoutMode]);

	useEffect(() => {
		setPrefsLoaded(false);
		try {
			const raw = window.localStorage.getItem(storageKey);
			if (!raw) {
				setPrefsLoaded(true);
				return;
			}
			const parsed = JSON.parse(raw) as Partial<{
				layoutMode: LayoutMode;
				search: string;
				focusDepth: number;
				activeClassFilter: string;
				activeSemanticFilter: string;
				activeLaneFilter: string;
				pinnedNodeIDs: string[];
				pinnedOnly: boolean;
				selectedNodeId: string;
				savedViews: SavedDeploymentMapView[];
			}>;
			if (parsed.layoutMode) {
				setLayoutMode(parsed.layoutMode);
			}
			if (typeof parsed.search === "string") {
				setSearch(parsed.search);
			}
			if (
				typeof parsed.focusDepth === "number" &&
				Number.isInteger(parsed.focusDepth) &&
				parsed.focusDepth >= 0 &&
				parsed.focusDepth <= MAX_FOCUS_DEPTH
			) {
				setFocusDepth(parsed.focusDepth);
			}
			if (typeof parsed.activeClassFilter === "string") {
				setActiveClassFilter(parsed.activeClassFilter);
			}
			if (typeof parsed.activeSemanticFilter === "string") {
				setActiveSemanticFilter(parsed.activeSemanticFilter);
			}
			if (typeof parsed.activeLaneFilter === "string") {
				setActiveLaneFilter(parsed.activeLaneFilter);
			}
			if (Array.isArray(parsed.pinnedNodeIDs)) {
				setPinnedNodeIDs(
					parsed.pinnedNodeIDs
						.map((value) => String(value).trim())
						.filter(Boolean),
				);
			}
			if (typeof parsed.pinnedOnly === "boolean") {
				setPinnedOnly(parsed.pinnedOnly);
			}
			if (typeof parsed.selectedNodeId === "string") {
				setSelectedNodeId(parsed.selectedNodeId);
			}
			if (Array.isArray(parsed.savedViews)) {
				setSavedViews(
					parsed.savedViews
						.map((view) => normalizeSavedDeploymentMapView(view))
						.filter((view): view is SavedDeploymentMapView => view !== null),
				);
			}
			const urlState = readURLMapState();
			if (urlState) {
				if (urlState.layoutMode) {
					setLayoutMode(urlState.layoutMode);
				}
				if (urlState.search !== "") {
					setSearch(urlState.search);
				}
				if (urlState.selectedNodeId !== "") {
					setSelectedNodeId(urlState.selectedNodeId);
				}
				if (urlState.focusDepth !== null) {
					setFocusDepth(urlState.focusDepth);
				}
				if (urlState.activeClassFilter !== "") {
					setActiveClassFilter(urlState.activeClassFilter);
				}
				if (urlState.activeSemanticFilter !== "") {
					setActiveSemanticFilter(urlState.activeSemanticFilter);
				}
				if (urlState.activeLaneFilter !== "") {
					setActiveLaneFilter(urlState.activeLaneFilter);
				}
				if (urlState.pinnedNodeIDs.length > 0) {
					setPinnedNodeIDs(urlState.pinnedNodeIDs);
				}
				if (urlState.pinnedOnly) {
					setPinnedOnly(true);
				}
			}
		} catch {
			// ignore persisted map prefs
		}
		setPrefsLoaded(true);
	}, [storageKey]);

	useEffect(() => {
		if (!prefsLoaded) {
			return;
		}
		try {
			window.localStorage.setItem(
				storageKey,
				JSON.stringify({
					layoutMode,
					search,
					focusDepth,
					activeClassFilter,
					activeSemanticFilter,
					activeLaneFilter,
					pinnedNodeIDs,
					pinnedOnly,
					selectedNodeId,
					savedViews,
				}),
			);
		} catch {
			// ignore persisted map prefs
		}
	}, [
		activeClassFilter,
		activeLaneFilter,
		activeSemanticFilter,
		focusDepth,
		layoutMode,
		pinnedNodeIDs,
		pinnedOnly,
		prefsLoaded,
		savedViews,
		search,
		selectedNodeId,
		storageKey,
	]);

	useEffect(() => {
		if (!prefsLoaded || typeof window === "undefined") {
			return;
		}
		const url = writeURLMapState({
			layoutMode,
			search,
			selectedNodeId,
			focusDepth,
			activeClassFilter,
			activeSemanticFilter,
			activeLaneFilter,
			pinnedNodeIDs,
			pinnedOnly,
		});
		window.history.replaceState(window.history.state, "", url);
	}, [
		activeClassFilter,
		activeLaneFilter,
		activeSemanticFilter,
		focusDepth,
		layoutMode,
		pinnedNodeIDs,
		pinnedOnly,
		prefsLoaded,
		search,
		selectedNodeId,
	]);

	useEffect(() => {
		const searchTerm = search.trim().toLowerCase();
		const graphNodes: Node[] = map.nodes.map((node) => {
			const haystack = [
				node.label,
				node.resourceType,
				node.resourceAddress,
				node.provider,
				node.primaryValue,
				node.region,
				node.zone,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			const hiddenBySearch = searchTerm !== "" && !haystack.includes(searchTerm);
			const hiddenByClass =
				activeClassFilter !== "" && String(node.class ?? "") !== activeClassFilter;
			const hiddenBySemantic =
				activeSemanticFilter !== "" &&
				!nodeSemanticTokens(node).includes(activeSemanticFilter.toLowerCase());
			const hiddenByLane =
				activeLaneFilter !== "" &&
				!(lanes.find((lane) => lane.key === activeLaneFilter)?.classes ?? []).includes(
					String(node.class ?? ""),
				);
			const hiddenByFocus =
				focusNodeIDs !== null && !focusNodeIDs.has(String(node.id ?? ""));
			const hiddenByPins =
				pinnedOnly &&
				pinnedNodeIDs.length > 0 &&
				!pinnedNodeIDs.includes(String(node.id ?? ""));
			const hidden =
				hiddenBySearch ||
				hiddenByClass ||
				hiddenBySemantic ||
				hiddenByLane ||
				hiddenByFocus ||
				hiddenByPins;
			const selected = selectedNodeId !== "" && selectedNodeId === node.id;
			return {
				id: node.id,
				position: layoutPositions.get(node.id) ?? { x: 0, y: 0 },
				hidden,
				type: "custom",
				data: {
					label: node.label,
					icon: iconForClass(String(node.class ?? "")),
					status: node.status || "ready",
					ip:
						node.primaryValue ||
						[node.region, node.zone].filter(Boolean).join(" / ") ||
						node.mgmtIp ||
						"",
					kind: node.resourceType || node.class || "",
					vendor: node.provider || "terraform",
					highlight: selected,
					resourceType: node.resourceType || "",
					resourceAddress: node.resourceAddress || "",
					region: node.region || "",
					zone: node.zone || "",
					class: node.class || "",
					subnetRole: node.subnetRole || "",
					networkId: node.networkId || "",
					peerNetworkId: node.peerNetworkId || "",
					gatewayKind: node.gatewayKind || "",
					routeTargetKind: node.routeTargetKind || "",
					isDefaultRoute: node.isDefaultRoute ? "default-route" : "",
					scheme: node.scheme || "",
					details: node.details || {},
				},
			};
		});
		const visible = new Set(
			graphNodes.filter((node) => !node.hidden).map((node) => node.id),
		);
		const graphEdges: Edge[] = map.edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			label: edge.label || edgeLabel(String(edge.kind ?? "")),
			hidden: !visible.has(edge.source) || !visible.has(edge.target),
			data: {
				kind: edge.kind || "",
				description: edgeDescription(edge, nodesById),
				details: edge.details || {},
			},
		}));
		setNodes([...laneBandNodes, ...graphNodes]);
		setEdges(graphEdges);
	}, [activeClassFilter, activeLaneFilter, activeSemanticFilter, focusNodeIDs, laneBandNodes, lanes, layoutPositions, map.edges, map.nodes, nodesById, pinnedNodeIDs, pinnedOnly, search, selectedNodeId, setEdges, setNodes]);

	const selectedNode = map.nodes.find((node) => node.id === selectedNodeId) ?? null;
	const relatedNodeIDs = new Set<string>();
	const relatedEdges: DeploymentMap["edges"] = [];
	if (selectedNode) {
		relatedNodeIDs.add(selectedNode.id);
		for (const edge of map.edges) {
			if (edge.source === selectedNode.id) {
				relatedNodeIDs.add(edge.target);
				relatedEdges.push(edge);
			}
			if (edge.target === selectedNode.id) {
				relatedNodeIDs.add(edge.source);
				relatedEdges.push(edge);
			}
		}
	}
	const relatedResources = map.nodes
		.filter((node) => relatedNodeIDs.has(node.id) && node.id !== selectedNode?.id)
		.sort(compareNodes)
		.slice(0, 8);
	const relatedRelationshipLines = relatedEdges
		.map((edge) => edgeDescription(edge, nodesById))
		.sort((a, b) => a.localeCompare(b))
		.slice(0, 8);
	const hoveredEdge = edges.find((edge) => edge.id === hoveredEdgeId) ?? null;
	const currentFocusIDs = useMemo(() => {
		if (focusNodeIDs && focusNodeIDs.size > 0) {
			return [...focusNodeIDs];
		}
		if (selectedNodeId) {
			return [selectedNodeId];
		}
		return [];
	}, [focusNodeIDs, selectedNodeId]);

	const handleNodeClick: NodeMouseHandler = (_, node) => {
		setSelectedNodeId(String(node.id));
		setMenu(null);
	};

	const handleNodeContextMenu: NodeMouseHandler = (event, node) => {
		event.preventDefault();
		const rect = ref.current?.getBoundingClientRect();
		const x = rect ? event.clientX - rect.left : event.clientX;
		const y = rect ? event.clientY - rect.top : event.clientY;
		setSelectedNodeId(String(node.id));
		setMenu({ x, y, node });
	};

	const inspectorRows = selectedNode ? inspectorRowsForNode(selectedNode) : [];
	const hasSummaryState =
		Boolean(selectedNode) ||
		focusDepth > 0 ||
		activeClassFilter !== "" ||
		activeSemanticFilter !== "" ||
		activeLaneFilter !== "" ||
		pinnedNodeIDs.length > 0 ||
		pinnedOnly;
	const applySavedView = (view: SavedDeploymentMapView) => {
		setLayoutMode(view.layoutMode);
		setSearch(view.search);
		setFocusDepth(view.focusDepth);
		setActiveClassFilter(view.activeClassFilter);
		setActiveSemanticFilter(view.activeSemanticFilter);
		setActiveLaneFilter(view.activeLaneFilter);
		setPinnedNodeIDs(view.pinnedNodeIDs);
		setPinnedOnly(view.pinnedOnly);
		setSelectedNodeId(view.selectedNodeId);
	};
	const copyShareLink = async () => {
		const url = writeURLMapState({
			layoutMode,
			search,
			selectedNodeId,
			focusDepth,
			activeClassFilter,
			activeSemanticFilter,
			activeLaneFilter,
			pinnedNodeIDs,
			pinnedOnly,
		});
		await navigator.clipboard?.writeText(url);
		toast.success("Copied share link");
	};
	const exportSavedViews = () => {
		const blob = new Blob(
			[
				JSON.stringify(
					{
						deploymentId,
						exportedAt: new Date().toISOString(),
						views: savedViews,
					},
					null,
					2,
				),
			],
			{ type: "application/json" },
		);
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `${deploymentId}-terraform-map-views.json`;
		anchor.click();
		URL.revokeObjectURL(url);
	};
	const importSavedViews = async (file: File) => {
		try {
			const raw = await file.text();
			const parsed = JSON.parse(raw) as { views?: unknown[] } | unknown[];
			const sourceViews = Array.isArray(parsed)
				? parsed
				: Array.isArray(parsed.views)
					? parsed.views
					: [];
			const normalized = sourceViews
				.map((view) => normalizeSavedDeploymentMapView(view))
				.filter((view): view is SavedDeploymentMapView => view !== null);
			if (normalized.length === 0) {
				toast.error("Imported file does not contain any valid saved views");
				return;
			}
			setSavedViews((current) => {
				const merged = [...normalized, ...current];
				const deduped: SavedDeploymentMapView[] = [];
				const seen = new Set<string>();
				for (const view of merged) {
					if (seen.has(view.name)) {
						continue;
					}
					seen.add(view.name);
					deduped.push(view);
				}
				return deduped.slice(0, 10);
			});
			toast.success(`Imported ${normalized.length} saved view${normalized.length === 1 ? "" : "s"}`);
		} catch (error) {
			toast.error("Failed to import saved views", {
				description: error instanceof Error ? error.message : "Invalid JSON file",
			});
		}
	};

	return (
		<div className="h-full min-h-0 relative" ref={ref}>
			<input
				ref={importRef}
				type="file"
				accept="application/json,.json"
				className="hidden"
				onChange={(event) => {
					const file = event.target.files?.[0];
					if (file) {
						void importSavedViews(file);
					}
					event.currentTarget.value = "";
				}}
			/>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onNodeClick={handleNodeClick}
				onNodeContextMenu={handleNodeContextMenu}
				onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(String(edge.id))}
				onEdgeMouseLeave={() => setHoveredEdgeId("")}
				onPaneClick={() => setMenu(null)}
				nodeTypes={topologyViewerNodeTypes}
				fitView
				className="bg-muted/10 border rounded-xl"
			>
				<Panel position="top-right">
					<Card className="shadow-sm border bg-background/85 backdrop-blur">
						<CardHeader className="p-3 pb-2">
							<CardTitle className="text-sm">Tools</CardTitle>
						</CardHeader>
						<CardContent className="p-3 pt-0 space-y-2">
							<div className="flex items-center gap-2 rounded-md border bg-background/70 px-2 py-1">
								<Search className="h-4 w-4 text-muted-foreground" />
								<Input
									value={search}
									onChange={(event) => setSearch(event.target.value)}
									placeholder="Search resources…"
									className="h-7 w-56 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
								/>
							</div>
							<div className="flex items-center gap-2 rounded-md border bg-background/70 px-2 py-1">
								<Input
									value={viewName}
									onChange={(event) => setViewName(event.target.value)}
									placeholder="Save view as…"
									className="h-7 w-40 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
								/>
								<Button
									variant="outline"
									size="sm"
									disabled={viewName.trim() === ""}
									onClick={() => {
										const name = viewName.trim();
										if (!name) {
											return;
										}
										const nextView: SavedDeploymentMapView = {
											name,
											layoutMode,
											search,
											focusDepth,
											activeClassFilter,
											activeSemanticFilter,
											activeLaneFilter,
											pinnedNodeIDs,
											pinnedOnly,
											selectedNodeId,
										};
										setSavedViews((current) => {
											const next = current.filter((view) => view.name !== name);
											return [nextView, ...next].slice(0, 10);
										});
										setViewName("");
									}}
								>
									Save view
								</Button>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={!awsSemantic}
									onClick={() => setLayoutMode("aws")}
								>
									AWS
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={!azureSemantic}
									onClick={() => setLayoutMode("azure")}
								>
									Azure
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={!gcpSemantic}
									onClick={() => setLayoutMode("gcp")}
								>
									GCP
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setLayoutMode("grid")}
								>
									Grid
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setLayoutMode("circle")}
								>
									Circle
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setSelectedNodeId("");
										setFocusDepth(0);
										setActiveClassFilter("");
										setActiveSemanticFilter("");
										setActiveLaneFilter("");
										setPinnedOnly(false);
										setPinnedNodeIDs([]);
									}}
								>
									Reset
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => downloadTerraformInventory(map, deploymentId)}
								>
									Inventory
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										ref.current && downloadImage(ref.current, "deployment-map.png")
									}
								>
									PNG
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => void copyShareLink()}
								>
									Copy link
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={savedViews.length === 0}
									onClick={exportSavedViews}
								>
									Export views
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => importRef.current?.click()}
								>
									Import views
								</Button>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={!selectedNodeId}
									onClick={() => setFocusDepth((current) => (current === 1 ? 0 : 1))}
								>
									1-hop
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={!selectedNodeId}
									onClick={() => setFocusDepth((current) => (current === 2 ? 0 : 2))}
								>
									2-hop
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={!selectedNodeId || focusDepth >= MAX_FOCUS_DEPTH}
									onClick={() =>
										setFocusDepth((current) =>
											Math.min(MAX_FOCUS_DEPTH, Math.max(current, 0) + 1),
										)
									}
								>
									Expand
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={!selectedNodeId || focusDepth === 0}
									onClick={() =>
										setFocusDepth((current) => Math.max(0, current - 1))
									}
								>
									Collapse
								</Button>
								<div className="text-[11px] text-muted-foreground">
									Focus: {focusDepth === 0 ? "off" : `${focusDepth}-hop`}
								</div>
								<Button
									variant="outline"
									size="sm"
									disabled={currentFocusIDs.length === 0}
									onClick={() => {
										setPinnedNodeIDs((current) =>
											Array.from(new Set([...current, ...currentFocusIDs])).sort(),
										);
									}}
								>
									Pin focus
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={pinnedNodeIDs.length === 0}
									onClick={() => setPinnedOnly((current) => !current)}
								>
									{pinnedOnly ? "Pinned off" : "Pinned only"}
								</Button>
								<Button
									variant="outline"
									size="sm"
									disabled={pinnedNodeIDs.length === 0}
									onClick={() => {
										setPinnedNodeIDs([]);
										setPinnedOnly(false);
									}}
								>
									Clear pins
								</Button>
								<div className="text-[11px] text-muted-foreground">
									Pins: {pinnedNodeIDs.length}
								</div>
							</div>
							<div className="text-[11px] text-muted-foreground">
								Tip: Click a resource to inspect it. Right-click for map actions.
							</div>
							{savedViews.length > 0 ? (
								<div className="space-y-2">
									<div className="text-[11px] text-muted-foreground">
										Saved views
									</div>
									<div className="flex flex-wrap gap-1">
										{savedViews.map((view) => (
											<div
												key={view.name}
												className="flex items-center gap-1 rounded-md border px-1 py-1"
											>
												<button
													type="button"
													className="px-1 text-[11px] hover:underline"
													onClick={() => applySavedView(view)}
												>
													{view.name}
												</button>
												<button
													type="button"
													className="px-1 text-[11px] text-muted-foreground hover:text-foreground"
													onClick={() =>
														setSavedViews((current) =>
															current.filter((item) => item.name !== view.name),
														)
													}
												>
													×
												</button>
											</div>
										))}
									</div>
								</div>
							) : null}
							<div className="flex flex-wrap gap-1">
								{classSummary.slice(0, 6).map(([resourceClass, count]) => (
									<button
										type="button"
										key={resourceClass}
										onClick={() =>
											setActiveClassFilter((current) =>
												current === resourceClass ? "" : resourceClass,
											)
										}
										className={`rounded-md border px-2 py-1 text-[11px] ${
											activeClassFilter === resourceClass
												? "border-primary bg-primary/10 text-foreground"
												: "text-muted-foreground"
										}`}
									>
										<span className="capitalize">{resourceClass}</span>: {count}
									</button>
								))}
							</div>
						</CardContent>
					</Card>
				</Panel>
				{map.legend?.length || semanticLegend.length ? (
					<Panel position="top-left">
						<Card className="shadow-sm border bg-background/85 backdrop-blur">
							<CardHeader className="p-3 pb-2">
								<CardTitle className="text-sm">Legend</CardTitle>
							</CardHeader>
							<CardContent className="p-3 pt-0 space-y-3">
								{map.legend?.length ? (
									<div>
										<div className="mb-2 text-[11px] text-muted-foreground">
											Resource classes
										</div>
										<div className="flex flex-wrap gap-1">
											{map.legend.map((item) => (
												<div
													key={item.key}
													className="rounded-md border px-2 py-1 text-[11px] text-muted-foreground"
												>
													{item.label}
												</div>
											))}
										</div>
									</div>
								) : null}
								{semanticLegend.length ? (
									<div>
										<div className="mb-2 text-[11px] text-muted-foreground">
											Semantic badges
										</div>
										<div className="flex flex-wrap gap-1">
											{semanticLegend.map((item) => (
												<button
													type="button"
													key={item}
													onClick={() =>
														setActiveSemanticFilter((current) =>
															current === item ? "" : item,
														)
													}
													className={`rounded-md border px-2 py-1 text-[11px] ${
														activeSemanticFilter === item
															? "border-primary bg-primary/10 text-foreground"
															: "text-muted-foreground"
													}`}
												>
													{item}
												</button>
											))}
										</div>
									</div>
								) : null}
							</CardContent>
						</Card>
					</Panel>
				) : null}
				{lanes.length ? (
					<Panel position="top-center">
						<Card className="shadow-sm border bg-background/85 backdrop-blur">
							<CardHeader className="p-3 pb-2">
								<CardTitle className="text-sm">Layout Lanes</CardTitle>
							</CardHeader>
							<CardContent className="p-3 pt-0">
								<div className="flex flex-wrap justify-center gap-1">
									{lanes.map((lane) => (
										<button
											type="button"
											key={lane.key}
											onClick={() =>
												setActiveLaneFilter((current) =>
													current === lane.key ? "" : lane.key,
												)
											}
											className={`rounded-md border px-2 py-1 text-[11px] ${
												activeLaneFilter === lane.key
													? "border-primary bg-primary/10 text-foreground"
													: "text-muted-foreground"
											}`}
										>
											{lane.label}
										</button>
									))}
								</div>
							</CardContent>
						</Card>
					</Panel>
				) : null}
				{hoveredEdge ? (
					<Panel position="bottom-right">
						<Card className="w-[320px] shadow-sm border bg-background/92 backdrop-blur">
							<CardHeader className="p-3 pb-2">
								<CardTitle className="text-sm">Relationship</CardTitle>
							</CardHeader>
							<CardContent className="p-3 pt-0 space-y-2 text-xs">
								<div className="break-words">
									{String(hoveredEdge.data?.description ?? hoveredEdge.label ?? hoveredEdge.id)}
								</div>
								<div className="flex items-center gap-2 text-muted-foreground">
									<div>Kind</div>
									<div className="rounded-md border px-2 py-1 text-[11px]">
										{edgeLabel(String(hoveredEdge.data?.kind ?? ""))}
									</div>
								</div>
							</CardContent>
						</Card>
					</Panel>
				) : null}
				<Controls />
				<MiniMap zoomable pannable className="bg-background border rounded-lg" />
				<Background gap={12} size={1} />
			</ReactFlow>

			{hasSummaryState ? (
				<div className="absolute left-1/2 top-3 z-40 w-[min(920px,calc(100%-1.5rem))] -translate-x-1/2">
					<Card className="border bg-background/92 shadow-sm backdrop-blur">
						<CardContent className="flex flex-wrap items-center gap-2 p-3 text-[11px]">
							<div className="text-muted-foreground uppercase tracking-[0.18em]">
								Working Set
							</div>
							{selectedNode ? (
								<div className="flex items-center gap-2 rounded-md border px-2 py-1">
									<span className="text-muted-foreground">Selected</span>
									<span className="max-w-[180px] truncate font-medium">
										{selectedNode.label}
									</span>
									<button
										type="button"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => setSelectedNodeId("")}
									>
										Clear
									</button>
								</div>
							) : null}
							{focusDepth > 0 ? (
								<div className="flex items-center gap-2 rounded-md border px-2 py-1">
									<span className="text-muted-foreground">Focus</span>
									<span>{focusDepth}-hop</span>
									<button
										type="button"
										className="text-muted-foreground hover:text-foreground"
										onClick={() =>
											setFocusDepth((current) => Math.min(MAX_FOCUS_DEPTH, current + 1))
										}
									>
										Expand
									</button>
									<button
										type="button"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => setFocusDepth((current) => Math.max(0, current - 1))}
									>
										Collapse
									</button>
									<button
										type="button"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => setFocusDepth(0)}
									>
										Clear
									</button>
								</div>
							) : null}
							{activeClassFilter ? (
								<div className="flex items-center gap-2 rounded-md border px-2 py-1">
									<span className="text-muted-foreground">Class</span>
									<span className="capitalize">{activeClassFilter}</span>
									<button
										type="button"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => setActiveClassFilter("")}
									>
										Clear
									</button>
								</div>
							) : null}
							{activeSemanticFilter ? (
								<div className="flex items-center gap-2 rounded-md border px-2 py-1">
									<span className="text-muted-foreground">Semantic</span>
									<span>{activeSemanticFilter}</span>
									<button
										type="button"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => setActiveSemanticFilter("")}
									>
										Clear
									</button>
								</div>
							) : null}
							{activeLaneFilter ? (
								<div className="flex items-center gap-2 rounded-md border px-2 py-1">
									<span className="text-muted-foreground">Lane</span>
									<span>
										{lanes.find((lane) => lane.key === activeLaneFilter)?.label ??
											activeLaneFilter}
									</span>
									<button
										type="button"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => setActiveLaneFilter("")}
									>
										Clear
									</button>
								</div>
							) : null}
							{pinnedNodeIDs.length > 0 ? (
								<div className="flex items-center gap-2 rounded-md border px-2 py-1">
									<span className="text-muted-foreground">Pins</span>
									<span>{pinnedNodeIDs.length}</span>
									{pinnedOnly ? <span className="text-muted-foreground">only</span> : null}
									<button
										type="button"
										className="text-muted-foreground hover:text-foreground"
										onClick={() => {
											setPinnedNodeIDs([]);
											setPinnedOnly(false);
										}}
									>
										Clear
									</button>
								</div>
							) : null}
						</CardContent>
					</Card>
				</div>
			) : null}

			{menu ? (
				<div
					className="absolute z-50"
					style={{ left: menu.x, top: menu.y }}
					onContextMenu={(event) => event.preventDefault()}
				>
					<Card className="w-64 shadow-lg border bg-background/95 backdrop-blur">
						<CardHeader className="p-3 pb-2">
							<CardTitle className="text-sm">Resource Actions</CardTitle>
							<div className="text-xs text-muted-foreground font-mono truncate">
								{String(menu.node.data?.label ?? menu.node.id)}
							</div>
						</CardHeader>
						<CardContent className="p-3 pt-0 space-y-2">
							<Button
								size="sm"
								className="w-full"
								onClick={() => {
									setSelectedNodeId(String(menu.node.id));
									setMenu(null);
								}}
							>
								<Info className="mr-2 h-4 w-4" />
								Inspect
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={() => {
									void navigator.clipboard?.writeText(
										String(menu.node.data?.resourceAddress ?? ""),
									);
									toast.success("Copied resource address");
									setMenu(null);
								}}
							>
								<Copy className="mr-2 h-4 w-4" />
								Copy resource address
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={() => {
									setSelectedNodeId(String(menu.node.id));
									setFocusDepth(1);
									setMenu(null);
								}}
							>
								Show connected
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={() => {
									window.open(
										`/dashboard/deployments/${encodeURIComponent(deploymentId)}`,
										"_blank",
										"noopener,noreferrer",
									);
									setMenu(null);
								}}
							>
								<ExternalLink className="mr-2 h-4 w-4" />
								Open deployment details
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="w-full"
								onClick={() => setMenu(null)}
							>
								Close
							</Button>
						</CardContent>
					</Card>
				</div>
			) : null}

			<Card className="absolute bottom-3 left-3 z-40 w-[360px] max-w-[calc(100%-1.5rem)] border bg-background/92 backdrop-blur shadow-sm">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-sm">
						{selectedNode ? selectedNode.label : "Terraform inspector"}
					</CardTitle>
				</CardHeader>
				<CardContent className="p-3 pt-0 space-y-2 text-xs">
					{selectedNode ? (
						<>
							<div className="grid grid-cols-2 gap-x-3 gap-y-1">
								{inspectorRows.map((row) => (
									<Fragment key={row.label}>
										<div className="text-muted-foreground">
											{row.label}
										</div>
										<div className="break-all">
											{row.value}
										</div>
									</Fragment>
								))}
							</div>
							{relatedResources.length > 0 ? (
								<div className="rounded-md border bg-muted/20 p-2">
									<div className="mb-2 text-muted-foreground">Connected resources</div>
									<div className="space-y-1">
										{relatedResources.map((node) => (
											<div
												key={node.id}
												className="flex items-center justify-between gap-3 text-[11px]"
											>
												<button
													type="button"
													className="truncate text-left hover:underline"
													onClick={() => setSelectedNodeId(node.id)}
												>
													{node.label}
												</button>
												<div className="text-muted-foreground capitalize">
													{node.class || "resource"}
												</div>
											</div>
										))}
									</div>
								</div>
							) : null}
							{relatedRelationshipLines.length > 0 ? (
								<div className="rounded-md border bg-muted/20 p-2">
									<div className="mb-2 text-muted-foreground">Relationships</div>
									<div className="space-y-1">
										{relatedRelationshipLines.map((line) => (
											<div
												key={line}
												className="text-[11px] text-muted-foreground break-words"
											>
												{line}
											</div>
										))}
									</div>
								</div>
							) : null}
							{selectedNode.destinationCidr || selectedNode.routeTargetValue ? (
								<div className="rounded-md border bg-muted/20 p-2">
									<div className="mb-2 text-muted-foreground">Routing</div>
									<div className="space-y-1">
										{selectedNode.destinationCidr ? (
											<div className="flex items-center justify-between gap-3">
												<div className="text-muted-foreground">Destination</div>
												<div className="font-mono break-all">
													{selectedNode.destinationCidr}
												</div>
											</div>
										) : null}
										{selectedNode.routeTargetValue ? (
											<div className="flex items-center justify-between gap-3">
												<div className="text-muted-foreground">Target value</div>
												<div className="font-mono break-all">
													{selectedNode.routeTargetValue}
												</div>
											</div>
										) : null}
									</div>
								</div>
							) : null}
							{selectedNode.mapPublicIpOnLaunch ||
							selectedNode.availableIpAddressCount > 0 ? (
								<div className="rounded-md border bg-muted/20 p-2">
									<div className="space-y-1">
										<div className="flex items-center justify-between gap-3">
											<div className="text-muted-foreground">Auto-public IP</div>
											<div>
												{selectedNode.mapPublicIpOnLaunch ? "true" : "false"}
											</div>
										</div>
										{selectedNode.availableIpAddressCount > 0 ? (
											<div className="flex items-center justify-between gap-3">
												<div className="text-muted-foreground">Available IPs</div>
												<div>{selectedNode.availableIpAddressCount}</div>
											</div>
										) : null}
									</div>
								</div>
							) : null}
							<div className="text-muted-foreground">
								Connected resources: {Math.max(relatedNodeIDs.size - 1, 0)}
							</div>
							<div className="text-muted-foreground">
								Connected relationships: {relatedEdges.length}
							</div>
						</>
					) : (
						<>
							<div className="text-muted-foreground">
								Select a resource to inspect its normalized Terraform details.
							</div>
							<div className="grid grid-cols-2 gap-x-3 gap-y-1">
								<div className="text-muted-foreground">Resources</div>
								<div>{map.nodes.length}</div>
								<div className="text-muted-foreground">Relationships</div>
								<div>{map.edges.length}</div>
								<div className="text-muted-foreground">Unmapped</div>
								<div>{map.unmappedResources?.length ?? 0}</div>
								<div className="text-muted-foreground">Layout</div>
								<div className="uppercase">{layoutMode}</div>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
