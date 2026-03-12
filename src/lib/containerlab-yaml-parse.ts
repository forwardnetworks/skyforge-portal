import YAML from "yaml";

import {
	normalizeInterfaceList,
	splitEndpoint,
} from "./containerlab-yaml-helpers";
import type { LabDesign, LabDesignLink, LabDesignNode } from "./containerlab-yaml-types";

export function containerlabYamlToDesign(yamlContent: string): {
	design: LabDesign;
	warnings: string[];
} {
	const warnings: string[] = [];
	const parsed = YAML.parse(String(yamlContent ?? "").trim()) as
		| Record<string, unknown>
		| null
		| undefined;
	if (!parsed || typeof parsed !== "object") {
		throw new Error("Invalid containerlab YAML");
	}

	const topology = parsed.topology as Record<string, unknown> | undefined;
	if (!topology || typeof topology !== "object") {
		throw new Error("YAML missing topology");
	}

	const defaults = topology.defaults as Record<string, unknown> | undefined;
	const defaultKind = String(defaults?.kind ?? "").trim();
	const nodesRecord = topology.nodes as Record<string, unknown> | undefined;
	if (!nodesRecord || typeof nodesRecord !== "object") {
		throw new Error("YAML missing topology.nodes");
	}

	const designNodes: LabDesignNode[] = [];
	const layoutCols = Math.max(1, Math.ceil(Math.sqrt(Object.keys(nodesRecord).length)));
	let idx = 0;
	for (const [nodeName, nodeConfigAny] of Object.entries(nodesRecord)) {
		const nodeConfig =
			nodeConfigAny && typeof nodeConfigAny === "object"
				? (nodeConfigAny as Record<string, unknown>)
				: {};
		const envAny = nodeConfig.env;
		const env =
			envAny && typeof envAny === "object" && !Array.isArray(envAny)
				? Object.fromEntries(
						Object.entries(envAny as Record<string, unknown>).map(([key, value]) => [
							key,
							String(value ?? ""),
						]),
					)
				: undefined;

		designNodes.push({
			id: nodeName,
			label: nodeName,
			kind: String(nodeConfig.kind ?? defaultKind).trim(),
			image: String(nodeConfig.image ?? "").trim(),
			mgmtIpv4: String(nodeConfig.mgmt_ipv4 ?? "").trim() || undefined,
			startupConfig:
				String(nodeConfig["startup-config"] ?? "").trim() || undefined,
			env: env && Object.keys(env).length ? env : undefined,
			position: {
				x: 120 + (idx % layoutCols) * 260,
				y: 120 + Math.floor(idx / layoutCols) * 180,
			},
			interfaces: [],
		});
		idx += 1;
	}

	const linksArray = Array.isArray(topology.links)
		? (topology.links as Array<Record<string, unknown>>)
		: [];
	const nodeInterfaces = new Map<string, string[]>();
	const designLinks: LabDesignLink[] = linksArray.map((link, linkIdx) => {
		const endpoints = Array.isArray(link.endpoints) ? link.endpoints : [];
		const source = splitEndpoint(endpoints[0]);
		const target = splitEndpoint(endpoints[1]);
		if (!source || !target) {
			warnings.push(`Link ${linkIdx + 1}: missing endpoint(s)`);
		}
		if (source?.iface) {
			nodeInterfaces.set(source.node, [
				...(nodeInterfaces.get(source.node) ?? []),
				source.iface,
			]);
		}
		if (target?.iface) {
			nodeInterfaces.set(target.node, [
				...(nodeInterfaces.get(target.node) ?? []),
				target.iface,
			]);
		}
		const mtuRaw = Number(link.mtu);
		return {
			id: String(link.id ?? `e-${linkIdx + 1}`),
			source: source?.node ?? "",
			target: target?.node ?? "",
			sourceIf: source?.iface || undefined,
			targetIf: target?.iface || undefined,
			label: String(link.label ?? "").trim() || undefined,
			mtu: Number.isFinite(mtuRaw) ? mtuRaw : undefined,
		};
	});

	for (const node of designNodes) {
		node.interfaces = normalizeInterfaceList(
			node.interfaces,
			nodeInterfaces.get(node.id) ?? [],
		);
	}

	return {
		design: {
			name: String(parsed.name ?? "lab").trim() || "lab",
			defaultKind,
			nodes: designNodes,
			links: designLinks.filter((link) => link.source && link.target),
		},
		warnings,
	};
}
